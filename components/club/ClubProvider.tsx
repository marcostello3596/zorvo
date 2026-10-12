"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

import { Svg } from "@/components/Svg";
import { TabBar } from "@/components/club/TabBar";
import { codigoLegible } from "@/components/club/codigo";
import { estadoTarjeta } from "@/app/club/actions";
import { obtenerSecretoCredencial } from "@/lib/credential-actions";
import { generarToken, pasoActual, segundosRestantes, VENTANA_SEGUNDOS } from "@/lib/credential";
import { haptic, toast, zConfetti } from "@/lib/zorvo/fx.js";
import { gsap } from "@/lib/zorvo/gsap.js";
import { createPass } from "@/lib/zorvo/pass.js";
import { qrSvg } from "@/lib/zorvo/qr.js";

export type EstadoClub = { z: number; target: number; tarjetas: number; total: number; premios: number };
type Socio = { nombre: string; memberCode: string };
type Hoja = "qr" | "wallet" | null;

const Ctx = createContext<{ openQr: () => void; openWallet: () => void }>({ openQr: () => {}, openWallet: () => {} });
export const useClub = () => useContext(Ctx);


const WALLET_LISTO = process.env.NEXT_PUBLIC_WALLET_ENABLED === "1";

/**
 * El esqueleto del club: tab bar, hoja del QR, hoja de Wallet y el festejo
 * del café de regalo. Mientras el QR está abierto pregunta cada 2,5 s si el
 * barista ya sumó; cuando pasa, cierra la hoja, refresca la tarjeta (que
 * anima las Z nuevas) y avisa.
 */
export function ClubProvider({ socio, estado, children }: { socio: Socio; estado: EstadoClub; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [hoja, setHoja] = useState<Hoja>(null);
  const [premio, setPremio] = useState(false);
  const ultimo = useRef(estado);

  // El servidor manda el estado fresco en cada refresh: es la referencia.
  useEffect(() => { ultimo.current = estado; }, [estado]);

  const openQr = useCallback(() => { setHoja("qr"); haptic(6); }, []);
  const openWallet = useCallback(() => setHoja("wallet"), []);

  // /club?qr=1 (atajo desde la pantalla de inicio o el pase) abre el QR directo
  useEffect(() => {
    if (params.get("qr") === "1") {
      setHoja("qr");
      router.replace(pathname, { scroll: false });
    }
  }, [params, pathname, router]);

  // entrada de cada pantalla
  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const sc = document.querySelector(".app > .screen");
    if (!sc) return;
    const tw = gsap.from(sc.children, { y: 28, opacity: 0, stagger: 0.05, duration: 0.7, ease: "expo.out", clearProps: "transform,opacity" });
    return () => { tw.revert(); };
  }, [pathname]);

  // ---------- ¿sumó el barista?
  const revisar = useCallback(async () => {
    const nuevo = await estadoTarjeta().catch(() => null);
    if (!nuevo) return;
    const antes = ultimo.current;
    if (nuevo.total === antes.total && nuevo.z === antes.z && nuevo.premios === antes.premios) return;

    ultimo.current = nuevo;
    router.refresh();
    const sumo = nuevo.total > antes.total;
    const canjeo = nuevo.premios < antes.premios;
    if (!sumo && !canjeo) return; // una anulación: se refresca sin festejo

    setHoja(null);
    haptic([12, 40, 12]);

    if (nuevo.tarjetas > antes.tarjetas) {
      // en /club, esperar a que la tarjeta se llene y se dé vuelta
      const espera = pathname === "/club" ? 700 + (0.25 + (antes.target - antes.z) * 0.32 + 1.4) * 1000 : 400;
      setTimeout(() => setPremio(true), espera);
    } else if (sumo) {
      const n = nuevo.total - antes.total;
      const faltan = nuevo.target - nuevo.z;
      toast(`${n === 1 ? "Sumaste una Z" : `Sumaste ${n} Z`}. ${faltan === 1 ? "¡La próxima es de regalo!" : `Te faltan ${faltan}.`}`);
    } else if (canjeo) {
      toast("¡Que lo disfrutes! Café de regalo canjeado.");
    }
  }, [pathname, router]);

  useEffect(() => {
    if (hoja !== "qr") return;
    const id = setInterval(revisar, 2500);
    return () => clearInterval(id);
  }, [hoja, revisar]);

  // volver a la pestaña (o desbloquear el teléfono) también trae lo último
  useEffect(() => {
    const onVis = () => { if (document.visibilityState === "visible") revisar(); };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [revisar]);

  return (
    <Ctx.Provider value={{ openQr, openWallet }}>
      <main className="view view--app" id="view-app">
        <div className="app">{children}</div>
        <TabBar onQr={openQr} />
      </main>
      <Sheet abierta={hoja === "qr"} onClose={() => setHoja(null)} titulo="Tu QR" id="qr">
        <QrPanel socio={socio} activo={hoja === "qr"} />
      </Sheet>
      <Sheet abierta={hoja === "wallet"} onClose={() => setHoja(null)} titulo="Pase ZORVO" id="wallet" wallet>
        <WalletPanel socio={socio} estado={estado} onDone={() => setHoja(null)} />
      </Sheet>
      {premio ? <Premio onClose={() => setPremio(false)} /> : null}
    </Ctx.Provider>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Hoja inferior genérica (arrastrable hacia abajo para cerrar)
// ───────────────────────────────────────────────────────────────────────────

function Sheet({ abierta, onClose, titulo, id, wallet, children }: { abierta: boolean; onClose: () => void; titulo: string; id: string; wallet?: boolean; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  // en un ref: si fuera dependencia del efecto, cada render del padre volvería a abrir la hoja
  const cerrar = useRef(onClose);
  useEffect(() => { cerrar.current = onClose; }, [onClose]);

  useEffect(() => {
    const el = root.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (abierta) {
      setVisible(true);
      return;
    }
    if (!visible || !el) return;
    const panel = el.querySelector(".sheet__panel");
    gsap.to(el.querySelector(".sheet__backdrop"), { opacity: 0, duration: 0.25 });
    gsap.to(panel, {
      yPercent: 100, duration: reduced ? 0 : 0.35, ease: "power3.in",
      onComplete: () => { setVisible(false); gsap.set(panel, { clearProps: "all" }); },
    });
  }, [abierta, visible]);

  useLayoutEffect(() => {
    const el = root.current;
    if (!visible || !abierta || !el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const panel = el.querySelector<HTMLElement>(".sheet__panel")!;
    document.documentElement.classList.add("is-locked");
    gsap.fromTo(el.querySelector(".sheet__backdrop"), { opacity: 0 }, { opacity: 1, duration: 0.3 });
    gsap.fromTo(panel, { yPercent: 100 }, { yPercent: 0, duration: reduced ? 0 : 0.55, ease: "expo.out" });
    panel.querySelector<HTMLElement>("button")?.focus({ preventScroll: true });

    // arrastrar desde la manija
    const grab = panel.querySelector<HTMLElement>(".sheet__grab")!;
    let y0: number | null = null;
    const down = (e: PointerEvent) => { y0 = e.clientY; grab.setPointerCapture(e.pointerId); };
    const move = (e: PointerEvent) => { if (y0 !== null) gsap.set(panel, { y: Math.max(0, e.clientY - y0) }); };
    const up = (e: PointerEvent) => {
      if (y0 === null) return;
      const dy = e.clientY - y0;
      y0 = null;
      if (dy > 90) cerrar.current();
      else gsap.to(panel, { y: 0, duration: 0.4, ease: "back.out(2)" });
    };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") cerrar.current(); };
    grab.addEventListener("pointerdown", down);
    grab.addEventListener("pointermove", move);
    grab.addEventListener("pointerup", up);
    document.addEventListener("keydown", esc);
    return () => {
      grab.removeEventListener("pointerdown", down);
      grab.removeEventListener("pointermove", move);
      grab.removeEventListener("pointerup", up);
      document.removeEventListener("keydown", esc);
      document.documentElement.classList.remove("is-locked");
    };
  }, [visible, abierta]);

  return (
    <div className="sheet" data-sheet={id} ref={root} hidden={!visible}>
      <div className="sheet__backdrop" onClick={onClose} />
      <div className={`sheet__panel${wallet ? " sheet__panel--wallet" : ""}`} role="dialog" aria-modal="true" aria-labelledby={`${id}-title`}>
        <span className="sheet__grab" aria-hidden="true" />
        {!visible ? null : wallet ? (
          children
        ) : (
          <>
            <div className="sheet__head">
              <h2 id={`${id}-title`}>{titulo}</h2>
              <button className="sheet__x" type="button" onClick={onClose} aria-label="Cerrar">✕</button>
            </div>
            {children}
          </>
        )}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// QR rotativo
// ───────────────────────────────────────────────────────────────────────────

const claveSecreto = (code: string) => `zrv:cred:v1:${code}`;

function leerSecreto(code: string): string | null {
  try { return localStorage.getItem(claveSecreto(code)); } catch { return null; }
}
function guardarSecreto(code: string, s: string) {
  try { localStorage.setItem(claveSecreto(code), s); } catch { /* sin storage: se pide de nuevo la próxima vez */ }
}

function QrPanel({ socio, activo }: { socio: Socio; activo: boolean }) {
  const [secreto, setSecreto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [svg, setSvg] = useState("");
  const [seg, setSeg] = useState(VENTANA_SEGUNDOS);

  // el secreto se pide una sola vez por dispositivo; después todo es local
  useEffect(() => {
    if (!activo || secreto) return;
    const guardado = leerSecreto(socio.memberCode);
    if (guardado) { setSecreto(guardado); return; }
    let vivo = true;
    obtenerSecretoCredencial()
      .then((r) => {
        if (!vivo) return;
        if (r.ok) { guardarSecreto(r.memberCode, r.secreto); setSecreto(r.secreto); }
        else setError(r.error);
      })
      .catch(() => vivo && setError("No pudimos generar tu QR. Revisá la conexión y probá de nuevo."));
    return () => { vivo = false; };
  }, [activo, secreto, socio.memberCode]);

  useEffect(() => {
    if (!activo || !secreto) return;
    let paso = -1;
    let vivo = true;
    const tick = async () => {
      setSeg(segundosRestantes());
      const p = pasoActual();
      if (p === paso) return;
      paso = p;
      const token = await generarToken(socio.memberCode, secreto, p);
      if (vivo) setSvg(qrSvg(token));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => { vivo = false; clearInterval(id); };
  }, [activo, secreto, socio.memberCode]);

  return (
    <>
      <div className="qr-box">
        <div className="qr-box__code" aria-live="off">
          {error ? (
            <p className="qr-box__err">{error}</p>
          ) : svg ? (
            <span dangerouslySetInnerHTML={{ __html: svg }} />
          ) : (
            <span className="qr-box__wait" aria-label="Generando tu QR" />
          )}
        </div>
        <div className="qr-box__meta">
          <span className="label">Código {codigoLegible(socio.memberCode)}</span>
          <span className="qr-timer">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <circle className="qr-timer__ring" cx="12" cy="12" r="10" pathLength={100} style={{ strokeDashoffset: 100 - (seg / VENTANA_SEGUNDOS) * 100 }} />
            </svg>
            <span>{seg}</span>s
          </span>
        </div>
      </div>
      <p className="sheet__hint">
        Subí el brillo y mostráselo al barista. El código se renueva solo para que nadie pueda usar una captura. Si la cámara no lo lee, dictale tu código.
      </p>
      <p className="qr-live label"><span className="qr-live__dot" aria-hidden="true" />Esperando al barista…</p>
    </>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Apple Wallet
// ───────────────────────────────────────────────────────────────────────────

function WalletPanel({ socio, estado, onDone }: { socio: Socio; estado: EstadoClub; onDone: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const pass = useRef<ReturnType<typeof createPass> | null>(null);
  const nombre = socio.nombre.split(" ")[0] ?? socio.nombre;
  const code = socio.memberCode;
  const { z, target } = estado;

  useLayoutEffect(() => {
    const el = host.current;
    if (!el) return;
    const p = createPass({ name: nombre, number: code, stamps: z, total: target, code });
    el.append(p.el);
    pass.current = p;
    return () => { p.el.remove(); pass.current = null; };
  }, [nombre, code, z, target]);

  const agregar = () => {
    if (WALLET_LISTO) {
      window.location.href = "/api/wallet/pase";
      return;
    }
    const p = host.current?.querySelector(".pass");
    gsap.timeline()
      .to(p ?? [], { rotation: -3, duration: 0.08, yoyo: true, repeat: 3, ease: "sine.inOut" })
      .set(p ?? [], { rotation: 0 });
    toast("Apple Wallet llega muy pronto. Mientras tanto, tu QR vive acá.");
  };

  return (
    <>
      <div className="sheet__head">
        <button className="sheet__txtbtn" type="button" onClick={onDone}>Cerrar</button>
        <h2 id="wallet-title">Pase ZORVO</h2>
        <button className="sheet__txtbtn sheet__txtbtn--strong" type="button" onClick={agregar}>Agregar</button>
      </div>
      <div className="sheet__pass" ref={host} />
      <p className="sheet__hint">
        {WALLET_LISTO
          ? "Se guarda en tu iPhone y se actualiza solo con cada Z."
          : "Así se va a ver en tu iPhone. Estamos terminando la conexión con Apple: mientras tanto, agregá esta página a tu pantalla de inicio y tu QR queda a un toque."}
      </p>
    </>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Café de regalo
// ───────────────────────────────────────────────────────────────────────────

function Premio({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current!;
    document.documentElement.classList.add("is-locked");
    el.querySelector<HTMLElement>("button")?.focus({ preventScroll: true });
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.fromTo(el, { clipPath: "circle(0% at 50% 100%)" }, { clipPath: "circle(150% at 50% 100%)", duration: 0.9, ease: "expo.inOut" });
      gsap.from(el.querySelectorAll(".reward__inner > *"), { y: 30, opacity: 0, stagger: 0.06, delay: 0.35, duration: 0.7, ease: "expo.out" });
      gsap.to(el.querySelectorAll(".reward__mascot .m-cup"), { y: -14, duration: 0.4, ease: "power1.inOut", yoyo: true, repeat: -1 });
      gsap.delayedCall(0.5, () => zConfetti(window.innerWidth / 2, window.innerHeight * 0.32, { count: 36 }));
    }
    haptic([20, 50, 30]);
    return () => {
      gsap.killTweensOf(el.querySelectorAll(".reward__mascot .m-cup"));
      document.documentElement.classList.remove("is-locked");
    };
  }, []);

  const cerrar = () => {
    const el = ref.current!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.to(el, { clipPath: "circle(0% at 50% 100%)", duration: reduced ? 0 : 0.6, ease: "expo.inOut", onComplete: onClose });
  };

  return (
    <div className="reward" ref={ref} role="dialog" aria-modal="true" aria-labelledby="reward-title">
      <div className="reward__inner">
        <Svg name="mascot" className="reward__mascot" />
        <p className="label">Tarjeta completa</p>
        <h2 className="reward__title" id="reward-title">Café de regalo</h2>
        <p className="reward__txt">Tu próximo café va por nuestra cuenta. Pedilo cuando quieras: el barista lo ve al escanear tu QR.</p>
        <button className="btn btn--ink btn--block" type="button" onClick={cerrar}>¡Vamos!</button>
      </div>
    </div>
  );
}
