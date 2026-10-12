import { Svg } from "@/components/Svg";
import { getCarta, getSocio } from "@/lib/queries";

export const metadata = { title: "La carta · ZORVO" };

export default async function Carta() {
  const socio = (await getSocio())!;
  const carta = await getCarta(socio.memberId);
  const probados = carta.filter((c) => c.probado).length;

  const familias = new Map<string, typeof carta>();
  for (const c of carta) {
    const k = c.familia || "Café";
    if (!familias.has(k)) familias.set(k, []);
    familias.get(k)!.push(c);
  }

  return (
    <section className="screen" aria-labelledby="carta-title">
      <p className="label">Club de la Z</p>
      <h1 className="h-display h-display--app" id="carta-title">La carta</h1>
      <p className="app-progress">
        Probaste <b>{probados} de {carta.length}</b>. Cada café nuevo te acerca al premio del recorrido.
      </p>
      {[...familias].map(([familia, items]) => (
        <div key={familia} className="carta">
          <h2 className="hist__month label">{familia}</h2>
          <ul className="carta__list">
            {items.map((c) => (
              <li key={c.id} className={`carta__item${c.probado ? " is-on" : ""}`}>
                <span className="carta__check" aria-hidden="true">
                  {c.probado ? <Svg name="zsolid" /> : null}
                </span>
                <span className="carta__main">
                  <b>{c.nombre}</b>
                  {c.nota ? <span>{c.nota}</span> : null}
                </span>
                <span className="sr-only">{c.probado ? "probado" : "sin probar"}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
