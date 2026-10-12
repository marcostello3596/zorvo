import { Svg } from "@/components/Svg";
import type { Movimiento } from "@/lib/queries";

const TZ = "America/Argentina/Buenos_Aires";
const fmtDia = new Intl.DateTimeFormat("es-AR", { weekday: "short", day: "numeric", month: "short", timeZone: TZ });
const fmtHora = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: TZ });
export const fmtMes = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric", timeZone: TZ });

export function FilaMovimiento({ m }: { m: Movimiento }) {
  const d = new Date(m.fecha);
  const premio = m.tipo === "premio";
  const anulado = m.tipo === "cafe" && m.anulado;
  return (
    <li className={`hist__row${premio ? " hist__row--reward" : ""}${anulado ? " hist__row--void" : ""}`}>
      <Svg name={premio ? "mascot" : "cup"} className="hist__ico" />
      <span className="hist__main">
        <b>{premio ? `${m.producto} canjeado` : m.tipo === "cafe" && m.cantidad > 1 ? `${m.producto} ×${m.cantidad}` : m.producto}</b>
        <span className="label">
          {fmtDia.format(d)} · {fmtHora.format(d)}
          {anulado ? " · anulado" : ""}
        </span>
      </span>
      {premio ? (
        <span className="hist__z">Regalo</span>
      ) : m.tipo === "cafe" && m.sumaZ ? (
        <span className="hist__z">
          +{m.cantidad}
          <Svg name="zsolid" className="hist__zz" />
        </span>
      ) : (
        <span className="hist__z hist__z--no">no suma</span>
      )}
    </li>
  );
}

export function ListaMovimientos({ items, vacio }: { items: Movimiento[]; vacio: string }) {
  if (!items.length) return <p className="hist__empty">{vacio}</p>;
  return (
    <ul className="hist">
      {items.map((m) => (
        <FilaMovimiento key={`${m.tipo}-${m.id}`} m={m} />
      ))}
    </ul>
  );
}
