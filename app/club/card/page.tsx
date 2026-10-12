import { redirect } from "next/navigation";

/** Ruta vieja de la credencial: ahora el QR es una hoja dentro de /club. */
export default function Card() {
  redirect("/club?qr=1");
}
