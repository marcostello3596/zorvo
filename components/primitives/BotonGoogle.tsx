"use client";

import { useActionState } from "react";

import { conGoogle, type EstadoAuth } from "@/app/(auth)/actions";

/**
 * Botón de Google.
 *
 * El logo va a color, no monocromo en amarillo Zorvo: los términos de marca
 * de Google no permiten recolorearlo, y además la gente lo reconoce por el
 * color antes que por la forma. Es de las pocas excepciones legítimas a
 * "todo pasa por los tokens".
 */
export function BotonGoogle({ etiqueta = "Entrar con Google" }: { etiqueta?: string }) {
  const [estado, action, pendiente] = useActionState<EstadoAuth, FormData>(
    async () => conGoogle(),
    {},
  );

  return (
    <>
      <form action={action}>
        <button
          type="submit"
          disabled={pendiente}
          className="flex h-14 w-full items-center justify-center gap-3 rounded-[2px] bg-cream px-6 font-mono text-sm uppercase tracking-[0.13em] text-[var(--zrv-stone-900)] transition-opacity hover:opacity-90 disabled:opacity-45"
        >
          <svg viewBox="0 0 48 48" className="h-5 w-5 shrink-0" aria-hidden="true">
            <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.8c-.5 2.7-2 5-4.4 6.6v5.5h7.1c4.2-3.8 6.6-9.5 6.6-16.1z" />
            <path fill="#34A853" d="M24 46c6 0 11-2 14.6-5.4l-7.1-5.5c-2 1.3-4.5 2.1-7.5 2.1-5.8 0-10.7-3.9-12.4-9.1H4.3v5.7C7.9 41.1 15.4 46 24 46z" />
            <path fill="#FBBC05" d="M11.6 28.1c-.4-1.3-.7-2.7-.7-4.1s.2-2.8.7-4.1v-5.7H4.3C2.8 17.1 2 20.4 2 24s.8 6.9 2.3 9.8l7.3-5.7z" />
            <path fill="#EA4335" d="M24 10.8c3.3 0 6.2 1.1 8.5 3.3l6.3-6.3C35 4.1 30 2 24 2 15.4 2 7.9 6.9 4.3 14.2l7.3 5.7c1.7-5.2 6.6-9.1 12.4-9.1z" />
          </svg>
          {pendiente ? "Abriendo Google…" : etiqueta}
        </button>
      </form>

      {estado.error && (
        <p role="alert" className="mt-3 text-sm text-venus">
          {estado.error}
        </p>
      )}
    </>
  );
}
