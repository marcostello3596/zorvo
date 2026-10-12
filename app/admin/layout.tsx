import Link from "next/link";
import type { ReactNode } from "react";

import { salir } from "@/app/(auth)/actions";
import { Svg } from "@/components/Svg";
import { AdminNav } from "@/components/admin/AdminNav";
import { getStaff, puede } from "@/lib/staff";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Mostrador · ZORVO", robots: { index: false, follow: false } };

const ROL = { barista: "Barista", manager: "Encargado", owner: "Dueño" } as const;

/**
 * /admin: el sistema del mostrador. proxy.ts ya exige sesión; acá se exige
 * además ser parte del equipo (fila activa en staff).
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const staff = await getStaff();

  if (!staff) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    return (
      <main className="adm adm--nope">
        <div className="adm-nope">
          <Svg name="mascot" className="adm-nope__mascot" />
          <p className="label">Mostrador ZORVO</p>
          <h1 className="adm-title">Esta parte es para el equipo.</h1>
          <p>
            Entraste como <b>{user?.email}</b>, que no está en el equipo de ZORVO. Si trabajás en el local, pedile al encargado que te sume
            desde Equipo con este email.
          </p>
          <div className="adm-nope__row">
            <Link className="btn btn--yellow" href="/club">Ir a mi tarjeta</Link>
            <form action={salir}>
              <button className="btn" type="submit">Salir</button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="adm">
      <header className="adm-top">
        <Link href="/admin" className="adm-top__logo" aria-label="Mostrador ZORVO">
          <Svg name="logo" />
        </Link>
        <span className="adm-top__who">
          <b>{staff.nombre.split(" ")[0]}</b>
          <span>{ROL[staff.rol]} · {staff.local}</span>
        </span>
        <form action={salir}>
          <button className="adm-top__out" type="submit">Salir</button>
        </form>
      </header>
      <AdminNav equipo={puede(staff, "manager")} />
      <main className="adm-main" id="contenido">{children}</main>
    </div>
  );
}
