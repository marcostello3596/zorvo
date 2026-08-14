-- ═══════════════════════════════════════════════════════════════════════════
-- ZORVO — Verificación del motor de fidelidad (versión SQL Editor)
--
-- Hace lo mismo que loyalty_test.sql pero devuelve UNA sola tabla con todos
-- los chequeos, su valor esperado y el obtenido. El SQL Editor de Supabase
-- solo muestra el resultado de la última sentencia, así que con pgTAP se ve
-- el resumen pero no cuál falló — que es justo lo que hace falta.
--
-- Las primeras filas (grupo 0) son diagnóstico del entorno: si el seed no
-- está aplicado o el trigger de alta no funcionó, se ve ahí y no hace falta
-- interpretar 16 fallas en cascada.
--
-- Abre con begin y cierra con rollback: no deja nada escrito.
--
-- Pegá este archivo entero en el SQL Editor y correlo.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

create table _chk (
  orden serial,
  grupo text,
  chequeo text,
  esperado text,
  obtenido text
);

-- ───────────────────────────────────────────────────────────────────────────
-- Grupo 0 — Diagnóstico del entorno
-- Si algo de acá falla, todo lo demás falla en cascada y no significa nada.
-- ───────────────────────────────────────────────────────────────────────────

insert into _chk (grupo, chequeo, esperado, obtenido)
select 'entorno', 'seed: sucursal palermo', '1',
       (select count(*)::text from locations where slug = 'palermo');

insert into _chk (grupo, chequeo, esperado, obtenido)
select 'entorno', 'seed: productos que cuentan para la colección', '13',
       (select count(*)::text from products where counts_for_collection and active);

insert into _chk (grupo, chequeo, esperado, obtenido)
select 'entorno', 'seed: producto que NO cuenta (medialuna)', '1',
       (select count(*)::text from products where sku = 'ZRV-MED');

insert into _chk (grupo, chequeo, esperado, obtenido)
select 'entorno', 'seed: recorrido la-carta-completa', '1',
       (select count(*)::text from challenges where slug = 'la-carta-completa');

insert into _chk (grupo, chequeo, esperado, obtenido)
select 'entorno', 'seed: recompensa gorra-zorvo', '1',
       (select count(*)::text from rewards where slug = 'gorra-zorvo');

insert into _chk (grupo, chequeo, esperado, obtenido)
select 'entorno', 'trigger de alta existe', '1',
       (select count(*)::text from pg_trigger
         where tgname = 'on_auth_user_created' and not tgisinternal);

-- ───────────────────────────────────────────────────────────────────────────
-- Preparación
-- ───────────────────────────────────────────────────────────────────────────

update challenges set active = false where slug = 'la-vuelta-al-frio';

insert into auth.users (id, email, raw_user_meta_data)
values ('00000000-0000-0000-0000-0000000000a1', 'test-socio@zorvo.test',
        '{"display_name": "Socio de Prueba"}'::jsonb);

insert into auth.users (id, email, raw_user_meta_data)
values ('00000000-0000-0000-0000-0000000000b1', 'test-barista@zorvo.test',
        '{"display_name": "Barista de Prueba"}'::jsonb);

insert into _chk (grupo, chequeo, esperado, obtenido)
select 'entorno', 'el trigger creó el profile del socio', '1',
       (select count(*)::text from profiles
         where id = '00000000-0000-0000-0000-0000000000a1');

insert into _chk (grupo, chequeo, esperado, obtenido)
select 'entorno', 'el trigger creó la membresía del socio', '1',
       (select count(*)::text from members
         where profile_id = '00000000-0000-0000-0000-0000000000a1');

insert into staff (profile_id, role, location_id)
select '00000000-0000-0000-0000-0000000000b1', 'barista', l.id
from locations l where l.slug = 'palermo';

-- ───────────────────────────────────────────────────────────────────────────
-- T1 — Progreso parcial: 7 de 13, sin recompensa
-- ───────────────────────────────────────────────────────────────────────────

insert into consumptions (member_id, product_id, location_id, source, idempotency_key)
select m.id, p.id, l.id, 'scan', 'k-' || p.sku
from members m, products p, locations l
where m.profile_id = '00000000-0000-0000-0000-0000000000a1'
  and l.slug = 'palermo'
  and p.sku in ('ZRV-ESP','ZRV-COR','ZRV-FLW','ZRV-LAT','ZRV-CAP','ZRV-AME','ZRV-MAC');

insert into _chk (grupo, chequeo, esperado, obtenido)
select 'T1', 'siete cafés distintos dan 7 de progreso', '7',
  coalesce((select cp.progress_num::text from challenge_progress cp
     join members m on m.id = cp.member_id
     join challenges c on c.id = cp.challenge_id
    where m.profile_id = '00000000-0000-0000-0000-0000000000a1'
      and c.slug = 'la-carta-completa'), '(sin fila de progreso)');

insert into _chk (grupo, chequeo, esperado, obtenido)
select 'T1', 'con progreso parcial no hay gorra', '0',
  (select count(*)::text from reward_grants rg
     join members m on m.id = rg.member_id
     join challenges c on c.id = rg.challenge_id
    where m.profile_id = '00000000-0000-0000-0000-0000000000a1'
      and c.slug = 'la-carta-completa');

-- ───────────────────────────────────────────────────────────────────────────
-- T2 — Repetir un café ya probado no mueve el progreso
-- ───────────────────────────────────────────────────────────────────────────

insert into consumptions (member_id, product_id, location_id, source, idempotency_key)
select m.id, p.id, l.id, 'scan', 'k-repeat-1'
from members m, products p, locations l
where m.profile_id = '00000000-0000-0000-0000-0000000000a1'
  and l.slug = 'palermo' and p.sku = 'ZRV-ESP';

insert into _chk (grupo, chequeo, esperado, obtenido)
select 'T2', 'repetir un café ya probado no suma', '7',
  coalesce((select cp.progress_num::text from challenge_progress cp
     join members m on m.id = cp.member_id
     join challenges c on c.id = cp.challenge_id
    where m.profile_id = '00000000-0000-0000-0000-0000000000a1'
      and c.slug = 'la-carta-completa'), '(sin fila)');

-- ───────────────────────────────────────────────────────────────────────────
-- T3 — Algo que no cuenta para la colección
-- ───────────────────────────────────────────────────────────────────────────

insert into consumptions (member_id, product_id, location_id, source, idempotency_key)
select m.id, p.id, l.id, 'scan', 'k-medialuna'
from members m, products p, locations l
where m.profile_id = '00000000-0000-0000-0000-0000000000a1'
  and l.slug = 'palermo' and p.sku = 'ZRV-MED';

insert into _chk (grupo, chequeo, esperado, obtenido)
select 'T3', 'la medialuna no suma progreso', '7',
  coalesce((select cp.progress_num::text from challenge_progress cp
     join members m on m.id = cp.member_id
     join challenges c on c.id = cp.challenge_id
    where m.profile_id = '00000000-0000-0000-0000-0000000000a1'
      and c.slug = 'la-carta-completa'), '(sin fila)');

insert into _chk (grupo, chequeo, esperado, obtenido)
select 'T3', 'la medialuna no entra en el denominador', '13',
  coalesce((select cp.progress_den::text from challenge_progress cp
     join members m on m.id = cp.member_id
     join challenges c on c.id = cp.challenge_id
    where m.profile_id = '00000000-0000-0000-0000-0000000000a1'
      and c.slug = 'la-carta-completa'), '(sin fila)');

-- ───────────────────────────────────────────────────────────────────────────
-- T4 — Doble tap del barista sobre el mismo token
-- ───────────────────────────────────────────────────────────────────────────

insert into consumptions (member_id, product_id, location_id, source, idempotency_key)
select m.id, p.id, l.id, 'scan', 'token-fijo-abc'
from members m, products p, locations l
where m.profile_id = '00000000-0000-0000-0000-0000000000a1'
  and l.slug = 'palermo' and p.sku = 'ZRV-MOC';

-- El segundo insert tiene que explotar. Se captura para poder seguir.
do $$
declare v_error text := 'NO FALLÓ — la idempotencia no está funcionando';
begin
  begin
    insert into consumptions (member_id, product_id, location_id, source, idempotency_key)
    select m.id, p.id, l.id, 'scan', 'token-fijo-abc'
    from members m, products p, locations l
    where m.profile_id = '00000000-0000-0000-0000-0000000000a1'
      and l.slug = 'palermo' and p.sku = 'ZRV-MOC';
  exception when unique_violation then
    v_error := 'rechazado (23505)';
  end;
  insert into _chk (grupo, chequeo, esperado, obtenido)
  values ('T4', 'el doble tap es rechazado por la base', 'rechazado (23505)', v_error);
end $$;

insert into _chk (grupo, chequeo, esperado, obtenido)
select 'T4', 'queda un solo consumo con ese token', '1',
  (select count(*)::text from consumptions c
     join members m on m.id = c.member_id
    where m.profile_id = '00000000-0000-0000-0000-0000000000a1'
      and c.idempotency_key = 'token-fijo-abc');

-- ───────────────────────────────────────────────────────────────────────────
-- T5 — Completar la carta otorga gorra y puntos
-- ───────────────────────────────────────────────────────────────────────────

insert into consumptions (member_id, product_id, location_id, source, idempotency_key)
select m.id, p.id, l.id, 'scan', 'k2-' || p.sku
from members m, products p, locations l
where m.profile_id = '00000000-0000-0000-0000-0000000000a1'
  and l.slug = 'palermo'
  and p.sku in ('ZRV-V60','ZRV-CBR','ZRV-CBT','ZRV-NIT','ZRV-AFF');

insert into _chk (grupo, chequeo, esperado, obtenido)
select 'T5', 'los trece cafés completan el recorrido', '13',
  coalesce((select cp.progress_num::text from challenge_progress cp
     join members m on m.id = cp.member_id
     join challenges c on c.id = cp.challenge_id
    where m.profile_id = '00000000-0000-0000-0000-0000000000a1'
      and c.slug = 'la-carta-completa'), '(sin fila)');

insert into _chk (grupo, chequeo, esperado, obtenido)
select 'T5', 'se otorga exactamente una gorra', '1',
  (select count(*)::text from reward_grants rg
     join members m on m.id = rg.member_id
     join challenges c on c.id = rg.challenge_id
    where m.profile_id = '00000000-0000-0000-0000-0000000000a1'
      and c.slug = 'la-carta-completa');

insert into _chk (grupo, chequeo, esperado, obtenido)
select 'T5', 'se acreditan los 100 puntos', '100',
  coalesce((select m.lifetime_points::text from members m
    where m.profile_id = '00000000-0000-0000-0000-0000000000a1'), '(sin socio)');

-- ───────────────────────────────────────────────────────────────────────────
-- T6 — Idempotencia del otorgamiento
-- ───────────────────────────────────────────────────────────────────────────

select app.recompute_member_loyalty(m.id) from members m
 where m.profile_id = '00000000-0000-0000-0000-0000000000a1';
select app.recompute_member_loyalty(m.id) from members m
 where m.profile_id = '00000000-0000-0000-0000-0000000000a1';
select app.recompute_member_loyalty(m.id) from members m
 where m.profile_id = '00000000-0000-0000-0000-0000000000a1';

insert into _chk (grupo, chequeo, esperado, obtenido)
select 'T6', 'recalcular 3 veces no da una segunda gorra', '1',
  (select count(*)::text from reward_grants rg
     join members m on m.id = rg.member_id
     join challenges c on c.id = rg.challenge_id
    where m.profile_id = '00000000-0000-0000-0000-0000000000a1'
      and c.slug = 'la-carta-completa');

insert into _chk (grupo, chequeo, esperado, obtenido)
select 'T6', 'tampoco duplica el asiento de puntos', '1',
  (select count(*)::text from points_ledger pl
     join members m on m.id = pl.member_id
    where m.profile_id = '00000000-0000-0000-0000-0000000000a1'
      and pl.reason = 'challenge_completed');

-- ───────────────────────────────────────────────────────────────────────────
-- T7 — Anular un consumo después de completar
-- ───────────────────────────────────────────────────────────────────────────

update consumptions
   set voided_at   = now(),
       voided_by   = (select s.id from staff s
                       where s.profile_id = '00000000-0000-0000-0000-0000000000b1'),
       void_reason = 'verificación'
 where id = (
   select c.id from consumptions c
     join members m  on m.id = c.member_id
     join products p on p.id = c.product_id
    where m.profile_id = '00000000-0000-0000-0000-0000000000a1'
      and p.sku = 'ZRV-AFF' and c.voided_at is null
    limit 1);

insert into _chk (grupo, chequeo, esperado, obtenido)
select 'T7', 'anular baja el progreso a 12', '12',
  coalesce((select cp.progress_num::text from challenge_progress cp
     join members m on m.id = cp.member_id
     join challenges c on c.id = cp.challenge_id
    where m.profile_id = '00000000-0000-0000-0000-0000000000a1'
      and c.slug = 'la-carta-completa'), '(sin fila)');

insert into _chk (grupo, chequeo, esperado, obtenido)
select 'T7', 'la gorra ya otorgada se conserva', '1',
  (select count(*)::text from reward_grants rg
     join members m on m.id = rg.member_id
     join challenges c on c.id = rg.challenge_id
    where m.profile_id = '00000000-0000-0000-0000-0000000000a1'
      and c.slug = 'la-carta-completa');

insert into _chk (grupo, chequeo, esperado, obtenido)
select 'T7', 'la fecha de completado se conserva', 'sí',
  coalesce((select case when cp.completed_at is not null then 'sí' else 'no' end
     from challenge_progress cp
     join members m on m.id = cp.member_id
     join challenges c on c.id = cp.challenge_id
    where m.profile_id = '00000000-0000-0000-0000-0000000000a1'
      and c.slug = 'la-carta-completa'), '(sin fila)');

-- ───────────────────────────────────────────────────────────────────────────
-- T8 — La carta crece
-- ───────────────────────────────────────────────────────────────────────────

insert into products (sku, name, description, counts_for_collection, sort_order)
values ('ZRV-NEW', 'Café nuevo', 'El que entró después.', true, 140);

select app.recompute_member_loyalty(m.id) from members m
 where m.profile_id = '00000000-0000-0000-0000-0000000000a1';

insert into _chk (grupo, chequeo, esperado, obtenido)
select 'T8', 'el denominador sube a 14 solo', '14',
  coalesce((select cp.progress_den::text from challenge_progress cp
     join members m on m.id = cp.member_id
     join challenges c on c.id = cp.challenge_id
    where m.profile_id = '00000000-0000-0000-0000-0000000000a1'
      and c.slug = 'la-carta-completa'), '(sin fila)');

insert into _chk (grupo, chequeo, esperado, obtenido)
select 'T8', 'quien ya completó conserva la gorra', '1',
  (select count(*)::text from reward_grants rg
     join members m on m.id = rg.member_id
     join challenges c on c.id = rg.challenge_id
    where m.profile_id = '00000000-0000-0000-0000-0000000000a1'
      and c.slug = 'la-carta-completa');

-- ───────────────────────────────────────────────────────────────────────────
-- Resultado
-- ───────────────────────────────────────────────────────────────────────────

select
  grupo,
  chequeo,
  esperado,
  obtenido,
  case when esperado = obtenido then 'OK' else '>>> FALLA' end as estado
from _chk
order by orden;

rollback;
