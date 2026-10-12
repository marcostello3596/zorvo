"use client";

import { useEffect, useRef, useState } from "react";

type Estado = "arrancando" | "leyendo" | "sin-permiso" | "sin-camara" | "pausado";

/**
 * Cámara del mostrador. Usa qr-scanner (BarcodeDetector nativo cuando el
 * navegador lo tiene, un worker de respaldo cuando no). Se pausa sola cuando
 * hay una ficha abierta, para no leer el mismo QR dos veces.
 */
export function Escaner({ activo, onLeer }: { activo: boolean; onLeer: (texto: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const scanner = useRef<import("qr-scanner").default | null>(null);
  const onLeerRef = useRef(onLeer);
  const ultimo = useRef<{ t: string; at: number }>({ t: "", at: 0 });
  const [estado, setEstado] = useState<Estado>("arrancando");
  const [intento, setIntento] = useState(0);

  useEffect(() => { onLeerRef.current = onLeer; }, [onLeer]);

  useEffect(() => {
    if (!activo) {
      scanner.current?.stop();
      setEstado("pausado");
      return;
    }
    let cancelado = false;
    (async () => {
      setEstado("arrancando");
      const { default: QrScanner } = await import("qr-scanner");
      if (cancelado || !video.current) return;
      if (!(await QrScanner.hasCamera())) {
        if (!cancelado) setEstado("sin-camara");
        return;
      }
      if (!scanner.current) {
        scanner.current = new QrScanner(
          video.current,
          (r) => {
            const t = r.data.trim();
            const ahora = Date.now();
            // el mismo código en cámara se lee varias veces por segundo
            if (t === ultimo.current.t && ahora - ultimo.current.at < 4000) return;
            ultimo.current = { t, at: ahora };
            onLeerRef.current(t);
          },
          { returnDetailedScanResult: true, preferredCamera: "environment", maxScansPerSecond: 8, highlightScanRegion: false, highlightCodeOutline: false },
        );
      }
      try {
        await scanner.current.start();
        if (!cancelado) setEstado("leyendo");
      } catch (e) {
        if (cancelado) return;
        const m = String(e).toLowerCase();
        setEstado(m.includes("notallowed") || m.includes("permission") || m.includes("denied") ? "sin-permiso" : "sin-camara");
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [activo, intento]);

  // liberar la cámara al salir de la página
  useEffect(() => () => {
    scanner.current?.destroy();
    scanner.current = null;
  }, []);

  return (
    <div className={`escaner escaner--${estado}`}>
      <video ref={video} className="escaner__video" muted playsInline aria-hidden="true" />
      <span className="escaner__frame" aria-hidden="true"><i /><i /><i /><i /></span>
      {estado === "leyendo" ? <span className="escaner__line" aria-hidden="true" /> : null}
      <p className="escaner__estado" role="status">
        {estado === "arrancando" && "Abriendo la cámara…"}
        {estado === "leyendo" && "Apuntá al QR del cliente"}
        {estado === "pausado" && "Cámara en pausa"}
        {estado === "sin-camara" && "No encontramos una cámara. Buscá al cliente por código o email."}
        {estado === "sin-permiso" && (
          <>
            Sin permiso para usar la cámara. Habilitala en el navegador y{" "}
            <button type="button" className="escaner__retry" onClick={() => setIntento((n) => n + 1)}>probá de nuevo</button>.
          </>
        )}
      </p>
    </div>
  );
}
