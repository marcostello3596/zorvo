# Entrar con Google — configuración

Unos 15 minutos, casi todo trámite. El código ya está escrito.

---

## 1. Google Cloud Console

Entrá a [console.cloud.google.com](https://console.cloud.google.com).

**Crear el proyecto**

New Project → nombre `Zorvo` → Create.

**Pantalla de consentimiento**

APIs & Services → OAuth consent screen.

- User type: **External**
- App name: `Zorvo`
- User support email: el de tu amigo
- Developer contact: el mismo
- Scopes: no toques nada, los de por defecto alcanzan (`email`, `profile`, `openid`)

Va a quedar en modo **Testing**. En ese modo solo entran las cuentas que agregues en "Test users" — sumá tu Gmail y el de tu amigo. Para abrirlo a cualquiera hay que publicar la app, y Google pide verificación si usás scopes sensibles; con los básicos el trámite es corto.

**Credenciales**

APIs & Services → Credentials → Create Credentials → **OAuth client ID**.

- Application type: **Web application**
- Name: `Zorvo Web`

En **Authorized redirect URIs** va una sola, y es la de Supabase, no la de tu app:

```
https://irzukhmautdxao.supabase.co/auth/v1/callback
```

Create. Guardá el **Client ID** y el **Client Secret**.

---

## 2. Supabase

Dashboard → Authentication → Providers → **Google**.

- Enable: sí
- Client ID y Client Secret: los de recién
- Save

Después, Authentication → URL Configuration:

- **Site URL**: `http://localhost:3000` mientras desarrollás
- **Redirect URLs**: agregá `http://localhost:3000/**`

Cuando publiques, cambiás Site URL por el dominio real y agregás su patrón.

---

## 3. Migración

```bash
npx supabase db push
```

Aplica `20260814000500_oauth_metadata.sql`. Sin esto, todo el que entre con Google queda registrado con la parte del email anterior a la arroba como nombre — Google manda `full_name`, no `display_name`, que era lo único que el trigger leía. También guarda la foto de perfil, que después sirve para que el barista verifique visualmente en el escaneo del pass de Wallet.

---

## 4. Probar

```bash
npm run dev
```

Entrá a `/ingresar` o `/join` y tocá el botón de Google. Deberías volver a `/club` con tu nombre y foto reales.

Verificá en el SQL Editor que el alta haya quedado bien:

```sql
select p.display_name, p.email, p.avatar_url, m.member_code, m.joined_at
from profiles p join members m on m.profile_id = p.id
order by m.joined_at desc limit 5;
```

---

## Si algo falla

**`redirect_uri_mismatch`** — la URI de Google Cloud no coincide exactamente. Tiene que ser la de Supabase (`https://<ref>.supabase.co/auth/v1/callback`), no la de tu app. Sin barra final.

**Volvés a `/ingresar?error=sesion`** — el intercambio de código falló. Casi siempre es que en Supabase falta `http://localhost:3000/**` en Redirect URLs.

**`access_blocked`** — tu cuenta no está en Test users de la pantalla de consentimiento.

**Entrás pero el nombre sale mal** — falta correr `db push`.

---

## Sobre el OTP

Sigue funcionando y no lo saqué. Cuando tengas SMTP propio (Resend o Postmark, ambos con plan gratuito suficiente), lo configurás en Authentication → Emails → SMTP Settings y el límite pasa de 2 a 30 mails por hora.

Mientras tanto, con tu propio Gmail el OTP también anda — pero dos mails por hora hace que probar sea molesto. Por eso Google primero.
