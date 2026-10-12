import type { Metadata, Viewport } from "next";
import { Archivo, Caveat_Brush, JetBrains_Mono } from "next/font/google";

import { Chrome } from "@/components/chrome/Chrome";
import { SvgDefs } from "@/components/chrome/SvgDefs";

import "@/styles/tokens.css";
import "@/styles/base.css";
import "@/styles/components.css";
import "@/styles/landing.css";
import "@/styles/app.css";
import "@/styles/club.css";
import "@/styles/admin.css";

/**
 * Tipografía: Archivo variable usando su eje de ancho (62% condensado para
 * titulares, 125% expandido para stickers), JetBrains Mono para etiquetas y
 * Caveat Brush para anotaciones a mano. next/font las sirve desde el propio
 * dominio, sin pedirle nada a Google en cada visita.
 */
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-jetbrains",
  display: "swap",
});
const caveat = Caveat_Brush({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-caveat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ZORVO Cool Brew Coffee",
  description:
    "Café al paso, bien hecho. Sumate al Club de la Z: cada café es una Z y a la décima invitamos nosotros.",
  openGraph: {
    title: "ZORVO Cool Brew Coffee",
    description: "Aunque el momento sea corto, merece ser bueno. Muy bueno.",
    locale: "es_AR",
    type: "website",
  },
};

// Sin bloquear el zoom: user-scalable=no rompe WCAG 1.4.4.
export const viewport: Viewport = {
  themeColor: "#F3F5EE",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-AR" className={`${archivo.variable} ${jetbrains.variable} ${caveat.variable}`}>
      {/* suppressHydrationWarning: extensiones del navegador escriben atributos en <body> antes de hidratar */}
      <body suppressHydrationWarning>
        <SvgDefs />
        <div className="grain" aria-hidden="true" />
        <Chrome>{children}</Chrome>
      </body>
    </html>
  );
}
