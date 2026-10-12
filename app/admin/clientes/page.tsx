import Link from "next/link";

import { codigoLegible } from "@/components/club/codigo";
import { buscarSocios } from "@/lib/admin-queries";
import { requireStaff } from "@/lib/staff";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const metadata = { title: "Clientes · Mostrador ZORVO" };

async function recientes() {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("members")
    .select("id, member_code, joined_at, profiles(display_name, email)")
    .order("joined_at", { ascending: false })
    .limit(20);
  return (data ?? []).map((m) => {
    const p = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
    return { memberId: m.id, code: m.member_code, nombre: p?.display_name || p?.email?.split("@")[0] || "Socio", email: p?.email ?? "" };
  });
}

export default async function Clientes({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireStaff();
  const { q = "" } = await searchParams;
  const lista = q.trim() ? await buscarSocios(q, 30) : await recientes();
  const { count } = await createSupabaseAdminClient().from("members").select("id", { count: "exact", head: true });

  return (
    <section className="adm-page">
      <div className="adm-page__head">
        <h1 className="adm-title">Clientes</h1>
        <span className="label">{count ?? 0} en el club</span>
      </div>
      <form className="buscador" role="search">
        <label htmlFor="q" className="label">Buscar por código, email o nombre</label>
        <input id="q" name="q" type="search" defaultValue={q} placeholder="4KD7 PQ2M, juli@mail.com, Juli…" autoComplete="off" />
      </form>
      <p className="label adm-page__sub">{q.trim() ? `Resultados para “${q.trim()}”` : "Últimos en sumarse"}</p>
      {lista.length ? (
        <ul className="buscador__res buscador__res--page">
          {lista.map((s) => (
            <li key={s.memberId}>
              <Link href={`/admin/clientes/${s.memberId}`}>
                <b>{s.nombre}</b>
                <span>{codigoLegible(s.code)} · {s.email}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="adm-empty">No encontramos a nadie.</p>
      )}
    </section>
  );
}
