-- ═══════════════════════════════════════════════════════════════════════════
-- ZORVO — pgTAP · Motor de fidelidad
--
-- Reproduce los ocho escenarios del §14 del documento de arquitectura, que
-- son los que pueden romper el modelo. Si estos pasan, el motor sirve.
--
-- CON Docker:    supabase test db
-- SIN Docker:    activá pgtap (Database → Extensions) y pegá este archivo
--                entero en el SQL Editor.
--
-- Requiere el seed aplicado (supabase/seed.sql).
--
-- Abre con begin y cierra con rollback: no deja nada escrito. Se puede
-- correr sobre una base con datos reales sin miedo.
--
-- NOTA DE IMPLEMENTACIÓN: no usa tablas ni funciones temporales. El SQL
-- Editor de Supabase corre sobre un pool de conexiones y no garantiza que
-- pg_temp sobreviva entre sentencias, así que todo va con subconsultas
-- explícitas. Es más verboso y es a propósito.
--
-- ADVERTENCIA HONESTA sobre el test 6: pgTAP corre en una sola sesión, así
-- que acá NO se prueba concurrencia real. Se prueba la restricción que la
-- hace imposible — la UNIQUE sobre idempotency_key. La concurrencia de
-- verdad (dos conexiones, mismo socio, mismo instante) necesita un test de
-- integración con dos clientes; está pendiente y anotado en el README.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

create extension if not exists pgtap with schema extensions;

select plan(17);

-- ───────────────────────────────────────────────────────────────────────────
-- Preparación
-- ───────────────────────────────────────────────────────────────────────────

-- Aislamos el recorrido de la gorra: el otro desafío del seed también
-- completaría y ensuciaría las cuentas de puntos.
update challenges set active = false where slug = 'la-vuelta-al-frio';

-- Socio de prueba. Pasa por auth.users para que el trigger
-- on_auth_user_created arme profile y membresía como en producción.
insert into auth.users (id, email, raw_user_meta_data)
values (
  '00000000-0000-0000-0000-0000000000a1',
  'test-socio@zorvo.test',
  '{"display_name": "Socio de Prueba"}'::jsonb
);

-- Barista, para poder anular en el test 7: el check void_is_complete exige
-- que toda anulación tenga autor. Es a propósito — una anulación sin
-- responsable es exactamente lo que la auditoría del §10 tiene que impedir.
insert into auth.users (id, email, raw_user_meta_data)
values (
  '00000000-0000-0000-0000-0000000000b1',
  'test-barista@zorvo.test',
  '{"display_name": "Barista de Prueba"}'::jsonb
);

insert into staff (profile_id, role, location_id)
select '00000000-0000-0000-0000-0000000000b1', 'barista', l.id
from locations l where l.slug = 'palermo';

-- ───────────────────────────────────────────────────────────────────────────
-- Test 1 — Progreso parcial: 7 de 13, sin recompensa
-- ───────────────────────────────────────────────────────────────────────────

insert into consumptions (member_id, product_id, location_id, source, idempotency_key)
select m.id, p.id, l.id, 'scan', 'k-' || p.sku
from members m, products p, locations l
where m.profile_id = '00000000-0000-0000-0000-0000000000a1'
  and l.slug = 'palermo'
  and p.sku in ('ZRV-ESP','ZRV-COR','ZRV-FLW','ZRV-LAT','ZRV-CAP','ZRV-AME','ZRV-MAC');

select is(
  (select cp.progress_num
     from challenge_progress cp
     join members m    on m.id  = cp.member_id
     join challenges c on c.id  = cp.challenge_id
    where m.profile_id = '00000000-0000-0000-0000-0000000000a1'
      and c.slug = 'la-carta-completa'),
  7,
  'T1 · siete cafés distintos dan 7 de progreso'
);

select is(
  (select count(*)
     from reward_grants rg
     join members m    on m.id = rg.member_id
     join challenges c on c.id = rg.challenge_id
    where m.profile_id = '00000000-0000-0000-0000-0000000000a1'
      and c.slug = 'la-carta-completa'),
  0::bigint,
  'T1 · con progreso parcial no hay gorra'
);

-- ───────────────────────────────────────────────────────────────────────────
-- Test 2 — Repetir un café ya probado no mueve el progreso
-- ───────────────────────────────────────────────────────────────────────────

insert into consumptions (member_id, product_id, location_id, source, idempotency_key)
select m.id, p.id, l.id, 'scan', 'k-repeat-1'
from members m, products p, locations l
where m.profile_id = '00000000-0000-0000-0000-0000000000a1'
  and l.slug = 'palermo' and p.sku = 'ZRV-ESP';

insert into consumptions (member_id, product_id, location_id, source, idempotency_key)
select m.id, p.id, l.id, 'scan', 'k-repeat-2'
from members m, products p, locations l
where m.profile_id = '00000000-0000-0000-0000-0000000000a1'
  and l.slug = 'palermo' and p.sku = 'ZRV-ESP';

select is(
  (select cp.progress_num
     from challenge_progress cp
     join members m    on m.id = cp.member_id
     join challenges c on c.id = cp.challenge_id
    where m.profile_id = '00000000-0000-0000-0000-0000000000a1'
      and c.slug = 'la-carta-completa'),
  7,
  'T2 · repetir un café ya probado no suma a la colección'
);

-- ───────────────────────────────────────────────────────────────────────────
-- Test 3 — Consumir algo que no cuenta para la colección
-- ───────────────────────────────────────────────────────────────────────────

insert into consumptions (member_id, product_id, location_id, source, idempotency_key)
select m.id, p.id, l.id, 'scan', 'k-medialuna'
from members m, products p, locations l
where m.profile_id = '00000000-0000-0000-0000-0000000000a1'
  and l.slug = 'palermo' and p.sku = 'ZRV-MED';

select is(
  (select cp.progress_num
     from challenge_progress cp
     join members m    on m.id = cp.member_id
     join challenges c on c.id = cp.challenge_id
    where m.profile_id = '00000000-0000-0000-0000-0000000000a1'
      and c.slug = 'la-carta-completa'),
  7,
  'T3 · la medialuna no suma progreso'
);

select is(
  (select cp.progress_den
     from challenge_progress cp
     join members m    on m.id = cp.member_id
     join challenges c on c.id = cp.challenge_id
    where m.profile_id = '00000000-0000-0000-0000-0000000000a1'
      and c.slug = 'la-carta-completa'),
  13,
  'T3 · la medialuna tampoco entra en el denominador'
);

-- ───────────────────────────────────────────────────────────────────────────
-- Test 4 — Doble tap del barista sobre el mismo token
--
-- El escenario real: el barista toca dos veces, o la red reintenta. La misma
-- idempotency_key no puede entrar dos veces. Es la UNIQUE, no un if.
-- ───────────────────────────────────────────────────────────────────────────

insert into consumptions (member_id, product_id, location_id, source, idempotency_key)
select m.id, p.id, l.id, 'scan', 'token-fijo-abc'
from members m, products p, locations l
where m.profile_id = '00000000-0000-0000-0000-0000000000a1'
  and l.slug = 'palermo' and p.sku = 'ZRV-MOC';

select throws_ok(
  $$ insert into consumptions (member_id, product_id, location_id, source, idempotency_key)
     select m.id, p.id, l.id, 'scan', 'token-fijo-abc'
     from members m, products p, locations l
     where m.profile_id = '00000000-0000-0000-0000-0000000000a1'
       and l.slug = 'palermo' and p.sku = 'ZRV-MOC' $$,
  '23505',
  null,
  'T4 · el segundo insert con la misma idempotency_key es rechazado por la base'
);

select is(
  (select count(*) from consumptions c
     join members m on m.id = c.member_id
    where m.profile_id = '00000000-0000-0000-0000-0000000000a1'
      and c.idempotency_key = 'token-fijo-abc'),
  1::bigint,
  'T4 · queda un solo consumo registrado'
);

-- ───────────────────────────────────────────────────────────────────────────
-- Test 5 — Completar la carta otorga gorra y puntos
-- ───────────────────────────────────────────────────────────────────────────

insert into consumptions (member_id, product_id, location_id, source, idempotency_key)
select m.id, p.id, l.id, 'scan', 'k2-' || p.sku
from members m, products p, locations l
where m.profile_id = '00000000-0000-0000-0000-0000000000a1'
  and l.slug = 'palermo'
  and p.sku in ('ZRV-V60','ZRV-CBR','ZRV-CBT','ZRV-NIT','ZRV-AFF');

select is(
  (select cp.progress_num
     from challenge_progress cp
     join members m    on m.id = cp.member_id
     join challenges c on c.id = cp.challenge_id
    where m.profile_id = '00000000-0000-0000-0000-0000000000a1'
      and c.slug = 'la-carta-completa'),
  13,
  'T5 · los trece cafés completan el recorrido'
);

select is(
  (select count(*)
     from reward_grants rg
     join members m    on m.id = rg.member_id
     join challenges c on c.id = rg.challenge_id
    where m.profile_id = '00000000-0000-0000-0000-0000000000a1'
      and c.slug = 'la-carta-completa'),
  1::bigint,
  'T5 · se otorga exactamente una gorra'
);

select is(
  (select m.lifetime_points from members m
    where m.profile_id = '00000000-0000-0000-0000-0000000000a1'),
  100,
  'T5 · se acreditan los 100 puntos del recorrido'
);

-- ───────────────────────────────────────────────────────────────────────────
-- Test 6 — Idempotencia del otorgamiento
--
-- Sustituto en una sola sesión del "dos baristas en simultáneo". Recalcular
-- muchas veces no puede producir una segunda gorra ni duplicar puntos.
-- ───────────────────────────────────────────────────────────────────────────

select app.recompute_member_loyalty(m.id) from members m
 where m.profile_id = '00000000-0000-0000-0000-0000000000a1';
select app.recompute_member_loyalty(m.id) from members m
 where m.profile_id = '00000000-0000-0000-0000-0000000000a1';
select app.recompute_member_loyalty(m.id) from members m
 where m.profile_id = '00000000-0000-0000-0000-0000000000a1';

select is(
  (select count(*)
     from reward_grants rg
     join members m    on m.id = rg.member_id
     join challenges c on c.id = rg.challenge_id
    where m.profile_id = '00000000-0000-0000-0000-0000000000a1'
      and c.slug = 'la-carta-completa'),
  1::bigint,
  'T6 · recalcular tres veces no otorga una segunda gorra'
);

select is(
  (select count(*) from points_ledger pl
     join members m on m.id = pl.member_id
    where m.profile_id = '00000000-0000-0000-0000-0000000000a1'
      and pl.reason = 'challenge_completed'),
  1::bigint,
  'T6 · tampoco duplica el asiento de puntos'
);

-- ───────────────────────────────────────────────────────────────────────────
-- Test 7 — Anular un consumo después de completar
--
-- El progreso baja, pero la recompensa ya otorgada se conserva. Quitarle la
-- gorra a alguien porque el barista corrigió un error de carga sería peor
-- que el error.
-- ───────────────────────────────────────────────────────────────────────────

update consumptions
   set voided_at   = now(),
       voided_by   = (select s.id from staff s
                       where s.profile_id = '00000000-0000-0000-0000-0000000000b1'),
       void_reason = 'test de anulación'
 where id = (
   select c.id from consumptions c
     join members m  on m.id = c.member_id
     join products p on p.id = c.product_id
    where m.profile_id = '00000000-0000-0000-0000-0000000000a1'
      and p.sku = 'ZRV-AFF'
      and c.voided_at is null
    limit 1
 );

select is(
  (select cp.progress_num
     from challenge_progress cp
     join members m    on m.id = cp.member_id
     join challenges c on c.id = cp.challenge_id
    where m.profile_id = '00000000-0000-0000-0000-0000000000a1'
      and c.slug = 'la-carta-completa'),
  12,
  'T7 · anular un consumo baja el progreso a 12'
);

select is(
  (select count(*)
     from reward_grants rg
     join members m    on m.id = rg.member_id
     join challenges c on c.id = rg.challenge_id
    where m.profile_id = '00000000-0000-0000-0000-0000000000a1'
      and c.slug = 'la-carta-completa'),
  1::bigint,
  'T7 · la gorra ya otorgada se conserva'
);

select isnt(
  (select cp.completed_at
     from challenge_progress cp
     join members m    on m.id = cp.member_id
     join challenges c on c.id = cp.challenge_id
    where m.profile_id = '00000000-0000-0000-0000-0000000000a1'
      and c.slug = 'la-carta-completa'),
  null,
  'T7 · la fecha de completado se conserva: completar es un hecho, no un estado'
);

-- ───────────────────────────────────────────────────────────────────────────
-- Test 8 — La carta crece
--
-- Entra un café nuevo. El denominador sube solo, sin tocar la fila del
-- recorrido, y quien ya completó conserva lo suyo.
-- ───────────────────────────────────────────────────────────────────────────

insert into products (sku, name, description, counts_for_collection, sort_order)
values ('ZRV-NEW', 'Café nuevo', 'El que entró después.', true, 140);

select app.recompute_member_loyalty(m.id) from members m
 where m.profile_id = '00000000-0000-0000-0000-0000000000a1';

select is(
  (select cp.progress_den
     from challenge_progress cp
     join members m    on m.id = cp.member_id
     join challenges c on c.id = cp.challenge_id
    where m.profile_id = '00000000-0000-0000-0000-0000000000a1'
      and c.slug = 'la-carta-completa'),
  14,
  'T8 · el denominador sube a 14 sin editar el recorrido'
);

select is(
  (select count(*)
     from reward_grants rg
     join members m    on m.id = rg.member_id
     join challenges c on c.id = rg.challenge_id
    where m.profile_id = '00000000-0000-0000-0000-0000000000a1'
      and c.slug = 'la-carta-completa'),
  1::bigint,
  'T8 · quien ya completó conserva la gorra'
);

-- ───────────────────────────────────────────────────────────────────────────

select * from finish();
rollback;
