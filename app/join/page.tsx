"use client";

import Link from "next/link";
import { useActionState } from "react";

import { ZorvoWordmark, ZorvoWalk } from "@/components/brand";
import { Button } from "@/components/primitives/Button";
import { BotonGoogle } from "@/components/primitives/BotonGoogle";
import { RECORRIDO_DESTACADO } from "@/lib/content";
import { altaSocio, type EstadoAuth } from "../(auth)/actions";

/**
 * El puente entre la landing y el Club: última pantalla del sitio público,
 * primera del producto. El alta es real — OTP de 6 dígitos por email (§3).
 */
export default function Join() {
  const [estado, action, pendiente] = useActionState<EstadoAuth, FormData>(
    altaSocio,
    {},
  );

  return (
    <main
      data-surface="espresso"
      className="zrv-grain flex min-h-dvh flex-col bg-espresso text-cream"
    >
      <div className="mx-auto flex w-full max-w-[30rem] flex-1 flex-col px-5 py-7">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="Zorvo — inicio">
            <ZorvoWordmark className="h-4 w-auto text-venus" />
          </Link>
          <Link href="/ingresar" className="zrv-label text-[var(--zrv-espresso-200)]">
            Ya soy socio
          </Link>
        </div>

        <div className="flex-1 pt-12">
          <h1 className="zrv-display text-[clamp(2.5rem,13vw,3.5rem)] leading-[0.9] text-cream">
            Sumate
            <br />
            <span className="text-venus">al Club</span>
          </h1>

          <p className="mt-5 max-w-[36ch] text-base leading-relaxed text-cream/85">
            Es gratis. {RECORRIDO_DESTACADO.promesa} No hay letra chica y no te
            vamos a llenar de mails.
          </p>

          <div className="mt-8">
            <BotonGoogle etiqueta="Sumarme con Google" />
          </div>

          <div className="my-7 flex items-center gap-4" aria-hidden="true">
            <span className="h-px flex-1 bg-[var(--zrv-espresso-500)]" />
            <span className="zrv-label text-[var(--zrv-espresso-300)]">o con tu email</span>
            <span className="h-px flex-1 bg-[var(--zrv-espresso-500)]" />
          </div>

          <form action={action} className="flex flex-col gap-4">
            <div>
              <label htmlFor="nombre" className="zrv-label mb-2 block text-venus">
                Cómo te llamás
              </label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                autoComplete="given-name"
                required
                placeholder="Marcos"
                className="h-14 w-full rounded-[2px] border-2 border-[var(--zrv-espresso-500)] bg-[var(--zrv-espresso-800)] px-4 text-lg text-cream placeholder:text-[var(--zrv-espresso-400)] focus:border-venus focus:outline-none"
              />
            </div>

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
                aria-describedby={estado.error ? "error" : "email-hint"}
                aria-invalid={estado.error ? true : undefined}
                className="h-14 w-full rounded-[2px] border-2 border-[var(--zrv-espresso-500)] bg-[var(--zrv-espresso-800)] px-4 text-lg text-cream placeholder:text-[var(--zrv-espresso-400)] focus:border-venus focus:outline-none"
              />
              <p id="email-hint" className="mt-2 text-sm text-cream/70">
                Te mandamos un código por mail. Sin contraseñas.
              </p>
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
              className="mt-2 w-full"
              disabled={pendiente}
            >
              {pendiente ? "Mandando el código…" : "Crear mi credencial"}
            </Button>

            <p className="text-center text-xs leading-relaxed text-cream/60">
              Al sumarte aceptás los términos del Club. Podés darte de baja
              cuando quieras y llevarte tus datos.
            </p>
          </form>
        </div>

        <ZorvoWalk className="mx-auto mt-10 h-40 w-auto text-[var(--zrv-espresso-600)]" />
      </div>
    </main>
  );
}
