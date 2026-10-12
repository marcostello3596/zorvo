"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

import { Svg } from "@/components/Svg";
import { Escaner } from "@/components/admin/Escaner";
import { MiniTarjeta } from "@/components/admin/MiniTarjeta";
import { Movimientos } from "@/components/admin/Movimientos";
import { codigoLegible } from "@/components/club/codigo";
import { abrirManual, buscar, canjear, identificar, sumar } from "@/app/admin/actions";
import type { Actividad, Ficha, Producto, SocioEncontrado } from "@/lib/admin-queries";
import { haptic, toast, zConfetti } from "@/lib/zorvo/fx.js";
import { gsap } from "@/lib/zorvo/gsap.js";

type Ident = { ficha: Ficha; ticket: string; manual: boolean };
type Hecho = { sumadas: number; ficha: Ficha; completo: boolean };

const TZ = "America/Argentina/Buenos_Aires";
const fmtVisita = new Intl.DateTimeFormat("es-AR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: TZ });

export function Mostrador({
  productos,
  actividad,
  staff,
}: {
  productos: Producto[];
  actividad: Actividad[];
  staff: { staffId: string; puedeAnularTodo: boolean };
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [ident, setIdent] = useState<Ident | null>(null);
  const [hecho, setHecho] = useState<Hecho | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [carrito, setCarrito] = useState<Record<string, number>>({});
  const [pendiente, start] = useTransition();
  const procesando = useRef(false);

  const modo: "scan" | "ficha" | "hecho" = hecho ? "hecho" : ident ? "ficha" : "scan";

  const abrir = useCallback((r: Awaited<ReturnType<typeof identificar>>) => {
    if (r.ok) {
      setIdent({ ficha: r.ficha, ticket: r.ticket, manual: r.manual });
      setCarrito({});
      setError(null);
      haptic(12);
      window.scrollTo({ top: 0 });
    } else {
      setError(r.msg);
      haptic([30, 60, 30]);
    }
  }, []);

  const leer = useCallback((texto: string) => {
    if (procesando.current) return;
    procesando.current = true;
    start(async () => {
      try { abrir(await identificar(texto)); } finally { procesando.current = false; }
    });
  }, [abrir]);

  const elegir = useCallback((memberId: string) => {
    start(async () => abrir(await abrirManual(memberId)));
  }, [abrir]);

  // /admin?socio=<id>: viene de la ficha de Clientes
  useEffect(() => {
    const id = params.get("socio");
    if (id) {
      elegir(id);
      router.replace("/admin", { scroll: false });
    }
  }, [params, elegir, router]);

  const siguiente = () => {
    setIdent(null);
    setHecho(null);
    setCarrito({});
    setError(null);
  };

  const zASumar = useMemo(
    () => productos.reduce((n, p) => n + (p.sumaZ ? (carrito[p.id] ?? 0) : 0), 0),
    [productos, carrito],
  );
  const itemsCarrito = Object.entries(carrito).filter(([, n]) => n > 0);

  const confirmar = () => {
    if (!ident || !itemsCarrito.length) return;
    start(async () => {
      const r = await sumar(ident.ticket, itemsCarrito.map(([productId, cantidad]) => ({ productId, cantidad })));
      if (!r.ok) {
        setError(r.msg);
        haptic([30, 60, 30]);
        return;
      }
      setHecho({ sumadas: r.sumadas, ficha: r.ficha, completo: r.completo });
      haptic([12, 40, 12]);
      router.refresh();
    });
  };

  const canjearPremio = (grantId: string, memberId: string) => {
    start(async () => {
      const r = await canjear(grantId, memberId);
      if (!r.ok) { toast(r.msg); return; }
      toast("Café de regalo canjeado. ¡Que lo disfrute!");
      haptic(14);
      if (hecho) setHecho({ ...hecho, ficha: r.ficha });
      else if (ident) setIdent({ ...ident, ficha: r.ficha });
      router.refresh();
    });
  };

  return (
    <div className="mostrador">
      {modo === "scan" ? (
        <>
          <Escaner activo onLeer={leer} />
          {error ? <p className="adm-alert" role="alert">{error}</p> : null}
          {pendiente ? <p className="adm-wait" role="status">Buscando…</p> : null}
          <Buscador onElegir={elegir} onToken={leer} />
          <Movimientos titulo="Últimos movimientos" items={actividad} staffId={staff.staffId} puedeAnularTodo={staff.puedeAnularTodo} />
        </>
      ) : null}

      {modo === "ficha" && ident ? (
        <section className="ficha" aria-labelledby="ficha-nombre">
          <FichaHead ficha={ident.ficha} manual={ident.manual} />
          <MiniTarjeta z={ident.ficha.z} target={ident.ficha.target} />
          <Premios ficha={ident.ficha} onCanjear={canjearPremio} ocupado={pendiente} />

          <div className="prods">
            <h3 className="adm-h3">¿Qué pidió?</h3>
            {agrupar(productos).map(([familia, items]) => (
              <div key={familia} className="prods__grupo">
                <p className="label prods__familia">{familia}</p>
                <div className="prods__grid">
                  {items.map((p) => {
                    const n = carrito[p.id] ?? 0;
                    return (
                      <div key={p.id} className={`prod${n ? " is-on" : ""}${p.sumaZ ? "" : " prod--noz"}`}>
                        <button type="button" className="prod__add" onClick={() => { setCarrito((c) => ({ ...c, [p.id]: Math.min((c[p.id] ?? 0) + 1, 20) })); haptic(5); }}>
                          <span className="prod__name">{p.nombre}</span>
                          {p.sumaZ ? null : <span className="prod__noz">no suma Z</span>}
                          {n ? <span className="prod__n">{n}</span> : null}
                        </button>
                        {n ? (
                          <button type="button" className="prod__minus" aria-label={`Quitar un ${p.nombre}`} onClick={() => setCarrito((c) => ({ ...c, [p.id]: Math.max((c[p.id] ?? 0) - 1, 0) }))}>−</button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {error ? <p className="adm-alert" role="alert">{error}</p> : null}

          <div className="ficha__bar">
            <button type="button" className="btn ficha__cancel" onClick={siguiente} disabled={pendiente}>Cancelar</button>
            <button type="button" className="btn btn--ink ficha__ok" onClick={confirmar} disabled={!itemsCarrito.length || pendiente}>
              {pendiente ? "Sumando…" : zASumar > 0 ? `Sumar ${zASumar} Z` : itemsCarrito.length ? "Registrar" : "Elegí qué pidió"}
            </button>
          </div>
        </section>
      ) : null}

      {modo === "hecho" && hecho ? <Listo hecho={hecho} onSiguiente={siguiente} onCanjear={canjearPremio} ocupado={pendiente} /> : null}
    </div>
  );
}

function agrupar(productos: Producto[]): [string, Producto[]][] {
  const m = new Map<string, Producto[]>();
  for (const p of productos) {
    if (!m.has(p.familia)) m.set(p.familia, []);
    m.get(p.familia)!.push(p);
  }
  return [...m];
}

function FichaHead({ ficha, manual }: { ficha: Ficha; manual?: boolean }) {
  return (
    <div className="ficha__head">
      <div>
        <p className="label">Socio {codigoLegible(ficha.code)}{manual ? " · cargado a mano" : ""}</p>
        <h2 className="ficha__nombre" id="ficha-nombre">{ficha.nombre}</h2>
        <p className="ficha__meta">
          {ficha.ultimaVisita ? `Última visita: ${fmtVisita.format(new Date(ficha.ultimaVisita))}` : "Primera visita"}
          {" · "}
          {ficha.total} Z en total
        </p>
      </div>
      <span className="ficha__z">{ficha.z}<small>/{ficha.target}</small></span>
    </div>
  );
}

function Premios({ ficha, onCanjear, ocupado }: { ficha: Ficha; onCanjear: (grantId: string, memberId: string) => void; ocupado: boolean }) {
  if (!ficha.premios.length) return null;
  return (
    <ul className="premios">
      {ficha.premios.map((p) => (
        <li key={p.id} className="premio">
          <Svg name="mascot" className="premio__mascot" />
          <span className="premio__txt">
            <b>{p.nombre}</b>
            <span>Pendiente de canje</span>
          </span>
          <button type="button" className="btn btn--ink premio__btn" disabled={ocupado} onClick={() => onCanjear(p.id, ficha.memberId)}>Canjear</button>
        </li>
      ))}
    </ul>
  );
}

function Listo({ hecho, onSiguiente, onCanjear, ocupado }: { hecho: Hecho; onSiguiente: () => void; onCanjear: (g: string, m: string) => void; ocupado: boolean }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.fromTo(el.querySelector(".listo__stamp"), { scale: 2.4, rotation: -30, opacity: 0 }, { scale: 1, rotation: -6, opacity: 1, duration: 0.45, ease: "power4.in" });
    gsap.from(el.querySelectorAll(".listo > *:not(.listo__stamp)"), { y: 20, opacity: 0, stagger: 0.05, delay: 0.35, duration: 0.6, ease: "expo.out", clearProps: "all" });
    if (hecho.completo) {
      const r = el.getBoundingClientRect();
      gsap.delayedCall(0.5, () => zConfetti(r.left + r.width / 2, r.top + 120, { count: 30 }));
    }
    el.querySelector<HTMLButtonElement>(".listo__next")?.focus({ preventScroll: true });
  }, [hecho.completo]);

  const { ficha } = hecho;
  return (
    <section className="listo" ref={ref} aria-live="polite">
      <p className="listo__stamp">{hecho.sumadas > 0 ? `+${hecho.sumadas} Z` : "Listo"}</p>
      <h2 className="ficha__nombre">{ficha.nombre}</h2>
      {hecho.completo ? (
        <p className="listo__big">¡Completó la tarjeta! Ganó un café de regalo.</p>
      ) : (
        <p className="listo__txt">
          Tiene {ficha.z} de {ficha.target}. {ficha.target - ficha.z === 1 ? "¡El próximo es de regalo!" : `Le faltan ${ficha.target - ficha.z}.`}
        </p>
      )}
      <MiniTarjeta z={ficha.z} target={ficha.target} />
      <Premios ficha={ficha} onCanjear={onCanjear} ocupado={ocupado} />
      <button type="button" className="btn btn--yellow btn--block listo__next" onClick={onSiguiente}>Siguiente cliente</button>
    </section>
  );
}

function Buscador({ onElegir, onToken }: { onElegir: (memberId: string) => void; onToken: (t: string) => void }) {
  const [q, setQ] = useState("");
  const [res, setRes] = useState<SocioEncontrado[] | null>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const t = q.trim();
    if (t.startsWith("zrv1.") || t.length < 3) { setRes(null); return; }
    let vivo = true;
    const id = setTimeout(async () => {
      setCargando(true);
      const r = await buscar(t).catch(() => []);
      if (vivo) { setRes(r); setCargando(false); }
    }, 280);
    return () => { vivo = false; clearTimeout(id); };
  }, [q]);

  return (
    <form
      className="buscador"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const t = q.trim();
        if (t.startsWith("zrv1.")) { onToken(t); setQ(""); }
        else if (res?.length === 1) onElegir(res[0]!.memberId);
      }}
    >
      <label htmlFor="buscar-socio" className="label">¿No lee el QR? Buscalo</label>
      <input
        id="buscar-socio"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Código (4KD7 PQ2M), email o nombre"
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
      />
      {cargando ? <p className="buscador__hint">Buscando…</p> : null}
      {res && !cargando ? (
        res.length ? (
          <ul className="buscador__res">
            {res.map((s) => (
              <li key={s.memberId}>
                <button type="button" onClick={() => { onElegir(s.memberId); setQ(""); }}>
                  <b>{s.nombre}</b>
                  <span>{codigoLegible(s.code)} · {s.email}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="buscador__hint">Nadie con ese dato. Si es nuevo, que se sume en zorvo desde su teléfono.</p>
        )
      ) : null}
    </form>
  );
}
