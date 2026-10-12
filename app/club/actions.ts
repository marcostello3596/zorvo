"use server";

import { getPremiosPendientes, getSocio, getTarjeta } from "@/lib/queries";

/**
 * Estado liviano de la tarjeta. La hoja del QR lo consulta cada pocos
 * segundos mientras está abierta: cuando el barista suma una Z, la tarjeta
 * del socio se sella en vivo sin que tenga que recargar nada.
 */
export async function estadoTarjeta() {
  const socio = await getSocio();
  if (!socio) return null;
  const [tarjeta, premios] = await Promise.all([getTarjeta(socio.memberId), getPremiosPendientes(socio.memberId)]);
  return { ...tarjeta, premios: premios.length };
}
