-- ═══════════════════════════════════════════════════════════════════════════
-- ZORVO — Cargar consumos de prueba a un socio
--
-- Para ver el Club con progreso a mitad de camino sin tomar once cafés.
--
-- CÓMO USARLO
--   1. Registrate en la app con tu email real.
--   2. Cambiá el email de abajo por el tuyo.
--   3. Pegá todo esto en el SQL Editor y correlo.
--
-- ESTO SÍ ESCRIBE EN LA BASE. No hay rollback: los consumos quedan, el motor
-- de fidelidad se dispara y el progreso aparece en /club.
--
-- Es un solo bloque DO a propósito: Postgres parsea todo el script antes de
-- ejecutar, así que crear objetos y usarlos en el mismo envío falla. Dentro
-- de un DO no pasa.
--
-- Para deshacerlo, al final del archivo hay un bloque comentado que anula
-- todos los consumos de prueba.
-- ═══════════════════════════════════════════════════════════════════════════

do $$
declare
  -- ⬇⬇⬇ CAMBIÁ ESTO POR TU EMAIL ⬇⬇⬇
  c_email  constant text := 'vos@ejemplo.com';

  -- Cuántos cafés distintos de la carta querés que aparezcan como probados.
  -- Con 11 de 13 ves el progreso casi completo, que es la pantalla linda.
  c_cuantos constant integer := 11;

  v_member   uuid;
  v_location uuid;
  v_producto record;
  v_n        integer := 0;
begin
  select m.id into v_member
  from members m
  join profiles p on p.id = m.profile_id
  where p.email = c_email;

  if v_member is null then
    raise exception 'No hay ningún socio con el email %. Registrate en la app primero.', c_email;
  end if;

  select id into v_location from locations where slug = 'palermo';

  if v_location is null then
    raise exception 'No existe la sucursal palermo. ¿Corriste seed.sql?';
  end if;

  for v_producto in
    select id, sku from products
    where active and counts_for_collection
    order by sort_order
    limit c_cuantos
  loop
    insert into consumptions (
      member_id, product_id, location_id, source, occurred_at, idempotency_key
    ) values (
      v_member,
      v_producto.id,
      v_location,
      'manual',
      -- Repartidos en las últimas semanas para que "este mes" y "lo de
      -- siempre" tengan algo con sentido en vez de trece cafés a la misma hora.
      now() - (v_n * interval '2 days'),
      'demo:' || v_member::text || ':' || v_producto.sku
    )
    on conflict (idempotency_key) do nothing;

    v_n := v_n + 1;
  end loop;

  -- Un par de repeticiones del Cold Brew, para que "lo de siempre" tenga
  -- de dónde salir. Repetir no suma a la colección — eso es el test 2.
  insert into consumptions (member_id, product_id, location_id, source, occurred_at, idempotency_key)
  select v_member, p.id, v_location, 'manual', now() - (i * interval '3 days'),
         'demo-repe:' || v_member::text || ':' || i
  from products p, generate_series(1, 3) as i
  where p.sku = 'ZRV-CBR'
  on conflict (idempotency_key) do nothing;

  raise notice 'Listo: % cafés distintos cargados para %', v_n, c_email;
end $$;

-- Verificación rápida: esto tiene que mostrar tu progreso.
select
  p.email,
  m.member_code,
  c.name         as recorrido,
  cp.progress_num || ' de ' || cp.progress_den as progreso,
  case when cp.completed_at is null then 'en curso' else 'completado' end as estado,
  m.lifetime_points as puntos
from challenge_progress cp
join members m    on m.id = cp.member_id
join profiles p   on p.id = m.profile_id
join challenges c on c.id = cp.challenge_id
order by c.sort_order;


-- ═══════════════════════════════════════════════════════════════════════════
-- DESHACER — descomentá y corré si querés volver a cero.
--
-- Anula en vez de borrar: consumptions es append-only y el trigger lo impide.
-- El motor recalcula solo y el progreso baja.
-- ═══════════════════════════════════════════════════════════════════════════

-- update consumptions c
--    set voided_at = now(),
--        voided_by = (select id from staff limit 1),
--        void_reason = 'limpieza de datos de prueba'
--  from members m, profiles p
--  where c.member_id = m.id
--    and m.profile_id = p.id
--    and p.email = 'vos@ejemplo.com'
--    and c.idempotency_key like 'demo%'
--    and c.voided_at is null;
