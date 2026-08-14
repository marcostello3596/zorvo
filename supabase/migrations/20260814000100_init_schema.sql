-- ═══════════════════════════════════════════════════════════════════════════
-- ZORVO — 0001 · Esquema inicial
--
-- Cubre §5 del documento de arquitectura: identidad, catálogo, el evento de
-- consumo, credenciales, el motor de fidelidad y auditoría.
--
-- Principios que esta migración sostiene y que no hay que romper después:
--   · consumptions es APPEND-ONLY. Se anula con voided_at, nunca se borra.
--     Todo el progreso es una función de esta tabla y tiene que ser
--     reconstruible desde cero.
--   · La idempotencia es estructural, no defensiva: UNIQUE en la base, no
--     un "if ya existe" en Node. Ver 0003 para el motor.
--   · Lo marcado [V2] no existe todavía. No se crean tablas vacías por si acaso.
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";   -- gen_random_uuid, digest
create extension if not exists "citext";     -- email case-insensitive

-- Esquema propio para helpers. No se expone por PostgREST.
create schema if not exists app;

-- ───────────────────────────────────────────────────────────────────────────
-- Enums
-- ───────────────────────────────────────────────────────────────────────────

create type app_role         as enum ('customer', 'barista', 'manager', 'owner');
create type member_status    as enum ('active', 'paused', 'blocked');
create type consumption_src  as enum ('scan', 'manual', 'import', 'order');
create type credential_kind  as enum ('rotating', 'wallet_static');
create type scan_result      as enum ('ok', 'expired', 'replay', 'invalid', 'revoked', 'unknown');
create type challenge_kind   as enum ('COLLECTION', 'COUNT', 'STREAK', 'VISIT', 'MANUAL');
create type challenge_cycle  as enum ('none', 'weekly', 'monthly');
create type grant_status     as enum ('unlocked', 'reserved', 'delivered', 'expired', 'revoked');

-- ───────────────────────────────────────────────────────────────────────────
-- Identidad y organización
--
-- profiles es identidad; members es pertenencia al Club. Separados a
-- propósito: un barista también puede ser socio.
-- ───────────────────────────────────────────────────────────────────────────

create table locations (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  address     text,
  timezone    text not null default 'America/Argentina/Buenos_Aires',
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  display_name      text,
  email             citext,
  phone             text,
  birthdate         date,
  avatar_url        text,
  locale            text not null default 'es-AR',
  marketing_opt_in  boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- member_code: 8 caracteres legibles, el fallback humano cuando la cámara
-- falla. Alfabeto sin 0/O/1/I/L para que se pueda dictar por teléfono.
create table members (
  id                uuid primary key default gen_random_uuid(),
  profile_id        uuid not null unique references profiles (id) on delete cascade,
  member_code       text not null unique,
  status            member_status not null default 'active',
  home_location_id  uuid references locations (id),
  lifetime_points   integer not null default 0,
  joined_at         timestamptz not null default now(),
  constraint member_code_shape check (member_code ~ '^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$')
);

create index members_home_location_idx on members (home_location_id);

create table staff (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references profiles (id) on delete cascade,
  role         app_role not null default 'barista',
  location_id  uuid references locations (id),
  pin_hash     text,
  active       boolean not null default true,
  hired_at     timestamptz not null default now(),
  unique (profile_id, location_id),
  -- customer no es un rol de staff: si alguien está en esta tabla, opera.
  constraint staff_role_is_operational check (role <> 'customer')
);

create index staff_profile_idx  on staff (profile_id) where active;
create index staff_location_idx on staff (location_id) where active;

-- ───────────────────────────────────────────────────────────────────────────
-- Catálogo
-- ───────────────────────────────────────────────────────────────────────────

create table product_categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  sort_order  integer not null default 0
);

-- counts_for_collection es la columna que responde "probó todos los cafés de
-- la carta": distingue un flat white (cuenta) de una medialuna (no cuenta).
create table products (
  id                     uuid primary key default gen_random_uuid(),
  sku                    text not null unique,
  name                   text not null,
  category_id            uuid references product_categories (id),
  description            text,
  image_url              text,
  active                 boolean not null default true,
  counts_for_collection  boolean not null default false,
  sort_order             integer not null default 0,
  created_at             timestamptz not null default now()
);

create index products_category_idx   on products (category_id);
create index products_collection_idx on products (counts_for_collection) where active;

create table product_variants (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products (id) on delete cascade,
  name        text not null,
  price_cents integer check (price_cents >= 0),
  active      boolean not null default true,
  is_default  boolean not null default false
);

create index product_variants_product_idx on product_variants (product_id);
-- Una sola variante default por producto.
create unique index product_variants_one_default
  on product_variants (product_id) where is_default;

-- ───────────────────────────────────────────────────────────────────────────
-- Credenciales y escaneo
-- ───────────────────────────────────────────────────────────────────────────

-- secret_enc: el secreto HMAC del socio. En producción se cifra con pgsodium
-- / Vault (§10). Acá se guarda como bytea para no fijar el mecanismo todavía;
-- la app nunca lo lee por PostgREST — RLS lo bloquea para todos (ver 0002).
create table credentials (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references members (id) on delete cascade,
  kind        credential_kind not null default 'rotating',
  secret_enc  bytea not null,
  version     integer not null default 1,
  issued_at   timestamptz not null default now(),
  revoked_at  timestamptz
);

-- Una credencial viva por socio y por tipo.
create unique index credentials_one_active
  on credentials (member_id, kind) where revoked_at is null;

-- El anti-replay del §6: UNIQUE(member_id, kind, token_step) hace que el mismo
-- código no se pueda usar dos veces. Una captura de pantalla vale 30 segundos
-- y solo si nadie la usó antes.
create table scan_events (
  id           uuid primary key default gen_random_uuid(),
  member_id    uuid references members (id) on delete set null,
  staff_id     uuid references staff (id),
  location_id  uuid not null references locations (id),
  device_id    text,
  kind         credential_kind not null,
  token_step   bigint,
  result       scan_result not null,
  created_at   timestamptz not null default now()
);

create unique index scan_events_no_replay
  on scan_events (member_id, kind, token_step)
  where member_id is not null and token_step is not null and result = 'ok';

create index scan_events_recent_idx on scan_events (created_at desc);

-- ───────────────────────────────────────────────────────────────────────────
-- El evento central
--
-- APPEND-ONLY. La única mutación permitida es la anulación (voided_at), y
-- está forzada por trigger en 0002.
-- ───────────────────────────────────────────────────────────────────────────

create table consumptions (
  id                  uuid primary key default gen_random_uuid(),
  member_id           uuid not null references members (id) on delete cascade,
  product_id          uuid not null references products (id),
  product_variant_id  uuid references product_variants (id),
  location_id         uuid not null references locations (id),
  staff_id            uuid references staff (id),
  scan_event_id       uuid references scan_events (id),
  quantity            integer not null default 1 check (quantity > 0),
  unit_price_cents    integer check (unit_price_cents >= 0),
  source              consumption_src not null default 'scan',
  occurred_at         timestamptz not null default now(),
  voided_at           timestamptz,
  voided_by           uuid references staff (id),
  void_reason         text,
  -- hash(member_id, product_id, token_step). Es lo que hace que un doble tap
  -- del barista, o un reintento de red, no cuente dos cafés.
  idempotency_key     text not null unique default gen_random_uuid()::text,
  created_at          timestamptz not null default now(),
  constraint void_is_complete check (
    (voided_at is null and voided_by is null)
    or (voided_at is not null and voided_by is not null)
  )
);

create index consumptions_member_idx  on consumptions (member_id, occurred_at desc);
create index consumptions_product_idx on consumptions (product_id);
-- El motor de fidelidad solo mira consumos vivos: índice parcial.
create index consumptions_live_idx
  on consumptions (member_id, product_id) where voided_at is null;

-- ───────────────────────────────────────────────────────────────────────────
-- Motor de fidelidad
--
-- challenges es declarativo: agregar un recorrido nuevo es INSERTAR UNA FILA,
-- no desplegar código. Ver §5 para la forma de config por kind.
-- ───────────────────────────────────────────────────────────────────────────

create table rewards (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null unique,
  name                text not null,
  description         text,
  kind                text not null default 'physical',
  config              jsonb not null default '{}'::jsonb,
  image_url           text,
  stock               integer check (stock >= 0),
  requires_fulfilment boolean not null default true,
  active              boolean not null default true
);

create table challenges (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  name          text not null,
  description   text,
  kind          challenge_kind not null,
  config        jsonb not null default '{}'::jsonb,
  reward_id     uuid references rewards (id),
  points_award  integer not null default 0,
  repeatable    boolean not null default false,
  cycle         challenge_cycle not null default 'none',
  starts_at     timestamptz,
  ends_at       timestamptz,
  location_id   uuid references locations (id),
  active        boolean not null default true,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  -- Un desafío con ciclo tiene que ser repetible; si no, el cycle_key no
  -- significa nada y el segundo ciclo nunca podría otorgarse.
  constraint cycle_needs_repeatable check (cycle = 'none' or repeatable)
);

create index challenges_active_idx on challenges (active, sort_order);

-- cycle_key: 'default' para cycle='none', 'YYYY-MM' para monthly,
-- 'IYYY-IW' para weekly. Es lo que permite que un desafío mensual tenga
-- una fila de progreso por mes sin tablas extra.
create table challenge_progress (
  id            uuid primary key default gen_random_uuid(),
  member_id     uuid not null references members (id) on delete cascade,
  challenge_id  uuid not null references challenges (id) on delete cascade,
  cycle_key     text not null default 'default',
  state         jsonb not null default '{}'::jsonb,
  progress_num  integer not null default 0,
  progress_den  integer not null default 0,
  completed_at  timestamptz,
  updated_at    timestamptz not null default now(),
  unique (member_id, challenge_id, cycle_key)
);

create index challenge_progress_member_idx on challenge_progress (member_id);

-- La UNIQUE de idempotency_key es lo que hace estructuralmente imposible
-- entregar dos gorras. No es una validación: es una restricción de la base
-- dentro de la transacción del trigger.
create table reward_grants (
  id               uuid primary key default gen_random_uuid(),
  member_id        uuid not null references members (id) on delete cascade,
  reward_id        uuid not null references rewards (id),
  challenge_id     uuid references challenges (id),
  status           grant_status not null default 'unlocked',
  granted_at       timestamptz not null default now(),
  expires_at       timestamptz,
  delivered_at     timestamptz,
  delivered_by     uuid references staff (id),
  delivery_note    text,
  idempotency_key  text not null unique
);

create index reward_grants_member_idx  on reward_grants (member_id, granted_at desc);
create index reward_grants_pending_idx on reward_grants (status) where status = 'unlocked';

-- Append-only, inmutable. Forzado por trigger en 0002.
create table points_ledger (
  id            uuid primary key default gen_random_uuid(),
  member_id     uuid not null references members (id) on delete cascade,
  delta         integer not null,
  reason        text not null,
  ref_type      text,
  ref_id        uuid,
  balance_after integer not null,
  created_at    timestamptz not null default now()
);

create index points_ledger_member_idx on points_ledger (member_id, created_at desc);
-- Un solo asiento por origen: evita doble acreditación por reintento.
create unique index points_ledger_once_per_ref
  on points_ledger (member_id, ref_type, ref_id)
  where ref_type is not null and ref_id is not null;

-- ───────────────────────────────────────────────────────────────────────────
-- Auditoría (§10 — obligatoria para anulaciones, otorgamientos y ABM)
-- ───────────────────────────────────────────────────────────────────────────

create table audit_logs (
  id                uuid primary key default gen_random_uuid(),
  actor_profile_id  uuid references profiles (id),
  action            text not null,
  entity            text not null,
  entity_id         uuid,
  before            jsonb,
  after             jsonb,
  ip                inet,
  created_at        timestamptz not null default now()
);

create index audit_logs_entity_idx on audit_logs (entity, entity_id, created_at desc);

-- ───────────────────────────────────────────────────────────────────────────
-- updated_at automático
-- ───────────────────────────────────────────────────────────────────────────

create or replace function app.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch before update on profiles
  for each row execute function app.touch_updated_at();
