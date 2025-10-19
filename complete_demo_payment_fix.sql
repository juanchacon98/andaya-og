-- ============================================================================
-- DEMO PAYMENT FIX: RPC + Vista Profiles + RLS + Recarga de Caché
-- Ejecutar TODO junto para evitar errores de schema cache, RLS y 400 en profiles
-- ============================================================================

-- ====== EXTENSIONES ======
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ====== COLUMNAS REQUERIDAS ======
-- Asegurar columna payment_status en reservations
do $$
begin
  if not exists (
    select 1 from information_schema.columns
     where table_schema='public' and table_name='reservations' and column_name='payment_status'
  ) then
    alter table public.reservations
      add column payment_status text default null;
  end if;
end$$;

-- Asegurar columna kyc_status en profiles (si no existe)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
     where table_schema='public' and table_name='profiles' and column_name='kyc_status'
  ) then
    alter table public.profiles
      add column kyc_status text default 'pending';
  end if;
end$$;

-- ====== VISTA PARA PROFILES (evita 400 por columnas no vistas) ======
-- Vista estable con columnas básicas expuestas
create or replace view public.v_profiles_basic as
select 
  id, 
  full_name, 
  phone,
  coalesce(kyc_status, 'pending') as kyc_status,
  created_at,
  updated_at
from public.profiles;

-- Habilitar RLS en la vista
alter view public.v_profiles_basic set (security_barrier = true);

-- Grant de lectura a authenticated
grant select on public.v_profiles_basic to authenticated;

-- Política de lectura en la vista
drop policy if exists "profiles_basic_self_read" on public.v_profiles_basic;
create policy "profiles_basic_self_read"
on public.v_profiles_basic
for select
to authenticated
using (
  id = auth.uid()
  or exists (
    select 1 from public.user_roles ur 
    where ur.user_id = auth.uid() 
    and ur.role in ('admin_primary','admin_security')
  )
);

-- ====== RPC PRINCIPAL (firma canónica) ======
-- public.simulate_payment(p_method text, p_reservation_id uuid)
create or replace function public.simulate_payment(
  p_method text,
  p_reservation_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_payment_id uuid := gen_random_uuid();
  v_amount_bs numeric := 0;
  v_upfront numeric;
  v_installments integer;
begin
  -- DEMO: aprobar siempre (sin validar estado); toma total_bs si existe
  select coalesce(
    r.final_total_bs,
    r.total_price_bs,
    r.total_bs, 
    r.total, 
    r.amount_bs, 
    100
  )
  into v_amount_bs
  from public.reservations r
  where r.id = p_reservation_id;

  if v_amount_bs is null or v_amount_bs <= 0 then
    v_amount_bs := 100; -- monto mínimo para demo
  end if;

  -- Calcular upfront e installments según método
  if p_method = 'cashea' then
    v_upfront := round(v_amount_bs * 0.25, 2);
    v_installments := 3;
  else
    v_upfront := v_amount_bs;
    v_installments := 0;
  end if;

  -- Insertar pago simulado (on conflict do nothing para idempotencia)
  insert into public.payments (
    id, 
    reservation_id, 
    method, 
    amount_total,
    upfront,
    installments,
    currency, 
    status,
    provider_ref,
    created_at
  ) values (
    v_payment_id, 
    p_reservation_id, 
    case when p_method = 'cashea' then 'cashea_sim' else 'full' end,
    v_amount_bs,
    v_upfront,
    v_installments,
    'Bs', 
    'paid',
    'SIM-' || upper(p_method) || '-' || extract(epoch from now())::text,
    now()
  )
  on conflict (reservation_id) do update
  set updated_at = now()
  returning id into v_payment_id;

  -- Si no se insertó ni actualizó, obtener el existente
  if v_payment_id is null then
    select id into v_payment_id 
    from public.payments 
    where reservation_id = p_reservation_id 
    limit 1;
  end if;

  -- Actualizar reserva a pagada/simulada
  update public.reservations
  set payment_status = 'simulated',
      updated_at = now()
  where id = p_reservation_id;

  -- Log audit (opcional, ignora si tabla no existe)
  begin
    insert into public.audit_logs (
      action,
      actor_id,
      entity_id,
      entity_type,
      metadata,
      created_at
    ) values (
      'payment_simulated_demo',
      v_user,
      p_reservation_id,
      'reservation',
      jsonb_build_object(
        'payment_id', v_payment_id,
        'method', p_method,
        'amount_bs', v_amount_bs,
        'simulated', true,
        'auto_approved', true
      ),
      now()
    );
  exception when undefined_table then
    null;
  end;

  return jsonb_build_object(
    'ok', true,
    'payment_id', v_payment_id,
    'amount_bs', v_amount_bs,
    'method', p_method,
    'message', 'Payment simulated successfully'
  );
exception
  when others then
    -- Retornar error estructurado
    return jsonb_build_object(
      'ok', false,
      'error', SQLERRM,
      'amount_bs', coalesce(v_amount_bs, 0)
    );
end;
$$;

-- ====== WRAPPER (firma inversa) ======
-- public.simulate_payment(p_reservation_id uuid, p_method text)
create or replace function public.simulate_payment(
  p_reservation_id uuid,
  p_method text
) returns jsonb
language sql
security definer
set search_path = public
as $$
  select public.simulate_payment(p_method, p_reservation_id);
$$;

-- ====== PERMISOS PARA RPC ======
revoke all on function public.simulate_payment(text, uuid) from public;
revoke all on function public.simulate_payment(uuid, text) from public;
grant execute on function public.simulate_payment(text, uuid) to authenticated;
grant execute on function public.simulate_payment(uuid, text) to authenticated;

-- ====== RLS DE DEMO (FALLBACK DIRECTO SI RPC FALLA) ======
-- Habilitar RLS en payments y reservations si no está
alter table public.payments enable row level security;
alter table public.reservations enable row level security;

-- Política: Permite INSERT de pagos simulados del propio usuario
drop policy if exists "demo_allow_insert_simulated_payments" on public.payments;
create policy "demo_allow_insert_simulated_payments"
on public.payments
for insert
to authenticated
with check (
  currency = 'Bs'
  and exists (
    select 1 from public.reservations r
    where r.id = payments.reservation_id 
      and r.renter_id = auth.uid()
  )
);

-- Política: SELECT de pagos propios
drop policy if exists "renter_can_select_own_payments" on public.payments;
create policy "renter_can_select_own_payments"
on public.payments
for select
to authenticated
using (
  exists (
    select 1 from public.reservations r
    where r.id = payments.reservation_id
      and r.renter_id = auth.uid()
  )
);

-- Política: Owners pueden ver pagos de sus reservas
drop policy if exists "owner_can_select_reservation_payments" on public.payments;
create policy "owner_can_select_reservation_payments"
on public.payments
for select
to authenticated
using (
  exists (
    select 1 from public.reservations r
    where r.id = payments.reservation_id
      and r.owner_id = auth.uid()
  )
);

-- Política: Permite actualizar payment_status a simulated/paid
drop policy if exists "demo_renter_update_payment_status" on public.reservations;
create policy "demo_renter_update_payment_status"
on public.reservations
for update
to authenticated
using (renter_id = auth.uid())
with check (
  renter_id = auth.uid()
  and payment_status in ('simulated', 'paid')
);

-- Política: Renters pueden ver sus reservas
drop policy if exists "renter_can_select_own_reservations" on public.reservations;
create policy "renter_can_select_own_reservations"
on public.reservations
for select
to authenticated
using (renter_id = auth.uid());

-- Política: Owners pueden ver reservas de sus vehículos
drop policy if exists "owner_can_select_vehicle_reservations" on public.reservations;
create policy "owner_can_select_vehicle_reservations"
on public.reservations
for select
to authenticated
using (owner_id = auth.uid());

-- ====== REFRESCAR CACHÉ DE POSTGREST ======
-- Evita los 404/"Could not find the function … in the schema cache"
notify pgrst, 'reload schema';

-- ====== COMENTARIOS DE DOCUMENTACIÓN ======
comment on function public.simulate_payment(text, uuid) is 
  'DEMO: Simula pago sin validaciones. Firma canónica: (p_method text, p_reservation_id uuid). Siempre aprueba.';

comment on function public.simulate_payment(uuid, text) is 
  'DEMO: Wrapper con firma inversa (p_reservation_id uuid, p_method text) para compatibilidad.';

comment on view public.v_profiles_basic is
  'Vista básica de profiles con columnas expuestas. Evita 400 por columnas no accesibles.';

-- ====== VERIFICACIÓN (descomentar para ejecutar después) ======
-- Verificar RPCs creados:
-- SELECT 
--   proname as function_name,
--   pg_get_function_arguments(oid) as arguments,
--   pg_get_function_result(oid) as return_type
-- FROM pg_proc 
-- WHERE proname = 'simulate_payment' 
--   AND pronamespace = 'public'::regnamespace;

-- Verificar vista:
-- SELECT * FROM public.v_profiles_basic LIMIT 1;

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================
