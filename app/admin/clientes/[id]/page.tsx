import Link from "next/link";
import { notFound } from "next/navigation";

import { FichaCliente } from "@/components/admin/FichaCliente";
import { getFicha, getHistorialSocio } from "@/lib/admin-queries";
import { puede, requireStaff } from "@/lib/staff";

export default async function Cliente({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [ficha, historial] = await Promise.all([getFicha(id), getHistorialSocio(id)]);
  if (!ficha) notFound();

  return (
    <section className="adm-page">
      <Link href="/admin/clientes" className="link-arrow link-arrow--sm adm-back"><span aria-hidden="true">←</span> Clientes</Link>
      <FichaCliente ficha={ficha} historial={historial} staffId={staff.staffId} puedeAnularTodo={puede(staff, "manager")} />
    </section>
  );
}
