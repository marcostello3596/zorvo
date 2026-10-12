-- ═══════════════════════════════════════════════════════════════════════════
-- ZORVO — 0007 · La tarjeta de la Z y el mostrador
--
--  1. El motor aprende PUNCH: 10 Z = un café de regalo, y la tarjeta vuelve a
--     empezar. Convive con los recorridos (COLLECTION, COUNT, VISIT): un mismo
--     café suma una Z y a la vez avanza "La carta completa".
--  2. Datos: la recompensa "Café de regalo" y el desafío "tarjeta-de-la-z".
--  3. Funciones del mostrador (/admin): registrar una visita y canjear un
--     premio, atómicas y solo para service_role (las llama el servidor después
--     de verificar que quien escanea es staff).
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function app.recompute_member_challenge(
  p_member_id    uuid,
  p_challenge_id uuid
) returns void
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  c              challenges%rowtype;
  v_cycle_key    text;
  v_num          integer := 0;
  v_den          integer := 0;
  v_target       integer;
  v_completed    boolean := false;
  v_window_start timestamptz;
  v_window_end   timestamptz;
  v_progress_id  uuid;
  v_was_complete boolean;
  v_balance      integer;
  v_cards        integer;
  k              integer;
begin
  select * into c from challenges where id = p_challenge_id;
  if not found or not c.active then
    return;
  end if;

  v_cycle_key := app.cycle_key_for(c.cycle);

  -- Ventana de conteo: la del desafío, acotada por el ciclo si lo hay.
  v_window_start := c.starts_at;
  v_window_end   := c.ends_at;

  if c.cycle = 'monthly' then
    v_window_start := greatest(
      coalesce(v_window_start, '-infinity'::timestamptz),
      date_trunc('month', timezone('America/Argentina/Buenos_Aires', now()))
        at time zone 'America/Argentina/Buenos_Aires'
    );
  elsif c.cycle = 'weekly' then
    v_window_start := greatest(
      coalesce(v_window_start, '-infinity'::timestamptz),
      date_trunc('week', timezone('America/Argentina/Buenos_Aires', now()))
        at time zone 'America/Argentina/Buenos_Aires'
    );
  end if;

  -- ── PUNCH: la tarjeta de 10 Z ──────────────────────────────────────────
  -- Cada café vivo suma una Z. Cada `target` Z se completa una tarjeta y se
  -- otorga un premio. La tarjeta vuelve a empezar sola: progress_num es el
  -- resto de la división, y state guarda el total y cuántas tarjetas van.
  --
  -- Idempotente como el resto del motor: la tarjeta k tiene su propia
  -- idempotency_key, así que recalcular no reotorga, y si se anula un café
  -- el premio ya ganado se conserva (mismo criterio que T7 del §14).
  if c.kind = 'PUNCH' then
    v_target := greatest(coalesce((c.config ->> 'target')::integer, 10), 1);

    select coalesce(sum(cons.quantity), 0) into v_num
    from consumptions cons
    where cons.member_id = p_member_id
      and cons.voided_at is null
      and cons.product_id in (select app.resolve_product_set(c.config))
      and (v_window_start is null or cons.occurred_at >= v_window_start)
      and (v_window_end   is null or cons.occurred_at <= v_window_end)
      and (c.location_id  is null or cons.location_id = c.location_id);

    v_cards := v_num / v_target;

    insert into challenge_progress (
      member_id, challenge_id, cycle_key, state, progress_num, progress_den, completed_at, updated_at
    ) values (
      p_member_id, p_challenge_id, v_cycle_key,
      jsonb_build_object('total', v_num, 'cards', v_cards),
      v_num - v_cards * v_target, v_target, null, now()
    )
    on conflict (member_id, challenge_id, cycle_key) do update set
      state        = excluded.state,
      progress_num = excluded.progress_num,
      progress_den = excluded.progress_den,
      updated_at   = now();

    if c.reward_id is not null and v_cards > 0 then
      for k in 1..v_cards loop
        insert into reward_grants (member_id, reward_id, challenge_id, idempotency_key)
        values (p_member_id, c.reward_id, c.id,
                p_member_id::text || ':' || c.id::text || ':card-' || k)
        on conflict (idempotency_key) do nothing;
      end loop;
    end if;

    return;
  end if;

  if c.kind = 'COLLECTION' then
    -- Denominador: cuántos productos tiene la colección HOY. Si mañana entra
    -- un café nuevo, el denominador sube solo. Ver §14 test 8.
    select count(*) into v_den from app.resolve_product_set(c.config);

    select count(distinct cons.product_id) into v_num
    from consumptions cons
    where cons.member_id = p_member_id
      and cons.voided_at is null
      and cons.product_id in (select app.resolve_product_set(c.config))
      and (v_window_start is null or cons.occurred_at >= v_window_start)
      and (v_window_end   is null or cons.occurred_at <= v_window_end)
      and (c.location_id  is null or cons.location_id = c.location_id);

    v_completed := (v_den > 0 and v_num >= v_den);

  elsif c.kind = 'COUNT' then
    v_target := coalesce((c.config ->> 'target')::integer, 0);
    v_den := v_target;

    select coalesce(sum(cons.quantity), 0) into v_num
    from consumptions cons
    where cons.member_id = p_member_id
      and cons.voided_at is null
      and cons.product_id in (select app.resolve_product_set(c.config))
      and (v_window_start is null or cons.occurred_at >= v_window_start)
      and (v_window_end   is null or cons.occurred_at <= v_window_end)
      and (c.location_id  is null or cons.location_id = c.location_id);

    v_completed := (v_target > 0 and v_num >= v_target);

  elsif c.kind = 'VISIT' then
    v_target := coalesce((c.config ->> 'target')::integer, 0);
    v_den := v_target;

    -- Una visita es un día con al menos un consumo, no un consumo.
    select count(distinct date_trunc(
             'day', timezone('America/Argentina/Buenos_Aires', cons.occurred_at)))
      into v_num
    from consumptions cons
    where cons.member_id = p_member_id
      and cons.voided_at is null
      and (v_window_start is null or cons.occurred_at >= v_window_start)
      and (v_window_end   is null or cons.occurred_at <= v_window_end)
      and (c.location_id  is null or cons.location_id = c.location_id);

    v_completed := (v_target > 0 and v_num >= v_target);

  else
    -- STREAK y MANUAL no se evalúan solos. STREAK es V2; MANUAL lo otorga
    -- un manager a mano. Salir sin tocar nada es lo correcto.
    return;
  end if;

  -- Estado anterior, para no reotorgar en cada recálculo.
  select id, completed_at is not null
    into v_progress_id, v_was_complete
  from challenge_progress
  where member_id = p_member_id
    and challenge_id = p_challenge_id
    and cycle_key = v_cycle_key;

  insert into challenge_progress (
    member_id, challenge_id, cycle_key, progress_num, progress_den, completed_at, updated_at
  ) values (
    p_member_id, p_challenge_id, v_cycle_key, v_num, v_den,
    case when v_completed then now() else null end, now()
  )
  on conflict (member_id, challenge_id, cycle_key) do update set
    progress_num = excluded.progress_num,
    progress_den = excluded.progress_den,
    -- Si ya estaba completo, se conserva la fecha original: completar es un
    -- hecho con fecha, no un estado que parpadea.
    completed_at = case
      when challenge_progress.completed_at is not null then challenge_progress.completed_at
      when v_completed then now()
      else null
    end,
    updated_at = now()
  returning id into v_progress_id;

  -- Otorgamiento: solo en la transición a completo.
  if v_completed and not coalesce(v_was_complete, false) then

    if c.reward_id is not null then
      insert into reward_grants (member_id, reward_id, challenge_id, idempotency_key)
      values (
        p_member_id, c.reward_id, c.id,
        p_member_id::text || ':' || c.id::text || ':' || v_cycle_key
      )
      on conflict (idempotency_key) do nothing;
    end if;

    if c.points_award <> 0 then
      select coalesce(sum(delta), 0) + c.points_award
        into v_balance
      from points_ledger where member_id = p_member_id;

      -- El índice de points_ledger es PARCIAL, así que el ON CONFLICT tiene
      -- que repetir su predicado: sin el WHERE, Postgres no puede inferir
      -- contra qué índice resolver y aborta con "no unique or exclusion
      -- constraint matching the ON CONFLICT specification".
      insert into points_ledger (member_id, delta, reason, ref_type, ref_id, balance_after)
      values (p_member_id, c.points_award, 'challenge_completed', 'challenge_progress', v_progress_id, v_balance)
      on conflict (member_id, ref_type, ref_id)
        where ref_type is not null and ref_id is not null
        do nothing;

      update members
         set lifetime_points = (select coalesce(sum(delta), 0) from points_ledger where member_id = p_member_id)
       where id = p_member_id;
    end if;
  end if;
end;
$$;

-- El recálculo completo ahora también recorre las tarjetas PUNCH.
create or replace function app.recompute_member_loyalty(p_member_id uuid)
returns void
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_challenge_id uuid;
begin
  perform 1 from members where id = p_member_id for update;

  for v_challenge_id in
    select id from challenges
    where active
      and kind in ('COLLECTION', 'COUNT', 'VISIT', 'PUNCH')
      and (starts_at is null or starts_at <= now())
      and (ends_at   is null or ends_at   >= now())
    order by sort_order, id
  loop
    perform app.recompute_member_challenge(p_member_id, v_challenge_id);
  end loop;
end;
$$;

revoke execute on function app.recompute_member_challenge(uuid, uuid) from public;
revoke execute on function app.recompute_member_loyalty(uuid) from public;

-- ───────────────────────────────────────────────────────────────────────────
-- Datos: recompensa y tarjeta
-- config vacío = cuentan los productos marcados counts_for_collection (los
-- cafés). Una medialuna no suma Z.
-- ───────────────────────────────────────────────────────────────────────────

insert into rewards (slug, name, description, kind, requires_fulfilment)
values ('cafe-de-regalo', 'Café de regalo', 'Cualquier café de la carta, por nuestra cuenta.', 'physical', true)
on conflict (slug) do nothing;

insert into challenges (slug, name, description, kind, config, reward_id, points_award, repeatable, cycle, sort_order)
select 'tarjeta-de-la-z', 'Tarjeta de la Z',
       'Cada café es una Z. A la décima, el próximo va por nuestra cuenta.',
       'PUNCH', '{"target": 10}'::jsonb, r.id, 0, true, 'none', 0
from rewards r where r.slug = 'cafe-de-regalo'
on conflict (slug) do nothing;

-- Backfill: los socios que ya tienen cafés arrancan con sus Z.
do $$
declare m uuid;
begin
  for m in select id from members loop
    perform app.recompute_member_loyalty(m);
  end loop;
end $$;

-- ───────────────────────────────────────────────────────────────────────────
-- Mostrador: registrar una visita
--
-- Una sola transacción: el escaneo (con su anti-replay) y los consumos. Si
-- el mismo código se escanea dos veces, la UNIQUE de scan_events_no_replay
-- corta acá y no se suma nada. p_items = [{"product_id": "...", "quantity": 1}].
-- p_kind null = carga manual (el barista tipeó el código del socio).
-- ───────────────────────────────────────────────────────────────────────────

create or replace function public.zorvo_register_visit(
  p_member_id   uuid,
  p_staff_id    uuid,
  p_location_id uuid,
  p_kind        credential_kind,
  p_token_step  bigint,
  p_items       jsonb
) returns jsonb
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_scan_id uuid;
  v_item    jsonb;
  v_idx     integer := 0;
  v_qty     integer;
  v_count   integer := 0;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    return jsonb_build_object('ok', false, 'reason', 'empty');
  end if;

  if not exists (select 1 from members where id = p_member_id and status = 'active') then
    return jsonb_build_object('ok', false, 'reason', 'member');
  end if;

  if p_kind is not null then
    begin
      insert into scan_events (member_id, staff_id, location_id, kind, token_step, result)
      values (p_member_id, p_staff_id, p_location_id, p_kind, p_token_step, 'ok')
      returning id into v_scan_id;
    exception when unique_violation then
      insert into scan_events (member_id, staff_id, location_id, kind, token_step, result)
      values (p_member_id, p_staff_id, p_location_id, p_kind, p_token_step, 'replay');
      return jsonb_build_object('ok', false, 'reason', 'replay');
    end;
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_idx := v_idx + 1;
    v_qty := greatest(least(coalesce((v_item ->> 'quantity')::integer, 1), 20), 1);
    insert into consumptions (
      member_id, product_id, location_id, staff_id, scan_event_id,
      quantity, source, idempotency_key
    ) values (
      p_member_id, (v_item ->> 'product_id')::uuid, p_location_id, p_staff_id, v_scan_id,
      v_qty,
      case when p_kind is null then 'manual'::consumption_src else 'scan'::consumption_src end,
      coalesce(v_scan_id::text, gen_random_uuid()::text) || ':' || v_idx
    );
    v_count := v_count + v_qty;
  end loop;

  return jsonb_build_object('ok', true, 'added', v_count, 'scan_event_id', v_scan_id);
end;
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- Mostrador: canjear un premio
-- Solo pasa de 'unlocked' a 'delivered'. Dos baristas tocando "Canjear" a la
-- vez: el segundo no encuentra la fila en 'unlocked' y recibe ok=false.
-- ───────────────────────────────────────────────────────────────────────────

create or replace function public.zorvo_redeem_grant(
  p_grant_id uuid,
  p_staff_id uuid
) returns jsonb
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_row reward_grants%rowtype;
begin
  update reward_grants
     set status = 'delivered', delivered_at = now(), delivered_by = p_staff_id
   where id = p_grant_id and status = 'unlocked'
  returning * into v_row;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_available');
  end if;

  insert into audit_logs (actor_profile_id, action, entity, entity_id, after)
  select s.profile_id, 'reward.delivered', 'reward_grants', v_row.id, to_jsonb(v_row)
  from staff s where s.id = p_staff_id;

  return jsonb_build_object('ok', true, 'grant_id', v_row.id);
end;
$$;

revoke execute on function public.zorvo_register_visit(uuid, uuid, uuid, credential_kind, bigint, jsonb) from public, anon, authenticated;
revoke execute on function public.zorvo_redeem_grant(uuid, uuid) from public, anon, authenticated;
grant  execute on function public.zorvo_register_visit(uuid, uuid, uuid, credential_kind, bigint, jsonb) to service_role;
grant  execute on function public.zorvo_redeem_grant(uuid, uuid) to service_role;
