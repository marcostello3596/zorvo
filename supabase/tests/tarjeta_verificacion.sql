-- ═══════════════════════════════════════════════════════════════════════════
-- ZORVO — Verificación de la tarjeta de la Z y del mostrador (0006–0007)
--
-- Misma forma que verificacion.sql: una tabla de chequeos, abre con begin y
-- cierra con rollback (no deja nada escrito). Requiere el seed aplicado.
-- Pegala entera en el SQL Editor de Supabase.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

create temp table _chk (orden serial, grupo text, chequeo text, esperado text, obtenido text);

-- Preparación: un socio, un barista y la sucursal del seed
insert into auth.users (id, email, raw_user_meta_data)
values ('00000000-0000-0000-0000-0000000000c1', 'test-z@zorvo.test', '{"display_name": "Socio Z"}'::jsonb),
       ('00000000-0000-0000-0000-0000000000c2', 'test-barra@zorvo.test', '{"display_name": "Barra Z"}'::jsonb);

insert into staff (id, profile_id, role, location_id)
select '00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000c2', 'barista', l.id
from locations l where l.slug = 'palermo';

create temp view _m as select id from members where profile_id = '00000000-0000-0000-0000-0000000000c1';
create temp view _loc as select id from locations where slug = 'palermo';
create temp view _card as
  select cp.progress_num, cp.progress_den, (cp.state ->> 'cards')::int as cards
  from challenge_progress cp join challenges c on c.id = cp.challenge_id
  where c.slug = 'tarjeta-de-la-z' and cp.member_id = (select id from _m);
create temp view _grants as
  select g.* from reward_grants g join rewards r on r.id = g.reward_id
  where r.slug = 'cafe-de-regalo' and g.member_id = (select id from _m);

insert into _chk (grupo, chequeo, esperado, obtenido)
select 'entorno', 'existe la tarjeta-de-la-z (PUNCH, 10)', 'PUNCH 10',
       (select kind::text || ' ' || (config ->> 'target') from challenges where slug = 'tarjeta-de-la-z');

-- P1: nueve cafés = nueve Z, sin premio
insert into consumptions (member_id, product_id, location_id, source, idempotency_key)
select (select id from _m), p.id, (select id from _loc), 'manual', 'p1-' || g
from generate_series(1, 9) g
cross join lateral (select id from products where sku = 'ZRV-COR') p;

insert into _chk (grupo, chequeo, esperado, obtenido)
select 'P1', 'nueve cafés = 9 Z', '9/10', (select progress_num || '/' || progress_den from _card);
insert into _chk (grupo, chequeo, esperado, obtenido)
select 'P1', 'todavía sin café de regalo', '0', (select count(*)::text from _grants);

-- P2: la medialuna no suma Z
insert into consumptions (member_id, product_id, location_id, source, idempotency_key)
select (select id from _m), id, (select id from _loc), 'manual', 'p2-med' from products where sku = 'ZRV-MED';
insert into _chk (grupo, chequeo, esperado, obtenido)
select 'P2', 'la medialuna no suma', '9', (select progress_num::text from _card);

-- P3: el décimo café completa la tarjeta y vuelve a cero
insert into consumptions (member_id, product_id, location_id, source, idempotency_key)
select (select id from _m), id, (select id from _loc), 'manual', 'p3-10' from products where sku = 'ZRV-ESP';
insert into _chk (grupo, chequeo, esperado, obtenido)
select 'P3', 'la tarjeta vuelve a 0', '0', (select progress_num::text from _card);
insert into _chk (grupo, chequeo, esperado, obtenido)
select 'P3', 'una tarjeta completa', '1', (select cards::text from _card);
insert into _chk (grupo, chequeo, esperado, obtenido)
select 'P3', 'un café de regalo desbloqueado', '1', (select count(*)::text from _grants where status = 'unlocked');

-- P4: recalcular no reotorga
select app.recompute_member_loyalty((select id from _m));
select app.recompute_member_loyalty((select id from _m));
insert into _chk (grupo, chequeo, esperado, obtenido)
select 'P4', 'recalcular 2 veces no da otro premio', '1', (select count(*)::text from _grants);

-- P5: el mostrador registra 2 cafés con un escaneo; el mismo código no pasa dos veces
insert into _chk (grupo, chequeo, esperado, obtenido)
select 'P5', 'escaneo ok suma 2', 'true 2',
       (select (r ->> 'ok') || ' ' || (r ->> 'added') from (select public.zorvo_register_visit(
          (select id from _m), '00000000-0000-0000-0000-0000000000d1', (select id from _loc),
          'rotating', 999001, jsonb_build_array(jsonb_build_object('product_id', (select id from products where sku = 'ZRV-CBR'), 'quantity', 2))) r) x);
insert into _chk (grupo, chequeo, esperado, obtenido)
select 'P5', 'el mismo código otra vez = replay', 'false replay',
       (select (r ->> 'ok') || ' ' || (r ->> 'reason') from (select public.zorvo_register_visit(
          (select id from _m), '00000000-0000-0000-0000-0000000000d1', (select id from _loc),
          'rotating', 999001, jsonb_build_array(jsonb_build_object('product_id', (select id from products where sku = 'ZRV-CBR'), 'quantity', 1))) r) x);
insert into _chk (grupo, chequeo, esperado, obtenido)
select 'P5', 'la tarjeta quedó en 2', '2', (select progress_num::text from _card);
insert into _chk (grupo, chequeo, esperado, obtenido)
select 'P5', 'el replay quedó registrado', '1',
       (select count(*)::text from scan_events where member_id = (select id from _m) and result = 'replay');

-- P6: carga manual (sin código) también suma
insert into _chk (grupo, chequeo, esperado, obtenido)
select 'P6', 'carga manual suma 1', 'true 1',
       (select (r ->> 'ok') || ' ' || (r ->> 'added') from (select public.zorvo_register_visit(
          (select id from _m), '00000000-0000-0000-0000-0000000000d1', (select id from _loc),
          null, null, jsonb_build_array(jsonb_build_object('product_id', (select id from products where sku = 'ZRV-LAT')))) r) x);

-- P7: canjear el premio una sola vez
insert into _chk (grupo, chequeo, esperado, obtenido)
select 'P7', 'canjear funciona', 'true',
       (select public.zorvo_redeem_grant((select id from _grants limit 1), '00000000-0000-0000-0000-0000000000d1') ->> 'ok');
insert into _chk (grupo, chequeo, esperado, obtenido)
select 'P7', 'canjear dos veces no', 'false',
       (select public.zorvo_redeem_grant((select id from _grants limit 1), '00000000-0000-0000-0000-0000000000d1') ->> 'ok');
insert into _chk (grupo, chequeo, esperado, obtenido)
select 'P7', 'queda entregado con barista', 'delivered true',
       (select status::text || ' ' || (delivered_by is not null)::text from _grants limit 1);

-- P8: los recorridos siguen funcionando al lado de la tarjeta
insert into _chk (grupo, chequeo, esperado, obtenido)
select 'P8', 'la carta completa cuenta cafés distintos', '4',
       (select cp.progress_num::text from challenge_progress cp join challenges c on c.id = cp.challenge_id
         where c.slug = 'la-carta-completa' and cp.member_id = (select id from _m));

-- P9: 23 Z en total = 2 tarjetas y 3 Z
insert into consumptions (member_id, product_id, location_id, source, idempotency_key)
select (select id from _m), p.id, (select id from _loc), 'manual', 'p9-' || g
from generate_series(1, 10) g
cross join lateral (select id from products where sku = 'ZRV-AME') p;
insert into _chk (grupo, chequeo, esperado, obtenido)
select 'P9', '23 Z = 2 tarjetas y 3 Z', '2 3', (select cards || ' ' || progress_num from _card);
insert into _chk (grupo, chequeo, esperado, obtenido)
select 'P9', 'dos premios en total', '2', (select count(*)::text from _grants);

-- P10: anular un café baja la Z pero no quita premios ganados
update consumptions set voided_at = now(), voided_by = '00000000-0000-0000-0000-0000000000d1', void_reason = 'prueba'
 where idempotency_key = 'p9-10';
insert into _chk (grupo, chequeo, esperado, obtenido)
select 'P10', 'anular baja a 2 Z', '2', (select progress_num::text from _card);
insert into _chk (grupo, chequeo, esperado, obtenido)
select 'P10', 'los premios se conservan', '2', (select count(*)::text from _grants);

select grupo, chequeo, esperado, obtenido,
       case when esperado = obtenido then 'OK' else 'FALLA' end as estado
from _chk order by orden;

rollback;
