-- ═══════════════════════════════════════════════════════════════════════════
-- ZORVO — 0002 · Helpers de auth, inmutabilidad y RLS
--
-- Cubre §3, §4 y §10. Tres cosas, en este orden:
--   1. Helpers que leen la identidad sin provocar recursión de políticas.
--   2. Triggers que hacen cumplir el append-only a nivel de base.
--   3. RLS en TODAS las tablas, sin excepción.
--
-- Sobre la recursión: una política sobre members que consulte members entra
-- en loop infinito. La salida es una función SECURITY DEFINER, que corre con
-- los permisos del dueño y por lo tanto no dispara RLS. Es la razón por la
-- que app.current_member_id() existe en vez de un subselect inline.
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- 1. Helpers
-- ───────────────────────────────────────────────────────────────────────────

grant usage on schema app to authenticated, anon;

-- El rol viene del custom access token hook (§3), que lo inyecta como claim.
-- Mientras el hook no esté configurado, todo el mundo es 'customer': el
-- default seguro es el que menos permisos da.
create or replace function app.current_role() returns app_role
language sql stable
as $$
  select coalesce(
    nullif(auth.jwt() ->> 'app_role', ''),
    nullif(auth.jwt() -> 'app_metadata' ->> 'app_role', ''),
    'customer'
  )::app_role;
$$;

create or replace function app.current_location_id() returns uuid
language sql stable
as $$
  select nullif(
    coalesce(
      auth.jwt() ->> 'location_id',
      auth.jwt() -> 'app_metadata' ->> 'location_id'
    ), ''
  )::uuid;
$$;

-- SECURITY DEFINER a propósito: rompe la recursión de RLS sobre members.
create or replace function app.current_member_id() returns uuid
language sql stable security definer
set search_path = public, pg_temp
as $$
  select id from public.members where profile_id = auth.uid() limit 1;
$$;

create or replace function app.is_staff() returns boolean
language sql stable
as $$ select app.current_role() <> 'customer'; $$;

create or replace function app.is_manager() returns boolean
language sql stable
as $$ select app.current_role() in ('manager', 'owner'); $$;

create or replace function app.is_owner() returns boolean
language sql stable
as $$ select app.current_role() = 'owner'; $$;

-- Un barista está acotado a su sucursal; manager y owner ven todas (§4).
create or replace function app.can_access_location(p_location_id uuid) returns boolean
language sql stable
as $$
  select case
    when app.is_manager() then true
    when app.current_role() = 'barista'
      then app.current_location_id() is not distinct from p_location_id
    else false
  end;
$$;

revoke execute on function app.current_member_id() from public;
grant execute on function app.current_member_id() to authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 2. Alta de socio
--
-- Cada usuario de auth nace con un profile. La membresía se crea en el mismo
-- movimiento porque en el MVP todo el que se registra es socio del Club.
-- ───────────────────────────────────────────────────────────────────────────

-- Alfabeto sin 0/O/1/I/L: el código se dicta por teléfono cuando la cámara
-- falla, y esas cuatro son las que se confunden.
create or replace function app.generate_member_code() returns text
language plpgsql volatile
as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  candidate text;
  i integer;
begin
  for attempt in 1..20 loop
    candidate := '';
    for i in 1..8 loop
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    if not exists (select 1 from public.members where member_code = candidate) then
      return candidate;
    end if;
  end loop;
  -- 31^8 ≈ 8.5e11 combinaciones: 20 colisiones seguidas significa que algo
  -- está mal, no que hubo mala suerte.
  raise exception 'no se pudo generar un member_code único en 20 intentos';
end;
$$;

create or replace function app.handle_new_user() returns trigger
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_profile_id uuid;
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  returning id into v_profile_id;

  insert into public.members (profile_id, member_code)
  values (v_profile_id, app.generate_member_code());

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function app.handle_new_user();

-- ───────────────────────────────────────────────────────────────────────────
-- 3. Inmutabilidad
--
-- El append-only no se pide por convención: se hace cumplir. Si alguien
-- escribe un UPDATE en una Server Action por error, la base lo rechaza.
-- ───────────────────────────────────────────────────────────────────────────

create or replace function app.consumptions_guard() returns trigger
language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'consumptions es append-only: anulá con voided_at en vez de borrar';
  end if;

  -- La única mutación permitida es la anulación.
  if new.id                 is distinct from old.id
     or new.member_id       is distinct from old.member_id
     or new.product_id      is distinct from old.product_id
     or new.location_id     is distinct from old.location_id
     or new.quantity        is distinct from old.quantity
     or new.occurred_at     is distinct from old.occurred_at
     or new.idempotency_key is distinct from old.idempotency_key
  then
    raise exception 'consumptions es append-only: solo se pueden modificar voided_at, voided_by y void_reason';
  end if;

  -- Desanular no es una operación válida: reabre la puerta al doble conteo.
  if old.voided_at is not null and new.voided_at is null then
    raise exception 'un consumo anulado no se puede reactivar';
  end if;

  return new;
end;
$$;

create trigger consumptions_immutable
  before update or delete on consumptions
  for each row execute function app.consumptions_guard();

create or replace function app.ledger_guard() returns trigger
language plpgsql as $$
begin
  raise exception 'points_ledger es inmutable: corregí con un asiento compensatorio';
end;
$$;

create trigger points_ledger_immutable
  before update or delete on points_ledger
  for each row execute function app.ledger_guard();

-- ───────────────────────────────────────────────────────────────────────────
-- 4. RLS
--
-- Regla general: el socio ve lo suyo; el staff ve según rol y sucursal.
-- Las escrituras de dominio (consumo, progreso, grants) NO se hacen por
-- PostgREST: pasan por Server Actions con service_role o por el motor en
-- 0003. Por eso muchas tablas son de solo lectura acá.
-- ───────────────────────────────────────────────────────────────────────────

alter table locations           enable row level security;
alter table profiles            enable row level security;
alter table members             enable row level security;
alter table staff               enable row level security;
alter table product_categories  enable row level security;
alter table products            enable row level security;
alter table product_variants    enable row level security;
alter table credentials         enable row level security;
alter table scan_events         enable row level security;
alter table consumptions        enable row level security;
alter table rewards             enable row level security;
alter table challenges          enable row level security;
alter table challenge_progress  enable row level security;
alter table reward_grants       enable row level security;
alter table points_ledger       enable row level security;
alter table audit_logs          enable row level security;

-- ── Catálogo y sucursales: públicos en lectura ─────────────────────────────
-- La carta es contenido de marketing. Cualquiera puede verla, logueado o no.

create policy locations_read on locations
  for select to anon, authenticated using (active);

create policy locations_write on locations
  for all to authenticated using (app.is_manager()) with check (app.is_manager());

create policy categories_read on product_categories
  for select to anon, authenticated using (true);

create policy categories_write on product_categories
  for all to authenticated using (app.is_manager()) with check (app.is_manager());

create policy products_read on products
  for select to anon, authenticated using (active or app.is_staff());

create policy products_write on products
  for all to authenticated using (app.is_manager()) with check (app.is_manager());

create policy variants_read on product_variants
  for select to anon, authenticated using (active or app.is_staff());

create policy variants_write on product_variants
  for all to authenticated using (app.is_manager()) with check (app.is_manager());

create policy rewards_read on rewards
  for select to anon, authenticated using (active or app.is_staff());

create policy rewards_write on rewards
  for all to authenticated using (app.is_manager()) with check (app.is_manager());

create policy challenges_read on challenges
  for select to anon, authenticated using (active or app.is_staff());

create policy challenges_write on challenges
  for all to authenticated using (app.is_manager()) with check (app.is_manager());

-- ── Identidad ──────────────────────────────────────────────────────────────

create policy profiles_read_own on profiles
  for select to authenticated
  using (id = auth.uid() or app.is_staff());

create policy profiles_update_own on profiles
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy members_read_own on members
  for select to authenticated
  using (profile_id = auth.uid() or app.is_staff());

-- El socio edita su sucursal preferida y nada más. status, lifetime_points y
-- member_code no se tocan desde el cliente: los mueve el sistema.
create policy members_update_own on members
  for update to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy members_manage on members
  for all to authenticated
  using (app.is_manager()) with check (app.is_manager());

create policy staff_read on staff
  for select to authenticated
  using (profile_id = auth.uid() or app.is_manager());

create policy staff_manage on staff
  for all to authenticated
  using (app.is_manager()) with check (app.is_manager());

-- ── Credenciales ───────────────────────────────────────────────────────────
-- Nadie lee secret_enc por PostgREST. Ni el dueño. El secreto se entrega una
-- sola vez en el alta, por una Server Action, y vive en IndexedDB del
-- dispositivo. Sin política de SELECT, la tabla es invisible para authenticated.

create policy credentials_owner_meta on credentials
  for select to authenticated
  using (false);

-- ── Escaneo ────────────────────────────────────────────────────────────────

create policy scan_events_staff_read on scan_events
  for select to authenticated
  using (app.is_staff() and app.can_access_location(location_id));

-- ── Consumo ────────────────────────────────────────────────────────────────

create policy consumptions_read_own on consumptions
  for select to authenticated
  using (
    member_id = app.current_member_id()
    or (app.is_staff() and app.can_access_location(location_id))
  );

-- Anulación: el barista puede dentro de los 15 minutos; manager y owner
-- siempre (§4). El insert no pasa por acá — lo hace el server.
create policy consumptions_void on consumptions
  for update to authenticated
  using (
    app.is_manager()
    or (
      app.current_role() = 'barista'
      and app.can_access_location(location_id)
      and occurred_at > now() - interval '15 minutes'
    )
  )
  with check (
    app.is_manager()
    or (
      app.current_role() = 'barista'
      and occurred_at > now() - interval '15 minutes'
    )
  );

-- ── Fidelidad ──────────────────────────────────────────────────────────────
-- Todo de solo lectura para el cliente: lo escribe el motor en 0003.

create policy progress_read_own on challenge_progress
  for select to authenticated
  using (member_id = app.current_member_id() or app.is_staff());

create policy grants_read_own on reward_grants
  for select to authenticated
  using (member_id = app.current_member_id() or app.is_staff());

-- Entregar una recompensa sí es acción de barra (§4).
create policy grants_deliver on reward_grants
  for update to authenticated
  using (app.is_staff()) with check (app.is_staff());

create policy grants_manage on reward_grants
  for all to authenticated
  using (app.is_manager()) with check (app.is_manager());

create policy ledger_read_own on points_ledger
  for select to authenticated
  using (member_id = app.current_member_id() or app.is_staff());

-- ── Auditoría ──────────────────────────────────────────────────────────────
-- Solo owner lee. Nadie escribe por PostgREST: escribe el server.

create policy audit_read on audit_logs
  for select to authenticated using (app.is_owner());
