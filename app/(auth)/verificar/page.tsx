"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useActionState } from "react";

import { ZorvoWordmark } from "@/components/brand";
import { Button } from "@/components/primitives/Button";
import { verificar, type EstadoAuth } from "../actions";

function Formulario() {
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const esNuevo = params.get("nuevo") === "1";

  const [estado, action, pendiente] = useActionState<EstadoAuth, FormData>(
    verificar,
    {},
  );

  return (
    <form action={action} className="mt-10 flex flex-col gap-4">
      <input type="hidden" name="email" value={email} />

      <div>
        <label htmlFor="codigo" className="zrv-label mb-2 block text-venus">
          El código
        </label>
        <input
          id="codigo"
          name="codigo"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={10}
          required
          autoFocus
          placeholder="······"
          aria-describedby={estado.error ? "error" : undefined}
          aria-invalid={estado.error ? true : undefined}
          // El tracking es menor que el de un campo de 6 fijo: con 8 o 10
          // dígitos, 0.4em desbordaba en pantallas angostas.
          className="zrv-data h-16 w-full rounded-[2px] border-2 border-[var(--zrv-espresso-500)] bg-[var(--zrv-espresso-800)] px-4 text-center text-3xl tracking-[0.2em] text-cream placeholder:text-[var(--zrv-espresso-500)] focus:border-venus focus:outline-none"
        />
      </div>

      {estado.error && (
        <p id="error" role="alert" className="whitespace-pre-line text-sm text-venus">
          {estado.error}
        </p>
      )}

      <Button
        type="submit"
        variant="accent"
        size="lg"
        className="w-full"
        disabled={pendiente}
      >
        {pendiente ? "Verificando…" : esNuevo ? "Crear mi credencial" : "Entrar"}
      </Button>

      <p className="text-center text-sm leading-relaxed text-cream/70">
        ¿No llegó? Mirá en spam, o{" "}
        <Link
          href={esNuevo ? "/join" : "/ingresar"}
          className="underline underline-offset-4"
        >
          pedí uno nuevo
        </Link>
        .
      </p>
    </form>
  );
}

export default function Verificar() {
  return (
    <main
      data-surface="espresso"
      className="zrv-grain flex min-h-dvh flex-col bg-espresso text-cream"
    >
      <div className="mx-auto flex w-full max-w-[30rem] flex-1 flex-col px-5 py-7">
        <Link href="/" aria-label="Zorvo — inicio">
          <ZorvoWordmark className="h-4 w-auto text-venus" />
        </Link>

        <div className="flex-1 pt-12">
          <h1 className="zrv-display text-[clamp(2.25rem,11vw,3rem)] leading-[0.9] text-cream">
            Mirá tu mail
          </h1>
          <p className="mt-4 max-w-[36ch] text-base leading-relaxed text-cream/85">
            Te mandamos un código. Vence en 10 minutos.
          </p>

          <Suspense fallback={<p className="mt-10 text-cream/60">Cargando…</p>}>
            <Formulario />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
