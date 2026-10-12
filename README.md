# ZORVO · Cool Brew Coffee — web + Club de la Z

Primera etapa: **solo la web** (landing de marca + web app navegable de la tarjeta de fidelidad).
Mobile-first. Sin backend todavía: el estado del cliente vive en `localStorage` como demo.

```bash
npm install
npm run dev              # http://localhost:5173  (también en tu red local → probalo en el celu)
npm run build            # dist/  → deploy en Vercel / Netlify / Hostinger
npm run build:artifact   # artifact/zorvo.html → un solo archivo con todo inline
```

## Stack
- **Vite** (vanilla JS, ES modules) — sin framework a propósito: la landing es 90% animación.
  Cuando entre el backend, la web app se puede migrar a Next.js reutilizando `components/` y `lib/`.
- **GSAP 3.13** (todos los plugins son gratis desde 2025): ScrollTrigger, SplitText, Draggable + Inertia,
  DrawSVG, MotionPath, Physics2D.
- **Three.js** — shader del logo "líquido" en el hero (se carga en un chunk aparte).
- **Lenis** — scroll suave solo con mouse; en touch se usa el nativo.
- **qrcode-generator** — QR con corrección H, ojos redondeados y la Z al centro.

## Estructura
```
index.html                 markup de landing + app (rutas por hash: #app, #historial, #registro)
src/main.js                boot, preloader, router + cortina, cursor, Lenis
src/landing/landing.js     todas las animaciones de scroll, demo de tarjeta, stickers
src/landing/hero-gl.js     WebGL: ZORVO líquido (ondas al tocar, lupa, goteo al scrollear, split amarillo/bordó)
src/app/app.js             web app: tarjeta, QR rotativo, modo barista (demo), premio, historial, registro, hoja Wallet
src/components/loyalty-card.js   tarjeta con 10 Z (sello con tinta, inclinación, giro al completar)
src/components/pass.js     vista previa del pase Apple Wallet (storeCard)
src/lib/store.js           estado del cliente (demo) + código rotativo
src/lib/qr.js · fx.js · svg.js
src/assets/svg/            vectores ORIGINALES extraídos del manual (logo, mascota, personajes, vaso, slogan, Est.2026)
src/assets/doodles/        doodles nuevos en el mismo trazo (sparkle, flecha, vapor, hielo, vaso cold brew, QR, etc.)
src/styles/                tokens.css (paleta/tipos) · base · components · landing · app
```

## Marca aplicada
- Paleta: papel `#F3F5EE` + tinta `#161513` como base; **bordó `#76262F`** y **amarillo `#FFC744`** solo como acento. Sin verde.
- Tipos (Google Fonts): **Archivo** variable usando su eje de ancho (62% condensado para titulares tipo slogan,
  125% expandido para stickers tipo "MUY BUENO"), **JetBrains Mono** para etiquetas, **Caveat Brush** para anotaciones a mano.
- Las ilustraciones son los vectores del manual (sacados del PDF), no redibujos.

## Próxima etapa (no incluida)
1. **Apple Wallet**: certificado Pass Type ID, generación/firmado de `.pkpass` (storeCard) en el servidor,
   web service de PassKit para actualizar el pase con cada Z (push APNs) — la UI del pase ya está en `components/pass.js`.
2. **Backend**: clientes, tarjetas, sellos, canjes. QR con TOTP firmado (hoy `memberCode()` es un mock cada 30 s).
3. **Panel de empleados**: escáner QR (cámara) → +1 Z, canje de premio, antifraude (1 Z cada X minutos por cliente).
4. **Android**: Google Wallet (Loyalty class/object).
5. Assets premium: stickers animados (Lottie/Rive), más poses del personaje, sonido de sello.
