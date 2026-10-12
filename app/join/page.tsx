"use client";

import Link from "next/link";
import { useActionState } from "react";

import { ZorvoWalk, ZorvoWordmark } from "@/components/brand";
import { Casillas } from "@/components/brand/Casillas";
import { Llenable } from "@/components/brand/Llenable";
import { Button } from "@/components/primitives/Button";
import { BotonGoogle } from "@/components/primitives/BotonGoogle";
import { ALTA, CARTA } from "@/lib/content";
import { altaSocio, type EstadoAuth } from "../(auth)/actions";

const retraso = (s: number) => ({ ["--retraso" as string]: `${s}s` });

const CAMPO =
  "h-14 w-full rounded-[2px] border-2 border-[var(--zrv-espresso-500)] bg-[var(--zrv-espresso-800)] px-4 text-lg text-cream placeholder:text-[var(--zrv-espresso-300)] focus:border-venus focus:outline-none";

/**
 * El puente entre la landing y el Club: última pantalla del sitio público,
 * primera del producto. Continúa la historia donde la dejó el cierre de la
 * landing: las trece casillas, con la primera llenándose.
 *
 * Tres bloques que se reacomodan según el ancho:
 *   teléfono → relato, formulario, casillas (el formulario sube: es a lo que
 *              se vino, no hay que hacer scroll para encontrarlo)
 *   desktop  → relato y casillas a la izquierda, formulario a la derecha
 */
export default function Join() {
  const [estado, action, pendiente] = useActionState<EstadoAuth, FormData>(altaSocio, {});

  return (
    <main data-surface="espresso" className="zrv-grain min-h-dvh bg-espresso text-cream">
      <div className="mx-auto grid min-h-dvh w-full max-w-[90rem] lg:grid-cols-12 lg:grid-rows-[1fr_auto]">
        {/* ── Relato ─────────────────────────────────────────────────────── */}
        <div className="px-5 pt-7 md:px-10 lg:col-span-7 lg:row-start-1 lg:border-r lg:border-[var(--zrv-espresso-600)] lg:pt-10">
          <div className="flex items-center justify-between">
            <Link href="/" aria-label="Zorvo — volver al inicio">
              <ZorvoWordmark className="h-5 w-auto text-venus" />
            </Link>
            <Link href="/ingresar" className="zrv-label text-[var(--zrv-espresso-200)] underline-offset-4 hover:underline">
              Ya soy socio
            </Link>
          </div>

          <p className="zrv-label zrv-carga-subir mt-14 text-venus lg:mt-20" style={retraso(0.05)}>
            {ALTA.marca}
          </p>

          <h1 className="zrv-display mt-5 text-[clamp(3.5rem,11vw,9.5rem)] leading-[0.82]">
            {ALTA.titulo.map((linea, i) => (
              <span
                key={linea}
                className={`zrv-carga-subir block ${i === 1 ? "text-venus" : ""}`}
                style={retraso(0.12 + i * 0.1)}
              >
                {linea}
              </span>
            ))}
          </h1>

          <ul className="zrv-display mt-8 space-y-1 text-[clamp(1.5rem,2.8vw,2.4rem)] leading-[1.05] text-cream/90">
            {ALTA.promesas.map((p, i) => (
              <li key={p} className="zrv-carga-subir" style={retraso(0.4 + i * 0.08)}>
                {p}
              </li>
            ))}
          </ul>
        </div>

        {/* ── Formulario ─────────────────────────────────────────────────── */}
        <div className="flex items-center px-5 py-12 md:px-10 lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1 lg:py-10">
          <div className="zrv-carga-subir w-full max-w-[28rem] lg:mx-auto" style={retraso(0.3)}>
            <BotonGoogle etiqueta="Sumarme con Google" />

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
                <input id="nombre" name="nombre" type="text" autoComplete="given-name" required placeholder="Marcos" className={CAMPO} />
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
                  className={CAMPO}
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

              <Button type="submit" variant="accent" size="lg" className="mt-2 w-full" disabled={pendiente}>
                {pendiente ? "Mandando el código…" : "Crear mi credencial"}
              </Button>

              <p className="text-center text-xs leading-relaxed text-cream/75">
                Al sumarte aceptás los términos del Club. Podés darte de baja cuando quieras y llevarte tus datos.
              </p>
            </form>
          </div>
        </div>

        {/* ── Casillas ───────────────────────────────────────────────────── */}
        <div className="flex items-end justify-between gap-6 border-t border-[var(--zrv-espresso-600)] px-5 pb-8 pt-10 md:px-10 lg:col-span-7 lg:row-start-2 lg:border-r lg:pb-10">
          <div className="min-w-0">
            <Casillas
              modo="carga"
              total={CARTA.length}
              llenas={1}
              etiqueta={`${CARTA.length} casillas vacías: la primera se llena con tu próximo café`}
              claseBorde="border-[var(--zrv-espresso-500)]"
              claseRelleno="bg-venus"
              claseVaso="text-espresso-deep"
            />
            <p className="zrv-label mt-4 text-[var(--zrv-espresso-200)]">{ALTA.casillas}</p>
          </div>
          <div className="hidden h-40 shrink-0 sm:block lg:h-52">
            <Llenable
              modo="carga"
              Ilustracion={ZorvoWalk}
              titulo="Persona caminando con un café Zorvo"
              className="h-full"
              claseBase="text-[var(--zrv-espresso-600)]"
              claseLleno="text-cream"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
