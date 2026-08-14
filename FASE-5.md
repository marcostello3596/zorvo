# Fase 5 — La credencial rotativa

El QR dejó de ser decorativo. Ahora es un token con HMAC que cambia cada 30 segundos, generado en el teléfono del socio.

## Probarlo

```bash
npm install          # suma qrcode
npm run dev
```

Entrá a `/club/card`. Deberías ver el QR y una barra amarilla que se vacía en 30 segundos; cuando llega a cero, el patrón cambia.

**La prueba que importa:** poné el teléfono en modo avión (o cortá el WiFi) y recargá `/club/card`. El QR tiene que seguir rotando. Si funciona, la credencial sirve en un local con mala señal, que es exactamente donde se usa.

## Cómo funciona

```
zrv1.<member_code>.<step>.<hmac>

step = floor(unix_time / 30)
hmac = base32(HMAC-SHA256(secreto, "<member_code>.<step>"))[0..9]
```

El secreto se pide **una sola vez** y queda en el navegador. A partir de ahí el código se genera localmente, sin red.

**El QR no lleva ningún dato personal.** Solo el código de socio, que por sí solo no sirve para nada. Ni nombre, ni email, ni el id interno.

**Una captura de pantalla vale 30 segundos** — y solo si nadie la usó antes. El `UNIQUE(member_id, kind, token_step)` de `scan_events` hace que el mismo código no se pueda cobrar dos veces. Esa restricción ya está en la base desde la migración 0001.

## Decisiones

**Generación y verificación viven en el mismo archivo** (`lib/credential.ts`), sin `server-only`. Corre igual en el navegador y en Node porque usa Web Crypto. Si fueran dos implementaciones, un día divergirían y el mostrador dejaría de leer credenciales sin que nadie entienda por qué.

**Comparación en tiempo constante** al verificar. Con `===`, el tiempo de respuesta filtra cuántos caracteres coinciden. Acá el riesgo es bajo —el token vive 30 segundos— pero escribir la comparación insegura una vez es cómo termina copiada donde sí importa.

**localStorage y no IndexedDB**, a diferencia de lo que decía el plan. Para 32 bytes, IDB no compra nada: ninguno de los dos protege contra XSS, y localStorage es síncrono, lo que evita un estado de carga más en la pantalla que tiene que abrir instantánea.

**Tolerancia de ±1 paso** al verificar. Entre que el socio muestra la pantalla y el barista enfoca pasan segundos, y dos relojes nunca coinciden exactamente.

**Saqué el QR falso de la home del Club.** Mostrar uno decorativo invita a que el barista intente escanearlo y falle sin explicación. Ahora hay un ícono que lleva a `/club/card`.

## Lo que falta

**El secreto se guarda sin cifrar** en `credentials.secret_enc`. En producción va con pgsodium o Vault (§10). Es la misma deuda que arrastramos desde la Fase 2, ahora con datos reales adentro.

**No hay revocación.** Si alguien pierde el teléfono, hoy no hay pantalla para invalidar el secreto y emitir uno nuevo. La columna `revoked_at` existe y el código la respeta; falta la interfaz.

**`components/club/QrPlaceholder.tsx` quedó sin uso.** Lo dejo por si sirve para maquetar algo, pero se puede borrar.

**Nada de esto fue ejecutado.** Sigo sin poder compilar. Lo que más dudo: cómo devuelve PostgREST la columna `bytea` — asumo hex con prefijo `\x`, que es lo estándar, y contemplo base64 como alternativa, pero no lo vi funcionar.

## Siguiente

Fase 6: el escáner. `/admin/scan` a pantalla completa, cámara, decodificación, verificación contra este mismo HMAC, anti-replay y registro idempotente del consumo.

Es el momento en que todo lo anterior empieza a servir en el mostrador — y donde el motor de fidelidad que verificamos con los 26 chequeos entra en juego de verdad.
