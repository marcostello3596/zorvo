"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useActionState } from "react";

import { Button } from "@/components/primitives/Button";
import { BotonGoogle } from "@/components/primitives/BotonGoogle";
import { ingresar, type EstadoAuth } from "../actions";

/** Mensajes que vuelven del callback de Google. */
function AvisoCallback() {
  const params = useSearchParams();

  if (params.get("cancelado")) {
    return (
      <p role="status" className="mt-4 text-sm text-cream/70">
        Cancelaste el ingreso con Google. Podés probar de nuevo o usar tu email.
      </p>
    );
  }
  if (params.get("error")) {
    return (
      <p role="alert" className="mt-4 text-sm text-venus">
        No pudimos completar el ingreso. Probá otra vez.
      </p>
    );
  }
  return null;
}

export function FormularioIngreso() {
  const [estado, action, pendiente] = useActionState<EstadoAuth, FormData>(
    ingresar,
    {},
  );

  return (
    <>
      <Suspense fallback={null}>
        <AvisoCallback />
      </Suspense>

      <div className="mt-8">
        <BotonGoogle />
      </div>

      {/* Separador editorial: línea y etiqueta mono, como el resto del sistema */}
      <div className="my-7 flex items-center gap-4" aria-hidden="true">
        <span className="h-px flex-1 bg-[var(--zrv-espresso-500)]" />
        <span className="zrv-label text-[var(--zrv-espresso-300)]">o con tu email</span>
        <span className="h-px flex-1 bg-[var(--zrv-espresso-500)]" />
      </div>

      <form action={action} className="flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="zrv-label mb-2 block text-venus">
            Tu email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            placeholder="vos@ejemplo.com"
            aria-describedby={estado.error ? "error" : undefined}
            aria-invalid={estado.error ? true : undefined}
            className="h-14 w-full rounded-[2px] border-2 border-[var(--zrv-espresso-500)] bg-[var(--zrv-espresso-800)] px-4 text-lg text-cream placeholder:text-[var(--zrv-espresso-400)] focus:border-venus focus:outline-none"
          />
        </div>

        {estado.error && (
          <p id="error" role="alert" className="whitespace-pre-line text-sm text-venus">
            {estado.error}
          </p>
        )}

        <Button
          type="submit"
          variant="outline"
          size="lg"
          className="w-full text-cream"
          disabled={pendiente}
        >
          {pendiente ? "Mandando…" : "Mandame un código"}
        </Button>
      </form>
    </>
  );
}
