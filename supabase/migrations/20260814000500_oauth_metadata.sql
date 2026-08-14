-- ═══════════════════════════════════════════════════════════════════════════
-- ZORVO — 0005 · Metadatos de OAuth en el alta
--
-- El trigger original leía solo `display_name`, que es lo que manda nuestro
-- propio formulario de alta. Google no manda eso: manda `full_name` y `name`,
-- y la foto en `avatar_url` o `picture` según el proveedor.
--
-- Sin este arreglo, todo el que entrara con Google quedaba registrado con la
-- parte del email anterior a la arroba como nombre. Funciona, pero se ve mal
-- en una pantalla donde el nombre ocupa media credencial.
--
-- La foto además tiene valor operativo: en el escaneo del pass de Wallet, el
-- barista verifica contra la cara del socio (§6). Si Google ya nos la da, no
-- hay razón para pedirla después.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function app.handle_new_user() returns trigger
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_profile_id uuid;
  v_nombre     text;
  v_avatar     text;
begin
  -- Por especificidad: lo que escribió la persona en nuestro formulario gana
  -- sobre lo que nos dio el proveedor.
  v_nombre := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    split_part(coalesce(new.email, ''), '@', 1),
    'Socio'
  );

  v_avatar := coalesce(
    nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
    nullif(new.raw_user_meta_data ->> 'picture', '')
  );

  insert into public.profiles (id, email, display_name, avatar_url)
  values (new.id, new.email, v_nombre, v_avatar)
  -- Si el profile ya existe (por ejemplo alguien que se dio de alta por email
  -- y después vincula Google), no lo pisamos: completamos lo que falte.
  on conflict (id) do update set
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    avatar_url   = coalesce(public.profiles.avatar_url, excluded.avatar_url),
    email        = coalesce(excluded.email, public.profiles.email)
  returning id into v_profile_id;

  insert into public.members (profile_id, member_code)
  values (v_profile_id, app.generate_member_code())
  on conflict (profile_id) do nothing;

  return new;
end;
$$;
