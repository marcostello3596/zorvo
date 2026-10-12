import { entrarComoPrueba } from "@/app/(auth)/dev-actions";

/**
 * Acceso de prueba — SOLO DESARROLLO. En producción no renderiza nada.
 * Requiere ZORVO_DEV_LOGIN=1 en .env.local. Se ve feo a propósito.
 */
export function BotonPrueba() {
  if (process.env.NODE_ENV === "production" || process.env.ZORVO_DEV_LOGIN !== "1") return null;
  return (
    <form action={entrarComoPrueba} className="dev-login">
      <button type="submit" className="demo-chip demo-chip--block">
        <span className="demo-chip__tag">Dev</span> Entrar como socio de prueba
      </button>
    </form>
  );
}
