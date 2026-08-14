-- ═══════════════════════════════════════════════════════════════════════════
-- ZORVO — Verificación del motor de fidelidad · PASO 2 de 2
--
-- Requiere haber corrido 1-crear-verificacion.sql antes.
--
-- El rollback deshace TODO lo que la función escribió: el socio de prueba,
-- los consumos, la gorra, los puntos. No queda nada en la base.
-- Se puede correr las veces que quieras, incluso más adelante con datos
-- reales adentro.
-- ═══════════════════════════════════════════════════════════════════════════

begin;
select * from public.zorvo_verificar();
rollback;
