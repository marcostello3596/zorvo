"use client";

import { useActionState, useTransition } from "react";

import { agregarStaff, cambiarEstadoStaff, type EstadoEquipo } from "@/app/admin/actions";
import type { MiembroEquipo } from "@/lib/admin-queries";
import { toast } from "@/lib/zorvo/fx.js";

const ROL: Record<string, string> = { barista: "Barista", manager: "Encargado", owner: "Dueño" };

export function EquipoForm({ puedeEncargados }: { puedeEncargados: boolean }) {
  const [estado, accion, pendiente] = useActionState<EstadoEquipo, FormData>(agregarStaff, {});
  return (
    <form className="equipo-form reg__form" action={accion}>
      <h2 className="adm-h3">Sumar a alguien</h2>
      <div className="field">
        <label htmlFor="eq-email">Email</label>
        <input id="eq-email" name="email" type="email" required placeholder="barista@mail.com" autoComplete="off" />
      </div>
      <div className="field">
        <label htmlFor="eq-nombre">Nombre</label>
        <input id="eq-nombre" name="nombre" type="text" placeholder="Opcional" maxLength={60} autoComplete="off" />
      </div>
      <fieldset className="equipo-form__rol">
        <legend className="label">Rol</legend>
        <label><input type="radio" name="rol" value="barista" defaultChecked /> Barista <small>escanea, suma y canjea</small></label>
        {puedeEncargados ? (
          <label><input type="radio" name="rol" value="manager" /> Encargado <small>además anula y maneja el equipo</small></label>
        ) : null}
      </fieldset>
      {estado.msg ? <p className={estado.ok ? "adm-ok" : "field__err"} role="status">{estado.msg}</p> : null}
      <button className="btn btn--ink btn--block" type="submit" disabled={pendiente}>{pendiente ? "Sumando…" : "Sumar al equipo"}</button>
    </form>
  );
}

export function EquipoLista({ equipo, yo, esDueno }: { equipo: MiembroEquipo[]; yo: string; esDueno: boolean }) {
  const [pendiente, start] = useTransition();
  const cambiar = (id: string, activo: boolean) =>
    start(async () => {
      const r = await cambiarEstadoStaff(id, activo);
      if (r.msg) toast(r.msg);
    });
  return (
    <ul className="equipo">
      {equipo.map((e) => {
        const editable = e.staffId !== yo && e.rol !== "owner" && (esDueno || e.rol === "barista");
        return (
          <li key={e.staffId} className={`equipo__row${e.activo ? "" : " is-off"}`}>
            <span className="equipo__main">
              <b>{e.nombre}{e.staffId === yo ? " (vos)" : ""}</b>
              <span className="label">{ROL[e.rol] ?? e.rol} · {e.email}</span>
            </span>
            {editable ? (
              <button type="button" className="mov__void" disabled={pendiente} onClick={() => cambiar(e.staffId, !e.activo)}>
                {e.activo ? "Dar de baja" : "Reactivar"}
              </button>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
