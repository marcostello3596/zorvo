"use client";

import { useActionState } from "react";

import { altaSocio, conGoogle, ingresar, verificar, type EstadoAuth } from "@/app/(auth)/actions";

const inicial: EstadoAuth = {};

function ErrorMsg({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="field__err" role="alert" style={{ whiteSpace: "pre-line" }}>{msg}</p>;
}

export function FormAlta() {
  const [estado, accion, pendiente] = useActionState(altaSocio, inicial);
  return (
    <form className="reg__form" action={accion} noValidate>
      <div className="field">
        <label htmlFor="nombre">Tu nombre</label>
        <input id="nombre" name="nombre" type="text" autoComplete="given-name" placeholder="Como te dicen en la barra" required maxLength={60} />
      </div>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" inputMode="email" placeholder="vos@mail.com" required />
      </div>
      <ErrorMsg msg={estado.error} />
      <button className="btn btn--yellow btn--block" type="submit" disabled={pendiente}>
        {pendiente ? "Mandando el código…" : "Crear mi tarjeta"}
      </button>
      <p className="reg__fine">Te mandamos un código de 6 dígitos. Nada de contraseñas y nada de spam: solo te avisamos cuando tenés un café de regalo.</p>
    </form>
  );
}

export function FormIngreso({ next, email }: { next?: string; email?: string }) {
  const [estado, accion, pendiente] = useActionState(ingresar, inicial);
  return (
    <form className="reg__form" action={accion} noValidate>
      <input type="hidden" name="next" value={next ?? "/club"} />
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" inputMode="email" placeholder="vos@mail.com" defaultValue={email} required />
      </div>
      <ErrorMsg msg={estado.error} />
      <button className="btn btn--yellow btn--block" type="submit" disabled={pendiente}>
        {pendiente ? "Mandando el código…" : "Mandame el código"}
      </button>
    </form>
  );
}

export function FormCodigo({ email, next }: { email: string; next?: string }) {
  const [estado, accion, pendiente] = useActionState(verificar, inicial);
  return (
    <form className="reg__form" action={accion} noValidate>
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="next" value={next ?? "/club"} />
      <div className="field">
        <label htmlFor="codigo">Código</label>
        <input
          id="codigo"
          name="codigo"
          className="field__code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={10}
          placeholder="••••••"
          required
          autoFocus
        />
      </div>
      <ErrorMsg msg={estado.error} />
      <button className="btn btn--yellow btn--block" type="submit" disabled={pendiente}>
        {pendiente ? "Verificando…" : "Entrar"}
      </button>
    </form>
  );
}

/** Solo se muestra si el proveedor de Google está configurado en Supabase. */
export function BotonGoogle() {
  const [estado, accion, pendiente] = useActionState(async () => conGoogle(), inicial);
  if (process.env.NEXT_PUBLIC_AUTH_GOOGLE !== "1") return null;
  return (
    <form action={accion}>
      <button className="btn btn--block reg__google" type="submit" disabled={pendiente}>
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.8 14.2a6.6 6.6 0 0 1 0-4.3V7.1H2.1a11 11 0 0 0 0 9.9l3.7-2.8z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4z"/></svg>
        Seguir con Google
      </button>
      <ErrorMsg msg={estado.error} />
    </form>
  );
}
