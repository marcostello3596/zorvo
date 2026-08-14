"use client";

import QRCode from "qrcode";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  generarToken,
  pasoActual,
  segundosRestantes,
  VENTANA_SEGUNDOS,
} from "@/lib/credential";
import { obtenerSecretoCredencial } from "@/app/club/credential-actions";

const CLAVE_SECRETO = "zrv.credencial.secreto";
const CLAVE_CODIGO = "zrv.credencial.code";

/**
 * La credencial que se muestra en el mostrador.
 *
 * El secreto se pide UNA VEZ y queda en el navegador. A partir de ahí el QR
 * se regenera cada 30 segundos sin tocar la red: eso es lo que hace que
 * funcione con mala señal, que es exactamente cuando se usa —adentro de un
 * local, con el teléfono en la mano y gente atrás en la fila.
 *
 * Guardo en localStorage y no en IndexedDB como decía el plan. Para 32 bytes
 * la complejidad extra de IDB no compra nada: ninguno de los dos protege
 * contra XSS, y localStorage es síncrono, lo que evita un estado de carga
 * más en la pantalla que tiene que abrir instantánea.
 */
export function CredencialRotativa({ className = "" }: { className?: string }) {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [restantes, setRestantes] = useState(VENTANA_SEGUNDOS);
  const credencial = useRef<{ memberCode: string; secreto: string } | null>(null);
  const ultimoPaso = useRef<number>(-1);

  const dibujar = useCallback(async () => {
    const cred = credencial.current;
    if (!cred) return;

    const paso = pasoActual();
    if (paso === ultimoPaso.current) return;
    ultimoPaso.current = paso;

    const token = await generarToken(cred.memberCode, cred.secreto, paso);

    // errorCorrectionLevel M: tolera hasta 15% de daño. Suficiente para una
    // pantalla con huellas y brillo bajo, sin agrandar tanto el patrón que
    // deje de leerse rápido.
    const dibujo = await QRCode.toString(token, {
      type: "svg",
      margin: 0,
      errorCorrectionLevel: "M",
      color: { dark: "#2D060B", light: "#F3F5EE" },
    });

    setSvg(dibujo);
  }, []);

  // Carga del secreto: primero lo guardado, y solo si no hay se pide al server.
  useEffect(() => {
    let vivo = true;

    (async () => {
      try {
        const guardado = localStorage.getItem(CLAVE_SECRETO);
        const codigo = localStorage.getItem(CLAVE_CODIGO);

        if (guardado && codigo) {
          credencial.current = { memberCode: codigo, secreto: guardado };
          if (vivo) await dibujar();
          return;
        }

        const res = await obtenerSecretoCredencial();
        if (!vivo) return;

        if (!res.ok) {
          setError(res.error);
          return;
        }

        localStorage.setItem(CLAVE_SECRETO, res.secreto);
        localStorage.setItem(CLAVE_CODIGO, res.memberCode);
        credencial.current = { memberCode: res.memberCode, secreto: res.secreto };
        await dibujar();
      } catch {
        if (vivo) setError("No pudimos preparar tu credencial.");
      }
    })();

    return () => {
      vivo = false;
    };
  }, [dibujar]);

  // Un solo intervalo de 1s maneja el contador y el redibujo. Dos timers
  // separados se desincronizan y el QR cambia un segundo antes o después de
  // que el contador llegue a cero.
  useEffect(() => {
    const id = setInterval(() => {
      setRestantes(segundosRestantes());
      void dibujar();
    }, 1000);
    return () => clearInterval(id);
  }, [dibujar]);

  // Al volver de segundo plano el intervalo puede haber quedado atrasado.
  useEffect(() => {
    const alVolver = () => {
      if (document.visibilityState === "visible") {
        setRestantes(segundosRestantes());
        void dibujar();
      }
    };
    document.addEventListener("visibilitychange", alVolver);
    return () => document.removeEventListener("visibilitychange", alVolver);
  }, [dibujar]);

  if (error) {
    return (
      <div className={`flex aspect-square items-center justify-center bg-cream p-6 ${className}`}>
        <p className="text-center text-sm text-[var(--zrv-stone-700)]">
          {error}
          <br />
          <span className="mt-2 block">
            Decile tu código a quien te atiende.
          </span>
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="aspect-square w-full bg-cream p-4">
        {svg ? (
          <div
            className="h-full w-full [&>svg]:h-full [&>svg]:w-full"
            // El SVG lo produce la librería de QR a partir de un token que
            // generamos nosotros: no hay entrada de usuario en el medio.
            dangerouslySetInnerHTML={{ __html: svg }}
            role="img"
            aria-label="Código QR de tu credencial"
          />
        ) : (
          <div className="h-full w-full animate-pulse bg-[var(--zrv-stone-150)]" />
        )}
      </div>

      {/* Barra de vida del código. Es información, no decoración: le dice al
          socio si conviene esperar el próximo antes de que el barista enfoque. */}
      <div className="mt-3 flex items-center gap-3">
        <div
          className="h-1 flex-1 bg-[var(--zrv-espresso-600)]"
          role="img"
          aria-label={`El código se renueva en ${restantes} segundos`}
        >
          <div
            className="h-full bg-venus transition-[width] duration-1000 ease-linear"
            style={{ width: `${(restantes / VENTANA_SEGUNDOS) * 100}%` }}
          />
        </div>
        <span className="zrv-data w-8 shrink-0 text-right text-xs text-[var(--zrv-espresso-200)]">
          {restantes}s
        </span>
      </div>
    </div>
  );
}
