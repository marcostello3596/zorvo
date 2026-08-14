/**
 * Credencial rotativa — esquema tipo TOTP (§6).
 *
 * Este archivo NO importa "server-only" a propósito: las mismas funciones
 * corren en el navegador del socio (para generar) y en el servidor (para
 * verificar en el escaneo). Usa Web Crypto, que existe igual en ambos desde
 * Node 18. Si la generación y la verificación vivieran en implementaciones
 * distintas, un día divergirían y el mostrador dejaría de leer credenciales
 * sin que nadie entienda por qué.
 *
 * FORMATO
 *
 *   zrv1.<member_code>.<step>.<hmac>
 *
 *   step = floor(unix_time / 30)
 *   hmac = base32(HMAC-SHA256(secreto, "<member_code>.<step>"))[0..9]
 *
 * POR QUÉ ASÍ
 *
 * · El código se regenera en el dispositivo, sin red. La credencial funciona
 *   en el subte, con mala señal, en modo avión.
 * · No lleva ningún dato personal. Solo el código de socio, que por sí solo
 *   no sirve para nada.
 * · Una captura de pantalla vale 30 segundos, y solo si nadie la usó antes:
 *   el UNIQUE sobre (member_id, kind, token_step) en scan_events hace que el
 *   mismo código no se pueda cobrar dos veces.
 */

export const VENTANA_SEGUNDOS = 30;
export const PREFIJO = "zrv1";

/** Tolerancia de reloj: se aceptan el paso anterior y el siguiente. */
export const PASOS_TOLERANCIA = 1;

/**
 * Mismo alfabeto que member_code: sin 0/O/1/I/L.
 * Si algún día hay que dictar un código por teléfono, no se presta a error.
 */
const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function pasoActual(ahora: number = Date.now()): number {
  return Math.floor(ahora / 1000 / VENTANA_SEGUNDOS);
}

/** Segundos que le quedan de vida al código actual. Para el contador visual. */
export function segundosRestantes(ahora: number = Date.now()): number {
  return VENTANA_SEGUNDOS - Math.floor(ahora / 1000) % VENTANA_SEGUNDOS;
}

function aBytes(texto: string): Uint8Array {
  return new TextEncoder().encode(texto);
}

/** base64 → bytes, sin depender de Buffer (que no existe en el navegador). */
export function secretoABytes(secretoB64: string): Uint8Array {
  const binario = atob(secretoB64);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return bytes;
}

function codificar(bytes: Uint8Array, largo: number): string {
  let salida = "";
  for (let i = 0; i < largo; i++) {
    // El módulo introduce un sesgo mínimo (31 no divide a 256), irrelevante
    // acá: el código no es un secreto, es una prueba de posesión del secreto.
    salida += ALFABETO[bytes[i % bytes.length]! % ALFABETO.length];
  }
  return salida;
}

async function firmar(secreto: Uint8Array, mensaje: string): Promise<Uint8Array> {
  const clave = await crypto.subtle.importKey(
    "raw",
    secreto as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const firma = await crypto.subtle.sign("HMAC", clave, aBytes(mensaje) as BufferSource);
  return new Uint8Array(firma);
}

/** Genera el token de un paso. Lo usa el dispositivo del socio. */
export async function generarToken(
  memberCode: string,
  secretoB64: string,
  paso: number = pasoActual(),
): Promise<string> {
  const firma = await firmar(secretoABytes(secretoB64), `${memberCode}.${paso}`);
  return [PREFIJO, memberCode, paso, codificar(firma, 10)].join(".");
}

export type TokenParseado = {
  memberCode: string;
  paso: number;
  hmac: string;
};

export function parsearToken(token: string): TokenParseado | null {
  const partes = token.trim().split(".");
  if (partes.length !== 4) return null;

  const [prefijo, memberCode, pasoTexto, hmac] = partes;
  if (prefijo !== PREFIJO) return null;
  if (!memberCode || !/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/.test(memberCode)) return null;

  const paso = Number(pasoTexto);
  if (!Number.isInteger(paso) || paso <= 0) return null;
  if (!hmac || hmac.length !== 10) return null;

  return { memberCode, paso, hmac };
}

export type ResultadoVerificacion =
  | { ok: true; paso: number }
  | { ok: false; motivo: "invalid" | "expired" };

/**
 * Verifica un token contra el secreto del socio. Lo usa el servidor cuando
 * el barista escanea.
 *
 * Acepta el paso anterior y el siguiente: entre que el socio muestra la
 * pantalla y el barista enfoca pasan segundos, y los relojes de dos
 * dispositivos nunca coinciden exactamente.
 *
 * IMPORTANTE: esta función NO decide si el token ya se usó. Eso lo resuelve
 * el UNIQUE de scan_events dentro de la transacción, que es el único lugar
 * donde no hay carrera posible.
 */
export async function verificarToken(
  token: string,
  secretoB64: string,
  ahora: number = Date.now(),
): Promise<ResultadoVerificacion> {
  const parseado = parsearToken(token);
  if (!parseado) return { ok: false, motivo: "invalid" };

  const paso = pasoActual(ahora);
  const distancia = Math.abs(paso - parseado.paso);
  if (distancia > PASOS_TOLERANCIA) return { ok: false, motivo: "expired" };

  const esperado = await generarToken(parseado.memberCode, secretoB64, parseado.paso);
  const hmacEsperado = esperado.split(".")[3]!;

  if (!comparacionConstante(hmacEsperado, parseado.hmac)) {
    return { ok: false, motivo: "invalid" };
  }

  return { ok: true, paso: parseado.paso };
}

/**
 * Comparación en tiempo constante.
 *
 * Con `===`, el tiempo de respuesta depende de cuántos caracteres coinciden,
 * y eso permite adivinar el código carácter por carácter midiendo la demora.
 * Acá el riesgo real es bajo —el token vive 30 segundos— pero escribir la
 * comparación insegura una vez es cómo termina copiada en un lugar donde sí
 * importa.
 */
function comparacionConstante(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diferencia = 0;
  for (let i = 0; i < a.length; i++) {
    diferencia |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diferencia === 0;
}
