import type { Metadata, Viewport } from "next";
import {
  Sofia_Sans_Extra_Condensed,
  Hanken_Grotesk,
  Martian_Mono,
} from "next/font/google";
import "./globals.css";

/**
 * Tipografía — ver ZORVO_01 §3.
 * Sofia Sans Extra Condensed es fuente REAL de marca (aparece en el PDF) y
 * además es OFL, así que se sirve idéntica al original.
 * Hanken Grotesk y Martian Mono son los sustitutos libres acordados para
 * RealText Pro e Input Mono Compressed, que son comerciales.
 */
const sofia = Sofia_Sans_Extra_Condensed({
  subsets: ["latin"],
  weight: ["400", "600", "800"],
  variable: "--font-sofia",
  display: "swap",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
});

const martian = Martian_Mono({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-martian",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Zorvo — Cool Brew Coffee",
  description:
    "Café al paso, bien hecho. Sumate al Club de Zorvo: tomás café, nosotros nos acordamos, y un día te llevás una gorra.",
  openGraph: {
    title: "Zorvo — Cool Brew Coffee",
    description: "Aunque el momento sea corto, merece ser bueno. Muy bueno.",
    locale: "es_AR",
    type: "website",
  },
};

/**
 * A diferencia de la referencia, NO bloqueamos el zoom.
 * user-scalable=no rompe WCAG 1.4.4 y contradice el enfoque mobile-first.
 */
export const viewport: Viewport = {
  themeColor: "#76262F",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es-AR"
      className={`${sofia.variable} ${hanken.variable} ${martian.variable}`}
    >
      {/*
        Varias extensiones de navegador (ColorZilla, Grammarly, gestores de
        contraseñas) escriben atributos en el <body> antes de que React
        hidrate, y eso dispara una advertencia de hidratación que no viene de
        nuestro código y que no podemos evitar.

        suppressHydrationWarning solo silencia UN nivel: los atributos de este
        elemento. Cualquier desajuste real dentro del árbol se sigue
        reportando, que es lo que nos importa.
      */}
      <body suppressHydrationWarning>
        <a
          href="#contenido"
          className="zrv-label sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:bg-venus focus:px-4 focus:py-3 focus:text-espresso-deep"
        >
          Saltar al contenido
        </a>
        {children}
      </body>
    </html>
  );
}
