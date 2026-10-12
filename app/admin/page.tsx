import { Mostrador } from "@/components/admin/Mostrador";
import { getActividad, getProductos } from "@/lib/admin-queries";
import { puede, requireStaff } from "@/lib/staff";

export default async function AdminMostrador() {
  const staff = await requireStaff();
  const [productos, actividad] = await Promise.all([getProductos(), getActividad(staff.locationId)]);
  return (
    <Mostrador
      productos={productos}
      actividad={actividad}
      staff={{ staffId: staff.staffId, puedeAnularTodo: puede(staff, "manager") }}
    />
  );
}
