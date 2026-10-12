import Link from "next/link";
import { SITE } from "@/lib/content";
import { ZorvoWordmark } from "@/components/brand";

/**
 * Footer en columnas. La referencia usa este patrón editorial —incluido el
 * colofón que acredita al estudio y al programador— y le queda bien a Zorvo.
 */
const COLUMNAS = [
  {
    titulo: "El lugar",
    contenido: (
      <>
        {SITE.direccion}
        <br />
        <span className="text-[var(--zrv-espresso-300)]">Buenos Aires, Argentina</span>
      </>
    ),
  },
  {
    titulo: "Horarios",
    contenido: (
      <>
        {SITE.horarios.map((h) => (
          <span key={h.dias} className="mb-1 block">
            {h.dias}
            <span className="zrv-data block whitespace-nowrap text-[var(--zrv-espresso-300)]">{h.horas}</span>
          </span>
        ))}
      </>
    ),
  },
  {
    titulo: "Contacto",
    contenido: (
      <>
        <a href={`mailto:${SITE.email}`} className="underline-offset-4 hover:underline">
          {SITE.email}
        </a>
        <br />
        <a
          href={SITE.instagramUrl}
          className="underline-offset-4 hover:underline"
          rel="noopener noreferrer"
          target="_blank"
        >
          {SITE.instagram}
        </a>
      </>
    ),
  },
  {
    titulo: "El Club",
    contenido: (
      <>
        <Link href="/join" className="underline-offset-4 hover:underline">
          Sumate gratis
        </Link>
        <br />
        <Link href="/club" className="underline-offset-4 hover:underline">
          Ya soy socio
        </Link>
      </>
    ),
  },
  {
    titulo: "Colofón",
    contenido: (
      <>
        Identidad: Mutte
        <br />
        <span className="text-[var(--zrv-espresso-300)]">Sitio: en construcción</span>
      </>
    ),
  },
  {
    titulo: "Copyright",
    contenido: (
      <>
        © 2026
        <br />
        <span className="text-[var(--zrv-espresso-300)]">Zorvo Cool Brew Coffee</span>
      </>
    ),
  },
];

export function Footer() {
  return (
    <footer className="zrv-grain bg-espresso text-cream">
      <div className="mx-auto max-w-[90rem] px-4 py-14 md:px-8 md:py-20">
        <div className="grid grid-cols-2 gap-x-6 gap-y-9 md:grid-cols-3 lg:grid-cols-6">
          {COLUMNAS.map((c) => (
            <div key={c.titulo}>
              <h3 className="zrv-label mb-3 text-venus">{c.titulo}</h3>
              <p className="text-sm leading-relaxed text-cream/90">{c.contenido}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 border-t border-[var(--zrv-espresso-600)] pt-8">
          <ZorvoWordmark className="h-auto w-full text-venus" />
          <p className="zrv-label mt-4 flex flex-wrap justify-between gap-3 text-[var(--zrv-espresso-300)]">
            <span>{SITE.bajada}</span>
            <span>{SITE.desde}</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
