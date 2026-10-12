# ZORVO v3 — tarjeta de la Z y mostrador

Esta rama junta el diseño de la web (V2) con el backend de Supabase y suma
las dos cosas que faltaban para abrir el club de verdad:

- **El club del cliente** (`/club`): su tarjeta de 10 Z con datos reales, el
  QR que se renueva cada 30 segundos, historial, recorridos y la carta.
- **El mostrador** (`/admin`): el barista escanea el QR con la cámara del
  celular o la tablet, marca qué pidió y suma las Z. Si completó la tarjeta,
  canjea el café de regalo ahí mismo.

## Cómo funciona, en una línea por actor

| Quién | Qué hace |
|---|---|
| Cliente | Entra a `/join`, pone nombre y email, escribe el código de 6 dígitos que le llega. Ya tiene tarjeta. |
| Cliente en el local | Toca el botón amarillo del QR y lo muestra. Cuando el barista suma, la tarjeta se sella sola en su pantalla. |
| Barista | Entra a `/admin` con su email (código por mail). Apunta la cámara al QR, elige los productos, toca **Sumar**. |
| Encargado | Lo mismo, y además anula consumos y suma baristas en **Equipo**. |
| Dueño | Todo lo anterior y suma encargados. |

Cada cliente tiene **una cuenta** (su email). No hay contraseñas: siempre
entra con un código por mail, en cualquier teléfono.

## Reglas de la tarjeta

- Cada café de la carta suma una Z (la medialuna no: `counts_for_collection`).
- A las 10 Z se desbloquea un **café de regalo** y la tarjeta vuelve a 0.
- Los recorridos (La carta completa, La vuelta al frío) avanzan con los mismos cafés.
- Un consumo nunca se borra: se **anula**, y queda quién y cuándo. Si se anula
  un café después de completar la tarjeta, el premio ya ganado se respeta.

## Seguridad del QR

- El QR lleva `zrv1.<código de socio>.<paso>.<firma>` y cambia cada 30 s. Una
  captura de pantalla sirve, como mucho, un minuto y **una sola vez**: el
  mismo código no se puede sumar dos veces (lo frena la base, no la pantalla).
- El secreto que firma el QR se entrega una vez por teléfono y queda
  guardado ahí: el QR funciona sin señal.
- Si la cámara no lee, el barista busca por código (`4KD7 PQ2M`), email o
  nombre. Esas cargas quedan marcadas **a mano**.

## Para ponerlo en marcha

1. **Base de datos.** Aplicá las dos migraciones nuevas, igual que las anteriores:
   ```bash
   npx supabase db push
   ```
   (o pegá en el SQL Editor, en orden, `supabase/migrations/20261012000100_punch_kind.sql`
   y `supabase/migrations/20261012000200_tarjeta_de_la_z.sql`).
   Después corré `supabase/tests/tarjeta_verificacion.sql` en el SQL Editor:
   tienen que salir todas las filas en `OK`.
2. **Productos y local.** Si nunca corriste `supabase/seed.sql`, corrélo: carga
   el local y la carta. Los precios y nombres se cambian desde la tabla `products`.
3. **Variables en Vercel** (Settings → Environment Variables):
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `CREDENTIAL_HMAC_MASTER` y la nueva
   `ZORVO_OWNER_EMAILS` con el email del dueño.
4. **Mail.** La plantilla Magic Link de Supabase tiene que incluir `{{ .Token }}`
   (ver `SMTP.md`), si no al cliente le llega un link en vez del código.
5. **Primer ingreso al mostrador.** El dueño entra a `/admin` con su email.
   Como está en `ZORVO_OWNER_EMAILS`, queda como dueño. Desde **Equipo** suma
   a los baristas por email.

## Apple Wallet

La hoja "Agregar a Apple Wallet" muestra cómo va a quedar el pase. Para que
el botón lo agregue de verdad hace falta la cuenta de Apple Developer del
dueño y el certificado del Pass Type ID (ver la guía de Apple Wallet). Con
eso se activa `NEXT_PUBLIC_WALLET_ENABLED=1` y se suma la ruta que genera el
pase firmado y lo actualiza con cada Z.

## Probado

- `npx tsc --noEmit` y `next build` sin errores.
- De punta a punta contra un Supabase local: alta con código por mail, QR,
  escaneo por cámara (también del QR con la Z al centro), sumar, replay
  bloqueado, firma falsa rechazada, tarjeta completa, festejo del cliente,
  canje, anulación, alta de barista y permisos por rol.
