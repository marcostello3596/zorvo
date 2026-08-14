-- ═══════════════════════════════════════════════════════════════════════════
-- ZORVO — 0003 · Motor de fidelidad
--
-- Cubre §5 "Dónde vive el motor de reglas". El motor está en Postgres, en
-- plpgsql, disparado por trigger sobre consumptions, dentro de la misma
-- transacción que el consumo.
--
-- Por qué acá y no en Node: dos baristas escaneando al mismo socio en el
-- mismo segundo, con la lógica en la app, otorgan la gorra dos veces. Acá
-- no pueden: el lock sobre la fila del socio serializa el cálculo, y la
-- UNIQUE sobre reward_grants.idempotency_key hace que el segundo INSERT no
-- exista. La imposibilidad es estructural, no probabilística.
--
-- Todo el motor es SECURITY DEFINER: escribe progreso y grants que ningún
-- rol puede escribir por PostgREST. Ver las políticas en 0002.
--
-- El motor es IDEMPOTENTE. recompute_member_loyalty(member_id) se puede
-- correr mil veces y converge al mismo estado. Es la garantía que hace
-- posible el backfill, la reparación y editar un recorrido en producción.
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- Resolución del conjunto de productos de un desafío
--
-- Un solo lugar decide qué productos cuentan. Tres formas de decirlo, por
-- especificidad:
--   {"product_ids": [...]}   → lista explícita
--   {"category_id": "..."}   → la categoría entera
--   {}                       → todo lo que cuenta para la colección
--
-- counts_for_collection es el filtro que distingue un flat white de una
-- medialuna. Se aplica siempre salvo que la lista sea explícita.
-- ───────────────────────────────────────────────────────────────────────────

create or replace function app.resolve_product_set(p_config jsonb)
returns setof uuid
language sql stable
set search_path = public, pg_temp
as $$
  select p.id
  from public.products p
  where p.active
    and case
      when p_config ? 'product_ids' then
        p.id in (
          select jsonb_array_elements_text(p_config -> 'product_ids')::uuid
        )
      when p_config ? 'category_id' then
        p.category_id = (p_config ->> 'category_id')::uuid
        and p.counts_for_collection
      else
        p.counts_for_collection
    end;
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- Clave de ciclo
--
-- Un desafío mensual tiene una fila de progreso por mes. cycle_key es lo que
-- las separa sin necesidad de tablas extra. Se calcula en la zona horaria de
-- la sucursal, no en UTC: "los cafés de agosto" son los de agosto en Buenos
-- Aires, no los de un mes corrido desde Greenwich.
-- ───────────────────────────────────────────────────────────────────────────

create or replace function app.cycle_key_for(p_cycle challenge_cycle, p_at timestamptz default now())
returns text
language sql stable
as $$
  select case p_cycle
    when 'none'    then 'default'
    when 'monthly' then to_char(timezone('America/Argentina/Buenos_Aires', p_at), 'YYYY-MM')
    when 'weekly'  then to_char(timezone('America/Argentina/Buenos_Aires', p_at), 'IYYY-"W"IW')
  end;
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- Recálculo de un desafío para un socio
--
-- Recalcula desde consumptions, siempre. No incrementa un contador: lo
-- vuelve a derivar. Por eso anular un consumo baja el progreso solo, sin
-- lógica de reversa.
-- ───────────────────────────────────────────────────────────────────────────

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

-- ───────────────────────────────────────────────────────────────────────────
-- Recálculo completo de un socio
--
-- El escape hatch del §5. Idempotente por construcción. Se usa para backfill,
-- para reparar, y cuando se edita un recorrido con datos productivos encima.
--
-- El lock sobre la fila del socio es lo que hace pasar el test 6 del §14:
-- dos baristas escaneando en simultáneo se serializan acá.
-- ───────────────────────────────────────────────────────────────────────────

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
      and kind in ('COLLECTION', 'COUNT', 'VISIT')
      and (starts_at is null or starts_at <= now())
      and (ends_at   is null or ends_at   >= now())
    order by sort_order, id
  loop
    perform app.recompute_member_challenge(p_member_id, v_challenge_id);
  end loop;
end;
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- El trigger
--
-- Recalcula todos los desafíos del socio, no solo los afectados. Con tres
-- recorridos activos y el volumen de una cafetería, el costo es despreciable
-- y elimina una clase entera de bugs: la de "este producto no dispara este
-- desafío" cuando alguien edita la config de un recorrido.
-- ───────────────────────────────────────────────────────────────────────────

create or replace function app.on_consumption_change() returns trigger
language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
  perform app.recompute_member_loyalty(coalesce(new.member_id, old.member_id));
  return null;
end;
$$;

create trigger consumptions_recompute_loyalty
  after insert or update of voided_at on consumptions
  for each row execute function app.on_consumption_change();

-- ───────────────────────────────────────────────────────────────────────────
-- Permisos
--
-- El motor no se llama desde el navegador. Lo dispara el trigger, o el
-- servidor con service_role para backfill.
-- ───────────────────────────────────────────────────────────────────────────

revoke execute on function app.recompute_member_challenge(uuid, uuid) from public;
revoke execute on function app.recompute_member_loyalty(uuid)          from public;
revoke execute on function app.resolve_product_set(jsonb)              from public;
