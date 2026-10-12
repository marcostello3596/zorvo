import { Marquee } from "@/components/brand/Marquee";
import { Cierre } from "@/components/landing/Cierre";
import { Ciudad } from "@/components/landing/Ciudad";
import { Club, FranjaRitual } from "@/components/landing/Club";
import { Coleccion } from "@/components/landing/Coleccion";
import { Hero } from "@/components/landing/Hero";
import { Lugar } from "@/components/landing/Lugar";
import { Sorbo } from "@/components/landing/Sorbo";
import { Vaso } from "@/components/landing/Vaso";
import { ObservadorMovimiento } from "@/components/motion/ObservadorMovimiento";
import { Footer } from "@/components/site/Footer";
import { Nav } from "@/components/site/Nav";
import { MARQUEE_TOP } from "@/lib/content";

/**
 * La landing es una sola historia en cinco actos:
 *
 *   La ciudad no frena → un sorbo → el Club → la carta → el lugar
 *
 * El hilo visual es el café llenando cosas: las ilustraciones, las trece
 * casillas, el vaso de la esquina. Cada acto tiene un color de campo y
 * nunca se tocan Espresso y Olive.
 */
export default function Home() {
  return (
    <>
      <ObservadorMovimiento />
      <Vaso />

      <Marquee seconds={38} className="bg-venus text-espresso-deep">
        <span className="zrv-label whitespace-nowrap py-2.5 pr-10 font-bold">{MARQUEE_TOP}</span>
        <span aria-hidden="true" className="pr-10">●</span>
      </Marquee>

      <Nav />

      {/* overflow-x: clip y no hidden: recorta la línea de nivel de las
          ilustraciones cuando tocan el borde en pantallas muy angostas, sin
          crear un contenedor de scroll (que rompería el menú sticky). */}
      <main id="contenido" className="overflow-x-clip">
        <Hero />
        <Ciudad />
        <Sorbo />
        <FranjaRitual />
        <Club />
        <Coleccion />
        <Lugar />
        <Cierre />
      </main>

      <Footer />
    </>
  );
}
