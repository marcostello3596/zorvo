"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Svg } from "@/components/Svg";
import { MiniTarjeta } from "@/components/admin/MiniTarjeta";
import { Movimientos } from "@/components/admin/Movimientos";
import { codigoLegible } from "@/components/club/codigo";
import { canjear } from "@/app/admin/actions";
import type { Actividad, Ficha } from "@/lib/admin-queries";
import { toast } from "@/lib/zorvo/fx.js";

const fmt = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Argentina/Buenos_Aires" });

export function FichaCliente({ ficha, historial, staffId, puedeAnularTodo }: { ficha: Ficha; historial: Actividad[]; staffId: string; puedeAnularTodo: boolean }) {
  const router = useRouter();
  const [pendiente, start] = useTransition();
  return (
    <div className="ficha ficha--page">
      <div className="ficha__head">
        <div>
          <p className="label">Socio {codigoLegible(ficha.code)}{ficha.estado !== "active" ? ` · ${ficha.estado}` : ""}</p>
          <h1 className="ficha__nombre">{ficha.nombre}</h1>
          <p className="ficha__meta">{ficha.email} · en el club desde el {fmt.format(new Date(ficha.desde))}</p>
        </div>
        <span className="ficha__z">{ficha.z}<small>/{ficha.target}</small></span>
      </div>
      <MiniTarjeta z={ficha.z} target={ficha.target} />
      <div className="hist-stats">
        <div className="stat"><b>{ficha.total}</b><span className="label">Z sumadas</span></div>
        <div className="stat"><b>{ficha.tarjetas}</b><span className="label">Tarjetas</span></div>
        <div className="stat"><b>{ficha.premios.length}</b><span className="label">Premios sin canjear</span></div>
      </div>
      {ficha.premios.length ? (
        <ul className="premios">
          {ficha.premios.map((p) => (
            <li key={p.id} className="premio">
              <Svg name="mascot" className="premio__mascot" />
              <span className="premio__txt"><b>{p.nombre}</b><span>Pendiente de canje</span></span>
              <button
                type="button"
                className="btn btn--ink premio__btn"
                disabled={pendiente}
                onClick={() => start(async () => {
                  const r = await canjear(p.id, ficha.memberId);
                  toast(r.ok ? "Café de regalo canjeado." : r.msg);
                  router.refresh();
                })}
              >
                Canjear
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <Link className="btn btn--yellow btn--block" href={`/admin?socio=${ficha.memberId}`}>Sumar un café a mano</Link>
      <Movimientos titulo="Historial" items={historial} staffId={staffId} puedeAnularTodo={puedeAnularTodo} conSocio={false} />
    </div>
  );
}
