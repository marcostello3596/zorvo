-- ═══════════════════════════════════════════════════════════════════════════
-- ZORVO — 0006 · Tipo de desafío PUNCH (la tarjeta de 10 Z)
--
-- Va solo en su propio archivo: un valor nuevo de enum no se puede usar en la
-- misma transacción que lo crea, y cada migración corre en una transacción.
-- ═══════════════════════════════════════════════════════════════════════════

alter type challenge_kind add value if not exists 'PUNCH';
