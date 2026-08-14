# Ver Zorvo en el celular

Dos caminos, y conviene el primero para hoy mismo.

---

## Camino rápido: desde tu red, sin desplegar nada

Con `npm run dev` corriendo, la terminal imprime dos direcciones:

```
- Local:    http://localhost:3000
- Network:  http://192.168.100.68:3000
```

Desde el celular, **conectado al mismo WiFi**, abrí la segunda. Listo.

Ventaja: el botón "Entrar como socio de prueba" funciona, porque seguís en desarrollo. Podés ver la credencial rotando en un teléfono real ahora mismo.

**Límite importante para la Fase 6:** la cámara del navegador (`getUserMedia`) solo funciona en HTTPS o en `localhost`. Desde el celular por IP vas a estar en HTTP plano, así que el escáner del barista **no va a andar por esta vía**. Para eso sí hace falta desplegar, o levantar un túnel HTTPS:

```bash
npx localtunnel --port 3000
```

---

## Camino real: GitHub + Vercel

Sí, se puede: cada `git push` dispara un despliegue solo. Es exactamente el flujo que conviene.

### Antes de subir nada

Verificá que `.env.local` no vaya a entrar al repositorio:

```bash
cd ~/Documents/Claude/Projects/zorvo
git init
git add -A
git status | grep env
```

Tiene que aparecer **solo** `.env.example`. Si aparece `.env.local`, pará: el `.gitignore` no se está aplicando y estarías por publicar la clave que ignora todos los permisos de la base.

> Si eso llega a pasar, no alcanza con borrar el archivo en otro commit: queda en el historial. Hay que rotar la clave desde el dashboard de Supabase.

### 1. Repositorio

En GitHub, New repository → `zorvo` → **Private**.

```bash
git commit -m "Zorvo: landing, Club, motor de fidelidad y credencial"
git branch -M main
git remote add origin https://github.com/<usuario>/zorvo.git
git push -u origin main
```

**Que el repositorio lo cree tu amigo**, por lo mismo que la cuenta de Supabase. Vos entrás como colaborador.

### 2. Vercel

[vercel.com](https://vercel.com) → Add New → Project → importá el repo.

Framework: detecta Next.js solo. No toques nada más.

En **Environment Variables**, cargá tres:

| Nombre | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://irzukhmautdxao.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | la publishable (`sb_publishable_…`) |
| `SUPABASE_SERVICE_ROLE_KEY` | la secret (`sb_secret_…`) |
| `CREDENTIAL_HMAC_MASTER` | el resultado de `openssl rand -base64 48` |

**No cargues `ZORVO_DEV_LOGIN`.** El botón de prueba no existe en producción y no debe existir.

Deploy. En un par de minutos tenés una URL tipo `zorvo.vercel.app`.

### 3. Actualizar las URLs de auth

Este paso es el que casi siempre se olvida y hace que el login falle en producción.

**En Supabase** → Authentication → URL Configuration:

- Site URL: `https://zorvo.vercel.app`
- Redirect URLs: agregá `https://zorvo.vercel.app/**` (dejá también el de localhost)

**En Google Cloud** (si ya configuraste OAuth) no hace falta tocar nada: la redirect URI apunta a Supabase, no a tu app.

---

## ⚠️ El problema que vas a encontrar apenas despliegues

**En producción no vas a poder entrar.**

El botón de socio de prueba está deliberadamente muerto fuera de desarrollo — es la protección que pusimos para que un bypass de login no llegue nunca a un servidor real. Y el OTP por email todavía no tiene SMTP configurado.

Así que para usar la versión desplegada necesitás **una de estas dos**, sí o sí:

- **Google OAuth** — está en `GOOGLE-OAUTH.md`, unos 15 minutos de trámite. Es lo más rápido.
- **SMTP propio** — Resend o Postmark, plan gratuito. Lo configurás en Supabase → Authentication → Emails → SMTP Settings y el OTP empieza a funcionar de verdad.

No hay atajo acá, y es a propósito: la alternativa sería dejar una puerta abierta en internet.

---

## De ahí en adelante

Cada `git push` a `main` despliega solo. Cada rama y cada pull request genera su propia URL de preview, que es cómoda para mostrarle algo a tu amigo sin tocar lo que ya funciona.

**Las migraciones no se despliegan solas.** Vercel solo publica la app; la base es un servicio aparte. Cuando cambie el esquema:

```bash
npx supabase db push
npm run db:types:remote
git add -A && git commit -m "..." && git push
```

Ese orden importa: si desplegás código que espera una tabla que todavía no existe, la app rompe en producción hasta que corras la migración.
