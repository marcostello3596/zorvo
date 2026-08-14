import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Sin esto, Turbopack sube buscando un lockfile, encuentra uno suelto en el
  // home y toma /Users/<vos> como raíz del proyecto. Anclarlo acá evita que
  // intente vigilar la carpeta personal entera.
  turbopack: { root: path.resolve(process.cwd()) },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // camera=(self) es lo que habilita el escáner del barista sin
          // abrirle la cámara a cualquier iframe de terceros.
          { key: "Permissions-Policy", value: "camera=(self), geolocation=(), microphone=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
