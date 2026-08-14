-- ═══════════════════════════════════════════════════════════════════════════
-- ZORVO — seed de desarrollo
--
-- Datos mínimos para que la app arranque con sentido: una sucursal, la carta
-- real, el recorrido de la gorra y la recompensa.
--
-- NO crea usuarios. Los usuarios nacen por auth.users y el trigger
-- on_auth_user_created les arma profile y membresía. Para probar con un socio
-- real, registrate por la app o creá el usuario desde el dashboard.
--
-- Es idempotente: se puede correr dos veces sin duplicar nada.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Sucursal ───────────────────────────────────────────────────────────────
-- Una sola al lanzar (§15.5). location_id es NOT NULL en consumptions y
-- scan_events desde ahora: es más fácil agregar sucursales después que
-- rellenar una columna nullable con datos productivos encima.

insert into locations (slug, name, address, timezone)
values ('palermo', 'Zorvo Palermo', 'Av. Placeholder 1234, Palermo, CABA', 'America/Argentina/Buenos_Aires')
on conflict (slug) do nothing;

-- ── Categorías ─────────────────────────────────────────────────────────────

insert into product_categories (slug, name, sort_order) values
  ('cafe-caliente', 'Café caliente', 10),
  ('cafe-frio',     'Café frío',     20),
  ('otros',         'Otros',         90)
on conflict (slug) do nothing;

-- ── La carta ───────────────────────────────────────────────────────────────
-- counts_for_collection = true en los 13 cafés. Es lo que define el
-- denominador del recorrido de la gorra.

insert into products (sku, name, category_id, description, counts_for_collection, sort_order)
select v.sku, v.name, c.id, v.description, true, v.sort_order
from (values
  ('ZRV-ESP', 'Espresso',          'cafe-caliente', 'Corto, denso, sin vueltas. El que se toma de pie.',            10),
  ('ZRV-COR', 'Cortado',           'cafe-caliente', 'El punto medio que casi todo el país eligió.',                 20),
  ('ZRV-FLW', 'Flat White',        'cafe-caliente', 'Más café que leche. Para los que ya saben.',                   30),
  ('ZRV-LAT', 'Latte',             'cafe-caliente', 'Suave, largo, para cuando el día viene difícil.',              40),
  ('ZRV-CAP', 'Cappuccino',        'cafe-caliente', 'Espuma de verdad, no crema batida.',                           50),
  ('ZRV-AME', 'Americano',         'cafe-caliente', 'Agua y espresso. Sorprendentemente difícil de hacer bien.',    60),
  ('ZRV-MAC', 'Macchiato',         'cafe-caliente', 'Un espresso con una mancha. Literalmente.',                    70),
  ('ZRV-MOC', 'Mocha',             'cafe-caliente', 'Chocolate de verdad. No jarabe.',                              80),
  ('ZRV-V60', 'Filtrado V60',      'cafe-caliente', 'Cuatro minutos de paciencia que valen la pena.',               90),
  ('ZRV-CBR', 'Cold Brew',         'cafe-frio',     '18 horas de reposo. La casa se llama así por algo.',          100),
  ('ZRV-CBT', 'Cold Brew Tónica',  'cafe-frio',     'Suena raro. Después no vas a querer otra cosa.',              110),
  ('ZRV-NIT', 'Nitro',             'cafe-frio',     'Cae como una Guinness. Sin el lunes siguiente.',              120),
  ('ZRV-AFF', 'Affogato',          'cafe-frio',     'Helado ahogado en espresso. El postre que es café.',          130)
) as v(sku, name, cat_slug, description, sort_order)
join product_categories c on c.slug = v.cat_slug
on conflict (sku) do nothing;

-- Un producto que NO cuenta, para que el test 3 del §14 tenga contra qué
-- probar y para que quede explícito que la distinción existe.
insert into products (sku, name, category_id, description, counts_for_collection, sort_order)
select 'ZRV-MED', 'Medialuna', c.id, 'Está buena. No es café.', false, 200
from product_categories c where c.slug = 'otros'
on conflict (sku) do nothing;

-- ── Variantes ──────────────────────────────────────────────────────────────
-- Solo las del Cold Brew, que es donde el tamaño importa. El resto se agrega
-- cuando el mostrador lo pida.

insert into product_variants (product_id, name, price_cents, is_default)
select p.id, v.name, v.price_cents, v.is_default
from (values
  ('ZRV-CBR', '300ml', 350000, true),
  ('ZRV-CBR', '500ml', 450000, false)
) as v(sku, name, price_cents, is_default)
join products p on p.sku = v.sku
where not exists (
  select 1 from product_variants pv where pv.product_id = p.id and pv.name = v.name
);

-- ── La recompensa ──────────────────────────────────────────────────────────

insert into rewards (slug, name, description, kind, requires_fulfilment)
values (
  'gorra-zorvo',
  'Gorra Zorvo',
  'Sí, la gorra. La que estás pensando.',
  'physical',
  true
)
on conflict (slug) do nothing;

-- ── El recorrido ───────────────────────────────────────────────────────────
--
-- config vacío: el conjunto de productos es "todo lo que cuenta para la
-- colección", resuelto en tiempo de cálculo. Por eso cuando entre un café
-- nuevo a la carta el denominador sube solo, sin tocar esta fila.
--
-- repeatable = false: la gorra se gana una sola vez en la vida. Es la
-- decisión abierta §15.7 — si el negocio prefiere que se pueda volver a
-- ganar cuando la carta crece, es cambiar este booleano.

insert into challenges (slug, name, description, kind, config, reward_id, points_award, repeatable, sort_order)
select
  'la-carta-completa',
  'La carta completa',
  'Probá los cafés de la carta y te llevás la gorra.',
  'COLLECTION',
  '{}'::jsonb,
  r.id,
  100,
  false,
  10
from rewards r where r.slug = 'gorra-zorvo'
on conflict (slug) do nothing;

-- Un segundo recorrido para que el motor se ejercite con más de una forma
-- desde el día uno.
insert into challenges (slug, name, description, kind, config, points_award, repeatable, cycle, sort_order)
select
  'la-vuelta-al-frio',
  'La vuelta al frío',
  'Los cafés fríos de la carta, en cualquier orden.',
  'COLLECTION',
  jsonb_build_object('category_id', c.id::text),
  50,
  false,
  'none',
  20
from product_categories c where c.slug = 'cafe-frio'
on conflict (slug) do nothing;
