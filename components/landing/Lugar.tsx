import { ZorvoBarista } from "@/components/brand";
import { Llenable } from "@/components/brand/Llenable";
import { SITE } from "@/lib/content";
import { ANCHO, Marca } from "./Marca";

/** Acto V — el lugar. El barista se llena de olive sobre el campo amarillo. */
export function Lugar() {
  return (
    <section id="el-lugar" aria-labelledby="lugar-titulo" className="zrv-grain scroll-mt-14 bg-venus text-espresso-deep">
      <div className={`${ANCHO} grid items-end gap-14 py-20 md:grid-cols-12 md:py-32`}>
        <div className="md:col-span-7">
          <Marca n="05" texto="El lugar" />
          <h2
            id="lugar-titulo"
            className="zrv-display zrv-anim-subir mt-6 max-w-[13ch] text-[clamp(3rem,8.4vw,8rem)] leading-[0.85]"
          >
            Un refugio breve en el ritmo de la ciudad.
          </h2>

          <dl className="mt-12 grid gap-10 sm:grid-cols-2">
            <div className="zrv-anim-subir">
              <dt className="zrv-label mb-3">Dónde</dt>
              <dd className="text-xl leading-snug">{SITE.direccion}</dd>
            </div>
            <div className="zrv-anim-subir">
              <dt className="zrv-label mb-3">Cuándo</dt>
              <dd>
                <ul>
                  {SITE.horarios.map((h) => (
                    <li key={h.dias} className="flex justify-between gap-4 border-b border-espresso-deep/25 py-1.5">
                      <span>{h.dias}</span>
                      <span className="zrv-data">{h.horas}</span>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          </dl>
        </div>

        <div className="flex justify-center md:col-span-5 md:justify-end">
          <Llenable
            Ilustracion={ZorvoBarista}
            titulo="Barista de Zorvo sirviendo un café"
            className="h-[clamp(14rem,42vh,27rem)]"
            claseBase="text-[var(--zrv-yellow-600)]"
            claseLleno="text-olive"
          />
        </div>
      </div>
    </section>
  );
}
