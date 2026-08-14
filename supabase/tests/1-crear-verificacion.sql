-- ═══════════════════════════════════════════════════════════════════════════
-- ZORVO — Verificación del motor de fidelidad · PASO 1 de 2
--
-- Crea la función. Pegá este archivo entero en el SQL Editor y correlo UNA
-- vez. No ejecuta nada todavía.
--
-- Después corré 2-correr-verificacion.sql, que la llama.
--
-- POR QUÉ EN DOS PASOS: Postgres parsea todas las sentencias de un script
-- antes de ejecutar la primera. Por eso no se puede crear una tabla (ni
-- temporal ni normal) y referenciarla más abajo en el mismo envío: al
-- planificar la segunda sentencia, la tabla todavía no existe. Dentro de una
-- función plpgsql no pasa: cada sentencia se planifica al ejecutarse.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.zorvo_verificar()
returns table (grupo text, chequeo text, esperado text, obtenido text, estado text)
language plpgsql
as $$
declare
  c_socio   constant uuid := '00000000-0000-0000-0000-0000000000a1';
  c_barista constant uuid := '00000000-0000-0000-0000-0000000000b1';
  v_err     text;
begin
  -- ── Diagnóstico del entorno ──────────────────────────────────────────────
  -- Si algo de acá falla, todo lo demás falla en cascada y no significa nada.

  grupo := 'entorno'; chequeo := 'seed: sucursal palermo'; esperado := '1';
  obtenido := (select count(*)::text from locations where slug = 'palermo');
  estado := case when esperado = obtenido then 'OK' else '>>> FALLA' end;
  return next;

  grupo := 'entorno'; chequeo := 'seed: productos que cuentan'; esperado := '13';
  obtenido := (select count(*)::text from products where counts_for_collection and active);
  estado := case when esperado = obtenido then 'OK' else '>>> FALLA' end;
  return next;

  grupo := 'entorno'; chequeo := 'seed: medialuna (no cuenta)'; esperado := '1';
  obtenido := (select count(*)::text from products where sku = 'ZRV-MED');
  estado := case when esperado = obtenido then 'OK' else '>>> FALLA' end;
  return next;

  grupo := 'entorno'; chequeo := 'seed: recorrido la-carta-completa'; esperado := '1';
  obtenido := (select count(*)::text from challenges where slug = 'la-carta-completa');
  estado := case when esperado = obtenido then 'OK' else '>>> FALLA' end;
  return next;

  grupo := 'entorno'; chequeo := 'seed: recompensa gorra-zorvo'; esperado := '1';
  obtenido := (select count(*)::text from rewards where slug = 'gorra-zorvo');
  estado := case when esperado = obtenido then 'OK' else '>>> FALLA' end;
  return next;

  grupo := 'entorno'; chequeo := 'trigger de alta instalado'; esperado := '1';
  obtenido := (select count(*)::text from pg_trigger
                where tgname = 'on_auth_user_created' and not tgisinternal);
  estado := case when esperado = obtenido then 'OK' else '>>> FALLA' end;
  return next;

  -- ── Preparación ──────────────────────────────────────────────────────────

  update challenges set active = false where slug = 'la-vuelta-al-frio';

  begin
    insert into auth.users (id, email, raw_user_meta_data)
    values (c_socio, 'test-socio@zorvo.test', '{"display_name":"Socio de Prueba"}'::jsonb);
    v_err := 'insertado';
  exception when others then
    v_err := 'ERROR: ' || sqlerrm;
  end;

  grupo := 'entorno'; chequeo := 'alta del socio en auth.users'; esperado := 'insertado';
  obtenido := v_err;
  estado := case when esperado = obtenido then 'OK' else '>>> FALLA' end;
  return next;

  begin
    insert into auth.users (id, email, raw_user_meta_data)
    values (c_barista, 'test-barista@zorvo.test', '{"display_name":"Barista"}'::jsonb);
  exception when others then null;
  end;

  grupo := 'entorno'; chequeo := 'el trigger creó el profile'; esperado := '1';
  obtenido := (select count(*)::text from profiles where id = c_socio);
  estado := case when esperado = obtenido then 'OK' else '>>> FALLA' end;
  return next;

  grupo := 'entorno'; chequeo := 'el trigger creó la membresía'; esperado := '1';
  obtenido := (select count(*)::text from members where profile_id = c_socio);
  estado := case when esperado = obtenido then 'OK' else '>>> FALLA' end;
  return next;

  insert into staff (profile_id, role, location_id)
  select c_barista, 'barista', l.id from locations l where l.slug = 'palermo';

  -- ── T1 · Progreso parcial ────────────────────────────────────────────────

  insert into consumptions (member_id, product_id, location_id, source, idempotency_key)
  select m.id, p.id, l.id, 'scan', 'k-' || p.sku
  from members m, products p, locations l
  where m.profile_id = c_socio and l.slug = 'palermo'
    and p.sku in ('ZRV-ESP','ZRV-COR','ZRV-FLW','ZRV-LAT','ZRV-CAP','ZRV-AME','ZRV-MAC');

  grupo := 'T1'; chequeo := 'siete cafés distintos dan 7'; esperado := '7';
  obtenido := coalesce((select cp.progress_num::text from challenge_progress cp
     join members m on m.id = cp.member_id join challenges c on c.id = cp.challenge_id
    where m.profile_id = c_socio and c.slug = 'la-carta-completa'), '(sin fila de progreso)');
  estado := case when esperado = obtenido then 'OK' else '>>> FALLA' end;
  return next;

  grupo := 'T1'; chequeo := 'progreso parcial no da gorra'; esperado := '0';
  obtenido := (select count(*)::text from reward_grants rg
     join members m on m.id = rg.member_id join challenges c on c.id = rg.challenge_id
    where m.profile_id = c_socio and c.slug = 'la-carta-completa');
  estado := case when esperado = obtenido then 'OK' else '>>> FALLA' end;
  return next;

  -- ── T2 · Repetir no suma ─────────────────────────────────────────────────

  insert into consumptions (member_id, product_id, location_id, source, idempotency_key)
  select m.id, p.id, l.id, 'scan', 'k-repeat'
  from members m, products p, locations l
  where m.profile_id = c_socio and l.slug = 'palermo' and p.sku = 'ZRV-ESP';

  grupo := 'T2'; chequeo := 'repetir un café no suma'; esperado := '7';
  obtenido := coalesce((select cp.progress_num::text from challenge_progress cp
     join members m on m.id = cp.member_id join challenges c on c.id = cp.challenge_id
    where m.profile_id = c_socio and c.slug = 'la-carta-completa'), '(sin fila)');
  estado := case when esperado = obtenido then 'OK' else '>>> FALLA' end;
  return next;

  -- ── T3 · Lo que no cuenta ────────────────────────────────────────────────

  insert into consumptions (member_id, product_id, location_id, source, idempotency_key)
  select m.id, p.id, l.id, 'scan', 'k-medialuna'
  from members m, products p, locations l
  where m.profile_id = c_socio and l.slug = 'palermo' and p.sku = 'ZRV-MED';

  grupo := 'T3'; chequeo := 'la medialuna no suma progreso'; esperado := '7';
  obtenido := coalesce((select cp.progress_num::text from challenge_progress cp
     join members m on m.id = cp.member_id join challenges c on c.id = cp.challenge_id
    where m.profile_id = c_socio and c.slug = 'la-carta-completa'), '(sin fila)');
  estado := case when esperado = obtenido then 'OK' else '>>> FALLA' end;
  return next;

  grupo := 'T3'; chequeo := 'ni entra en el denominador'; esperado := '13';
  obtenido := coalesce((select cp.progress_den::text from challenge_progress cp
     join members m on m.id = cp.member_id join challenges c on c.id = cp.challenge_id
    where m.profile_id = c_socio and c.slug = 'la-carta-completa'), '(sin fila)');
  estado := case when esperado = obtenido then 'OK' else '>>> FALLA' end;
  return next;

  -- ── T4 · Doble tap ───────────────────────────────────────────────────────

  insert into consumptions (member_id, product_id, location_id, source, idempotency_key)
  select m.id, p.id, l.id, 'scan', 'token-fijo-abc'
  from members m, products p, locations l
  where m.profile_id = c_socio and l.slug = 'palermo' and p.sku = 'ZRV-MOC';

  v_err := 'NO FALLÓ — la idempotencia no funciona';
  begin
    insert into consumptions (member_id, product_id, location_id, source, idempotency_key)
    select m.id, p.id, l.id, 'scan', 'token-fijo-abc'
    from members m, products p, locations l
    where m.profile_id = c_socio and l.slug = 'palermo' and p.sku = 'ZRV-MOC';
  exception when unique_violation then
    v_err := 'rechazado';
  end;

  grupo := 'T4'; chequeo := 'el doble tap es rechazado'; esperado := 'rechazado';
  obtenido := v_err;
  estado := case when esperado = obtenido then 'OK' else '>>> FALLA' end;
  return next;

  grupo := 'T4'; chequeo := 'queda un solo consumo'; esperado := '1';
  obtenido := (select count(*)::text from consumptions c join members m on m.id = c.member_id
    where m.profile_id = c_socio and c.idempotency_key = 'token-fijo-abc');
  estado := case when esperado = obtenido then 'OK' else '>>> FALLA' end;
  return next;

  -- ── T5 · Completar ───────────────────────────────────────────────────────

  insert into consumptions (member_id, product_id, location_id, source, idempotency_key)
  select m.id, p.id, l.id, 'scan', 'k2-' || p.sku
  from members m, products p, locations l
  where m.profile_id = c_socio and l.slug = 'palermo'
    and p.sku in ('ZRV-V60','ZRV-CBR','ZRV-CBT','ZRV-NIT','ZRV-AFF');

  grupo := 'T5'; chequeo := 'los 13 completan el recorrido'; esperado := '13';
  obtenido := coalesce((select cp.progress_num::text from challenge_progress cp
     join members m on m.id = cp.member_id join challenges c on c.id = cp.challenge_id
    where m.profile_id = c_socio and c.slug = 'la-carta-completa'), '(sin fila)');
  estado := case when esperado = obtenido then 'OK' else '>>> FALLA' end;
  return next;

  grupo := 'T5'; chequeo := 'se otorga exactamente una gorra'; esperado := '1';
  obtenido := (select count(*)::text from reward_grants rg
     join members m on m.id = rg.member_id join challenges c on c.id = rg.challenge_id
    where m.profile_id = c_socio and c.slug = 'la-carta-completa');
  estado := case when esperado = obtenido then 'OK' else '>>> FALLA' end;
  return next;

  grupo := 'T5'; chequeo := 'se acreditan 100 puntos'; esperado := '100';
  obtenido := coalesce((select m.lifetime_points::text from members m
    where m.profile_id = c_socio), '(sin socio)');
  estado := case when esperado = obtenido then 'OK' else '>>> FALLA' end;
  return next;

  -- ── T6 · Idempotencia ────────────────────────────────────────────────────

  perform app.recompute_member_loyalty(m.id) from members m where m.profile_id = c_socio;
  perform app.recompute_member_loyalty(m.id) from members m where m.profile_id = c_socio;
  perform app.recompute_member_loyalty(m.id) from members m where m.profile_id = c_socio;

  grupo := 'T6'; chequeo := 'recalcular 3 veces no da 2 gorras'; esperado := '1';
  obtenido := (select count(*)::text from reward_grants rg
     join members m on m.id = rg.member_id join challenges c on c.id = rg.challenge_id
    where m.profile_id = c_socio and c.slug = 'la-carta-completa');
  estado := case when esperado = obtenido then 'OK' else '>>> FALLA' end;
  return next;

  grupo := 'T6'; chequeo := 'ni duplica los puntos'; esperado := '1';
  obtenido := (select count(*)::text from points_ledger pl join members m on m.id = pl.member_id
    where m.profile_id = c_socio and pl.reason = 'challenge_completed');
  estado := case when esperado = obtenido then 'OK' else '>>> FALLA' end;
  return next;

  -- ── T7 · Anulación ───────────────────────────────────────────────────────

  update consumptions
     set voided_at = now(),
         voided_by = (select s.id from staff s where s.profile_id = c_barista),
         void_reason = 'verificación'
   where id = (select c.id from consumptions c
       join members m on m.id = c.member_id join products p on p.id = c.product_id
      where m.profile_id = c_socio and p.sku = 'ZRV-AFF' and c.voided_at is null limit 1);

  grupo := 'T7'; chequeo := 'anular baja el progreso a 12'; esperado := '12';
  obtenido := coalesce((select cp.progress_num::text from challenge_progress cp
     join members m on m.id = cp.member_id join challenges c on c.id = cp.challenge_id
    where m.profile_id = c_socio and c.slug = 'la-carta-completa'), '(sin fila)');
  estado := case when esperado = obtenido then 'OK' else '>>> FALLA' end;
  return next;

  grupo := 'T7'; chequeo := 'la gorra otorgada se conserva'; esperado := '1';
  obtenido := (select count(*)::text from reward_grants rg
     join members m on m.id = rg.member_id join challenges c on c.id = rg.challenge_id
    where m.profile_id = c_socio and c.slug = 'la-carta-completa');
  estado := case when esperado = obtenido then 'OK' else '>>> FALLA' end;
  return next;

  grupo := 'T7'; chequeo := 'la fecha de completado se conserva'; esperado := 'sí';
  obtenido := coalesce((select case when cp.completed_at is not null then 'sí' else 'no' end
     from challenge_progress cp
     join members m on m.id = cp.member_id join challenges c on c.id = cp.challenge_id
    where m.profile_id = c_socio and c.slug = 'la-carta-completa'), '(sin fila)');
  estado := case when esperado = obtenido then 'OK' else '>>> FALLA' end;
  return next;

  -- ── T8 · La carta crece ──────────────────────────────────────────────────

  insert into products (sku, name, description, counts_for_collection, sort_order)
  values ('ZRV-NEW', 'Café nuevo', 'El que entró después.', true, 140);

  perform app.recompute_member_loyalty(m.id) from members m where m.profile_id = c_socio;

  grupo := 'T8'; chequeo := 'el denominador sube a 14 solo'; esperado := '14';
  obtenido := coalesce((select cp.progress_den::text from challenge_progress cp
     join members m on m.id = cp.member_id join challenges c on c.id = cp.challenge_id
    where m.profile_id = c_socio and c.slug = 'la-carta-completa'), '(sin fila)');
  estado := case when esperado = obtenido then 'OK' else '>>> FALLA' end;
  return next;

  grupo := 'T8'; chequeo := 'quien completó conserva la gorra'; esperado := '1';
  obtenido := (select count(*)::text from reward_grants rg
     join members m on m.id = rg.member_id join challenges c on c.id = rg.challenge_id
    where m.profile_id = c_socio and c.slug = 'la-carta-completa');
  estado := case when esperado = obtenido then 'OK' else '>>> FALLA' end;
  return next;

  return;
end;
$$;
