-- ═══════════════════════════════════════════════════════════════════════════
-- ZORVO — 0004 · Vista de tamaño de recorridos
--
-- Problema que resuelve: challenge_progress solo existe después del primer
-- consumo. Un socio recién dado de alta no tiene fila, así que la app no
-- sabe cuántos cafés tiene el recorrido y mostraría "0 de 0" — que no
-- significa nada y es justo lo primero que ve alguien que se acaba de sumar.
--
-- La vista expone el denominador sin necesidad de que el motor haya corrido.
-- Solo devuelve conteos: ningún dato de socio pasa por acá.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace view public.v_challenge_sizes as
select
  c.id   as challenge_id,
  c.slug as challenge_slug,
  case
    when c.kind = 'COLLECTION'
      then (select count(*)::integer from app.resolve_product_set(c.config))
    else coalesce((c.config ->> 'target')::integer, 0)
  end as total
from public.challenges c
where c.active;

-- La vista corre con los permisos de su dueño, que sí puede ejecutar
-- app.resolve_product_set. Eso permite exponer el conteo sin abrir la
-- función entera a los clientes.
grant select on public.v_challenge_sizes to anon, authenticated;

comment on view public.v_challenge_sizes is
  'Denominador de cada recorrido activo, disponible antes de que el socio tenga progreso.';
