/**
 * Contenido de la landing — PLACEHOLDER.
 * Todo lo de acá es texto y se reemplaza sin tocar componentes.
 * La voz sale del PDF de marca: cercana, relajada, honesta, sin solemnidad.
 */

export const SITE = {
  nombre: "ZORVO",
  bajada: "Cool Brew Coffee",
  desde: "Est. 2026",
  claim: "Aunque el momento sea corto, merece ser bueno. Muy bueno.",
  claimCorto: "Los momentos más breves merecen estar bien hechos",
  direccion: "Av. Placeholder 1234, Palermo, CABA",
  horarios: [
    { dias: "Lunes a viernes", horas: "07:00 – 20:00" },
    { dias: "Sábados", horas: "08:00 – 21:00" },
    { dias: "Domingos", horas: "09:00 – 19:00" },
  ],
  instagram: "@zorvo.coffee",
  instagramUrl: "https://instagram.com",
  email: "hola@zorvo.coffee",
  emailPrensa: "prensa@zorvo.coffee",
} as const;

export const MARQUEE_TOP =
  "LOS MOMENTOS MÁS BREVES MERECEN ESTAR BIEN HECHOS";

/** Los tres pasos del ritual. */
export const RITUAL = [
  {
    n: "01",
    titulo: "Llegás",
    texto: "Con sueño, apurado, o las dos cosas. No hace falta que expliques nada.",
    icono: "walk" as const,
  },
  {
    n: "02",
    titulo: "Mostrás tu Zorvo",
    texto: "Sacás el teléfono. Un escaneo. Listo. Ya sabemos quién sos y qué tomás.",
    icono: "cup" as const,
  },
  {
    n: "03",
    titulo: "Te llevás tu café",
    texto: "Y un pedacito más de tu recorrido. Sin tarjetitas de cartón que se pierden.",
    icono: "barista" as const,
  },
];

/** El recorrido principal: la razón de ser del Club. */
export const RECORRIDO_DESTACADO = {
  slug: "la-carta-completa",
  nombre: "La carta completa",
  promesa: "Probá los 13 cafés de la carta y te llevás la gorra.",
  detalle:
    "Sí, la gorra. La que estás pensando. No hay letra chica, no hay puntos que vencen, no hay que gastar un mínimo. Tomás los 13, te la llevás.",
  total: 13,
};

export const RECORRIDOS = [
  {
    slug: "la-carta-completa",
    nombre: "La carta completa",
    resumen: "Probá los 13 cafés y llevate la gorra.",
    premio: "Gorra Zorvo",
    total: 13,
    hechos: 11,
  },
  {
    slug: "el-madrugador",
    nombre: "El madrugador",
    resumen: "10 cafés antes de las 9 de la mañana.",
    premio: "Un café de regalo",
    total: 10,
    hechos: 6,
  },
  {
    slug: "la-vuelta-al-frio",
    nombre: "La vuelta al frío",
    resumen: "Los 4 fríos de la carta, en cualquier orden.",
    premio: "Vaso térmico Zorvo",
    total: 4,
    hechos: 4,
  },
];

export type Cafe = {
  slug: string;
  nombre: string;
  familia: "Caliente" | "Frío";
  nota: string;
  probado: boolean;
};

/** La carta. Sin precios y sin carrito: esto no es una tienda. */
export const CARTA: Cafe[] = [
  { slug: "espresso", nombre: "Espresso", familia: "Caliente", nota: "Corto, denso, sin vueltas. El que se toma de pie.", probado: true },
  { slug: "cortado", nombre: "Cortado", familia: "Caliente", nota: "El punto medio que casi todo el país eligió.", probado: true },
  { slug: "flat-white", nombre: "Flat White", familia: "Caliente", nota: "Más café que leche. Para los que ya saben.", probado: true },
  { slug: "latte", nombre: "Latte", familia: "Caliente", nota: "Suave, largo, para cuando el día viene difícil.", probado: true },
  { slug: "cappuccino", nombre: "Cappuccino", familia: "Caliente", nota: "Espuma de verdad, no crema batida.", probado: true },
  { slug: "americano", nombre: "Americano", familia: "Caliente", nota: "Agua y espresso. Sorprendentemente difícil de hacer bien.", probado: true },
  { slug: "macchiato", nombre: "Macchiato", familia: "Caliente", nota: "Un espresso con una mancha. Literalmente.", probado: true },
  { slug: "mocha", nombre: "Mocha", familia: "Caliente", nota: "Chocolate de verdad. No jarabe.", probado: true },
  { slug: "filtrado", nombre: "Filtrado V60", familia: "Caliente", nota: "Cuatro minutos de paciencia que valen la pena.", probado: true },
  { slug: "cold-brew", nombre: "Cold Brew", familia: "Frío", nota: "18 horas de reposo. La casa se llama así por algo.", probado: true },
  { slug: "cold-brew-tonica", nombre: "Cold Brew Tónica", familia: "Frío", nota: "Suena raro. Después no vas a querer otra cosa.", probado: true },
  { slug: "nitro", nombre: "Nitro", familia: "Frío", nota: "Cae como una Guinness. Sin el lunes siguiente.", probado: false },
  { slug: "affogato", nombre: "Affogato", familia: "Frío", nota: "Helado ahogado en espresso. El postre que es café.", probado: false },
];

/** Manifiesto — adaptado del storytelling del PDF de marca. */
export const MANIFIESTO = [
  "La ciudad no frena. La gente va, viene, corre, llega tarde, sale antes, cambia de plan.",
  "Y en el medio de todo eso existen esos momentos chiquitos que hacen que el día se sienta distinto. Un café antes de arrancar. Una pausa entre una cosa y la otra. Un minuto para vos antes de seguir.",
  "Zorvo nace para estar ahí.",
  "El nombre viene de un gesto que hacemos todos los días casi sin pensarlo: dar un sorbo. Por unos segundos todo baja la velocidad. El ruido queda afuera. Volvés al presente. Después seguís, claro que seguís. Pero ese momento ya cambió algo.",
  "No queremos convertir el café en una experiencia complicada. Queremos que sea excelente. Que sea el café que elegís porque sabés que siempre va a estar bueno.",
];

export const NO_SOMOS = [
  "Sofisticados por apariencia",
  "Exclusivos",
  "Fríos o distantes",
  "Un café que intimida",
  "Una marca que sigue tendencias",
];

export const SI_SOMOS = [
  "Cercanos",
  "Relajados",
  "Honestos",
  "Espontáneos",
  "Café de calidad sin solemnidad",
];

/** Socio de ejemplo para el shell del Club. Datos falsos, sin backend. */
export const SOCIO_DEMO = {
  nombre: "Marcos",
  apellido: "Ostello",
  codigo: "ZRV-A1B2",
  desde: "marzo 2026",
  cafesTotales: 47,
  visitasMes: 12,
  loDeSiempre: "Cold Brew, 300ml",
};
