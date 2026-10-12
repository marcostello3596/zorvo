import { EquipoForm, EquipoLista } from "@/components/admin/Equipo";
import { getEquipo } from "@/lib/admin-queries";
import { puede, requireStaff } from "@/lib/staff";

export const metadata = { title: "Equipo · Mostrador ZORVO" };

export default async function Equipo() {
  const yo = await requireStaff("manager");
  const equipo = await getEquipo();
  return (
    <section className="adm-page">
      <div className="adm-page__head">
        <h1 className="adm-title">Equipo</h1>
        <span className="label">{equipo.filter((e) => e.activo).length} activos</span>
      </div>
      <p className="adm-lede">
        Quien esté acá puede escanear y sumar Z. Entra a <b>/admin</b> con su email y el código que le llega por mail. Nada de contraseñas compartidas.
      </p>
      <EquipoForm puedeEncargados={puede(yo, "owner")} />
      <EquipoLista equipo={equipo} yo={yo.staffId} esDueno={puede(yo, "owner")} />
    </section>
  );
}
