-- ============================================================================
-- Migration: Create simulate_payment RPC with SECURITY DEFINER
-- Purpose: Allow authenticated users to simulate payment for their approved 
--          reservations without exposing direct INSERT policies on payments table
-- 
-- INSTRUCTIONS:
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to SQL Editor
-- 3. Copy and paste this entire script
-- 4. Click "Run" to execute
-- ============================================================================

-- Ensure required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Create function to simulate payment
create or replace function public.simulate_payment(
  p_reservation_id uuid,
  p_method text default 'cashea'
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_amount_bs numeric;
  v_res record;
  v_payment_id uuid := gen_random_uuid();
  v_upfront numeric;
  v_installments integer;
begin
  -- Check authentication
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  -- Validate method
  if p_method not in ('cashea', 'mercantil') then
    raise exception 'Invalid payment method. Must be cashea or mercantil';
  end if;

  -- Fetch reservation and validate ownership/status
  select r.*
  into v_res
  from public.reservations r
  where r.id = p_reservation_id;

  if not found then
    raise exception 'Reservation not found';
  end if;

  if v_res.renter_id is distinct from v_user then
    raise exception 'Reservation does not belong to this user';
  end if;

  if v_res.status <> 'approved' then
    raise exception 'Reservation is not approved';
  end if;

  -- Check if already paid
  if exists (select 1 from public.payments where reservation_id = p_reservation_id) then
    raise exception 'This reservation has already been paid';
  end if;

  -- Calculate amount (use existing total fields)
  v_amount_bs := coalesce(
    v_res.final_total_bs, 
    v_res.total_price_bs, 
    v_res.total, 
    100
  );

  if v_amount_bs is null or v_amount_bs <= 0 then
    v_amount_bs := 100; -- fallback minimum for demo
  end if;

  -- Calculate upfront and installments based on method
  if p_method = 'cashea' then
    v_upfront := round(v_amount_bs * 0.25, 2);
    v_installments := 3;
  else
    v_upfront := v_amount_bs;
    v_installments := 0;
  end if;

  -- Insert simulated payment
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
  );

  -- Update reservation payment status
  update public.reservations
  set payment_status = 'simulated',
      updated_at = now()
  where id = p_reservation_id;

  -- Log audit entry (if audit_logs table exists)
  insert into public.audit_logs (
    action,
    actor_id,
    entity_id,
    entity_type,
    metadata,
    created_at
  ) values (
    'payment_simulated',
    v_user,
    p_reservation_id,
    'reservation',
    jsonb_build_object(
      'payment_id', v_payment_id,
      'method', p_method,
      'amount_bs', v_amount_bs,
      'simulated', true
    ),
    now()
  );

  -- Return success payload
  return jsonb_build_object(
    'ok', true,
    'payment_id', v_payment_id,
    'amount_bs', v_amount_bs,
    'method', p_method,
    'message', 'Payment simulated successfully'
  );
exception
  when others then
    raise exception 'Error simulating payment: %', SQLERRM;
end;
$$;

-- Set permissions: revoke public, grant to authenticated users
revoke all on function public.simulate_payment(uuid, text) from public;
grant execute on function public.simulate_payment(uuid, text) to authenticated;

-- ============================================================================
-- RLS Policies for payments table
-- ============================================================================

-- Enable RLS on payments if not already enabled
alter table public.payments enable row level security;

-- Policy: Renters can view their own payments
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
    and tablename = 'payments' 
    and policyname = 'renter_can_select_own_payments'
  ) then
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
  end if;
end $$;

-- Policy: Owners can view payments for their reservations
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
    and tablename = 'payments' 
    and policyname = 'owner_can_select_reservation_payments'
  ) then
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
  end if;
end $$;

-- ============================================================================
-- RLS Policies for reservations table
-- ============================================================================

-- Enable RLS on reservations if not already enabled
alter table public.reservations enable row level security;

-- Policy: Renters can view their own reservations
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
    and tablename = 'reservations' 
    and policyname = 'renter_can_select_own_reservations'
  ) then
    create policy "renter_can_select_own_reservations"
    on public.reservations
    for select
    to authenticated
    using (renter_id = auth.uid());
  end if;
end $$;

-- Policy: Owners can view reservations for their vehicles
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
    and tablename = 'reservations' 
    and policyname = 'owner_can_select_vehicle_reservations'
  ) then
    create policy "owner_can_select_vehicle_reservations"
    on public.reservations
    for select
    to authenticated
    using (owner_id = auth.uid());
  end if;
end $$;

-- Comment for documentation
comment on function public.simulate_payment(uuid, text) is 
  'Simulates a payment for an approved reservation. Uses SECURITY DEFINER to bypass RLS policies safely. Only allows the renter to pay their own approved reservations.';

-- ============================================================================
-- Verification query (run after migration to verify it worked)
-- ============================================================================
-- SELECT routine_name, routine_type 
-- FROM information_schema.routines 
-- WHERE routine_schema = 'public' 
-- AND routine_name = 'simulate_payment';
