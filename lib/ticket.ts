import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { getServerEnv } from "@/lib/env";

/**
 * Ticket del mostrador.
 *
 * Entre que el barista escanea y toca "Sumar" pasan segundos o minutos
 * (elegir productos, cobrar). El QR del socio vive 30 s, así que no se puede
 * volver a verificar en el segundo paso. En su lugar, al identificar al
 * socio el servidor firma lo que verificó (quién, con qué código, quién
 * escaneó) y el segundo paso solo acepta esa firma. Así el navegador del
 * mostrador no puede inventar un socio ni un paso de código.
 *
 * El anti-replay sigue siendo el UNIQUE de scan_events: el ticket solo
 * transporta el paso; zorvo_register_visit es quien lo consume.
 */

export type Ticket = {
  /** member_id */
  m: string;
  /** staff_id que identificó al socio */
  st: string;
  /** "rotating" si vino de un QR; null si el barista lo buscó a mano */
  k: "rotating" | null;
  /** paso del código (solo con k = rotating) */
  s: number | null;
  /** vencimiento, epoch ms */
  exp: number;
};

const VIDA_MS = 5 * 60 * 1000;

function clave() {
  // Clave derivada: el master no se usa crudo para dos cosas distintas.
  return createHmac("sha256", getServerEnv().CREDENTIAL_HMAC_MASTER).update("zorvo:ticket-mostrador:v1").digest();
}

const b64url = (b: Buffer) => b.toString("base64url");

export function firmarTicket(t: Omit<Ticket, "exp">): string {
  const cuerpo = b64url(Buffer.from(JSON.stringify({ ...t, exp: Date.now() + VIDA_MS })));
  const firma = b64url(createHmac("sha256", clave()).update(cuerpo).digest());
  return `${cuerpo}.${firma}`;
}

export function leerTicket(ticket: string, staffId: string): Ticket | null {
  const [cuerpo, firma] = ticket.split(".");
  if (!cuerpo || !firma) return null;
  const esperada = createHmac("sha256", clave()).update(cuerpo).digest();
  const recibida = Buffer.from(firma, "base64url");
  if (recibida.length !== esperada.length || !timingSafeEqual(recibida, esperada)) return null;
  try {
    const t = JSON.parse(Buffer.from(cuerpo, "base64url").toString("utf8")) as Ticket;
    if (typeof t.exp !== "number" || t.exp < Date.now()) return null;
    // un ticket sirve solo para quien lo pidió
    if (t.st !== staffId) return null;
    return t;
  } catch {
    return null;
  }
}
