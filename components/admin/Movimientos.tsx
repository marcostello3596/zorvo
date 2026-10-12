"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { anular } from "@/app/admin/actions";
import type { Actividad } from "@/lib/admin-queries";
import { toast } from "@/lib/zorvo/fx.js";

const TZ = "America/Argentina/Buenos_Aires";
const fmt = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: TZ });

/**
 * Lista de consumos con "Anular". Dos toques para anular (sin diálogos del
 * navegador): el primero pide confirmación, el segundo lo hace.
 */
export function Movimientos({
  titulo,
  items,
  staffId,
  puedeAnularTodo,
  conSocio = true,
}: {
  titulo: string;
  items: Actividad[];
  staffId: string;
  puedeAnularTodo: boolean;
  conSocio?: boolean;
}) {
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [pendiente, start] = useTransition();

  const puedeAnular = (a: Actividad) =>
    !a.anulado && (puedeAnularTodo || (a.staffId === staffId && Date.now() - new Date(a.fecha).getTime() < 30 * 60 * 1000));

  const tocar = (id: string) => {
    if (confirmando !== id) {
      setConfirmando(id);
      setTimeout(() => setConfirmando((c) => (c === id ? null : c)), 4000);
      return;
    }
    start(async () => {
      const r = await anular(id);
      setConfirmando(null);
      toast(r.ok ? "Anulado. La Z se descontó." : (r.msg ?? "No se pudo anular."));
    });
  };

  return (
    <section className="movs">
      <h3 className="adm-h3">{titulo}</h3>
      {items.length ? (
        <ul className="movs__list">
          {items.map((a) => (
            <li key={a.id} className={`mov${a.anulado ? " mov--void" : ""}`}>
              <span className="mov__main">
                <b>
                  {a.producto}
                  {a.cantidad > 1 ? ` ×${a.cantidad}` : ""}
                </b>
                <span className="label">
                  {conSocio ? (
                    <>
                      <Link href={`/admin/clientes/${a.memberId}`}>{a.socio}</Link>
                      {" · "}
                    </>
                  ) : null}
                  {fmt.format(new Date(a.fecha))}
                  {a.manual ? " · a mano" : ""}
                  {a.anulado ? " · anulado" : ""}
                </span>
              </span>
              {puedeAnular(a) ? (
                <button type="button" className={`mov__void${confirmando === a.id ? " is-confirm" : ""}`} onClick={() => tocar(a.id)} disabled={pendiente}>
                  {confirmando === a.id ? "¿Anular?" : "Anular"}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="adm-empty">Todavía no hay movimientos.</p>
      )}
    </section>
  );
}
