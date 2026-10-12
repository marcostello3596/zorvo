-- ═══════════════════════════════════════════════════════════════════════════
-- ZORVO — v_challenge_sizes legible para los socios
--
-- La vista llama a app.resolve_product_set(). En Postgres, el permiso sobre
-- las FUNCIONES que usa una vista se chequea contra quien consulta, no contra
-- el dueño de la vista. Como 0003 le sacó EXECUTE a public, un socio recibía
-- "permission denied" y /club/recorridos mostraba "0 de 0" hasta su primer
-- café. La función solo devuelve ids de productos activos (la carta, que ya
-- es pública), así que abrirla no expone nada.
-- ═══════════════════════════════════════════════════════════════════════════

grant execute on function app.resolve_product_set(jsonb) to anon, authenticated;
