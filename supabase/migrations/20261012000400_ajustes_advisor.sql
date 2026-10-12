-- ═══════════════════════════════════════════════════════════════════════════
-- ZORVO — lo que marcó el Security Advisor de Supabase
--
-- 1. v_challenge_sizes pasa a security_invoker: corre con los permisos y el
--    RLS de quien consulta (la carta y los desafíos activos ya son públicos,
--    y la migración anterior le dio EXECUTE a resolve_product_set). Sin esto la vista corría
--    como su dueño y salteaba RLS — el advisor lo marca como ERROR.
-- 2. search_path fijo en las funciones de app.*: sin él, quien pueda crear
--    objetos en un esquema anterior del search_path podría hacerse pasar por
--    una tabla o un tipo que la función usa.
--
-- Queda un aviso a propósito: citext en public. Moverla de esquema con datos
-- adentro es más riesgo que beneficio; no expone nada.
-- ═══════════════════════════════════════════════════════════════════════════

alter view public.v_challenge_sizes set (security_invoker = true);

alter function app.touch_updated_at()                          set search_path = public, pg_temp;
alter function app.current_role()                              set search_path = public, pg_temp;
alter function app.current_location_id()                       set search_path = public, pg_temp;
alter function app.is_staff()                                  set search_path = public, pg_temp;
alter function app.is_manager()                                set search_path = public, pg_temp;
alter function app.is_owner()                                  set search_path = public, pg_temp;
alter function app.can_access_location(uuid)                   set search_path = public, pg_temp;
alter function app.generate_member_code()                      set search_path = public, pg_temp;
alter function app.consumptions_guard()                        set search_path = public, pg_temp;
alter function app.ledger_guard()                              set search_path = public, pg_temp;
alter function app.cycle_key_for(challenge_cycle, timestamptz) set search_path = public, pg_temp;
