-- ============================================================================
-- RPC simulate_payment: SIEMPRE aprueba pago simulado (sin validaciones)
-- Con wrapper de firma inversa + políticas RLS de emergencia
-- ============================================================================

-- Asegurar extensiones
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ============================================================================
-- VERSIÓN CANÓNICA: firma EXACTA que espera el cliente
-- public.simulate_payment(p_method text, p_reservation_id uuid)
-- ============================================================================
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
  -- SIN VALIDACIONES: siempre aprobar simulación para DEMO
  -- Monto: intentar tomar total_bs de la reserva; si no, 1 Bs mínimo
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

  -- Fallback si no se encuentra la reserva o monto inválido
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
  on conflict (reservation_id) do nothing
  returning id into v_payment_id;

  -- Si ya existía el pago, obtener el ID existente
  if v_payment_id is null then
    select id into v_payment_id 
    from public.payments 
    where reservation_id = p_reservation_id 
    limit 1;
  end if;

  -- Actualizar reserva a pagada/simulada (sin tocar status si ya está en otro estado)
  update public.reservations
  set payment_status = 'simulated',
      updated_at = now()
  where id = p_reservation_id;

  -- Log audit (opcional, ignora si la tabla no existe)
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
    -- ignore si audit_logs no existe
    null;
  end;

  -- Retornar payload de éxito
  return jsonb_build_object(
    'ok', true,
    'payment_id', v_payment_id,
    'amount_bs', v_amount_bs,
    'method', p_method,
    'message', 'Payment simulated successfully (auto-approved for demo)'
  );
exception
  when others then
    -- Aun si hay error, intentar retornar algo válido
    return jsonb_build_object(
      'ok', false,
      'error', SQLERRM,
      'amount_bs', v_amount_bs
    );
end;
$$;

-- ============================================================================
-- WRAPPER con firma inversa para llamadas antiguas
-- public.simulate_payment(p_reservation_id uuid, p_method text)
-- ============================================================================
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

-- ============================================================================
-- Permisos de ejecución
-- ============================================================================
revoke all on function public.simulate_payment(text, uuid) from public;
revoke all on function public.simulate_payment(uuid, text) from public;
grant execute on function public.simulate_payment(text, uuid) to authenticated;
grant execute on function public.simulate_payment(uuid, text) to authenticated;

-- ============================================================================
-- Políticas RLS de emergencia para DEMO (fallback directo desde cliente)
-- ============================================================================

-- Habilitar RLS en payments y reservations si no está habilitado
alter table public.payments enable row level security;
alter table public.reservations enable row level security;

-- Política: Permite INSERT de pagos simulados del propio usuario
do $$
begin
  -- Drop si existe para recrear
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
end$$;

-- Política: Permite actualizar payment_status a simulated/paid
do $$
begin
  -- Drop si existe para recrear
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
end$$;

-- ============================================================================
-- Recargar la caché de esquema de PostgREST
-- ============================================================================
notify pgrst, 'reload schema';

-- ============================================================================
-- Comentarios de documentación
-- ============================================================================
comment on function public.simulate_payment(text, uuid) is 
  'DEMO: Simula pago sin validaciones. Firma: (p_method text, p_reservation_id uuid). Siempre aprueba para demo.';

comment on function public.simulate_payment(uuid, text) is 
  'DEMO: Wrapper con firma inversa (p_reservation_id uuid, p_method text) para compatibilidad.';

-- ============================================================================
-- Consulta de verificación (descomentar para ejecutar después)
-- ============================================================================
-- SELECT 
--   proname as function_name,
--   pg_get_function_arguments(oid) as arguments,
--   pg_get_function_result(oid) as return_type
-- FROM pg_proc 
-- WHERE proname = 'simulate_payment' 
--   AND pronamespace = 'public'::regnamespace;
