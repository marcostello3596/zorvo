# Fase 3 — Alta y acceso de socios

El Club dejó de mostrar datos falsos. `SOCIO_DEMO` ya no se usa en ninguna pantalla.

## Pasos para probarlo

**1. Aplicar la migración nueva**

```bash
npx supabase db push
npm run db:types:remote
```

Agrega `v_challenge_sizes`, una vista que da el denominador de cada recorrido. Sin ella, un socio recién registrado vería "0 de 0" en su primera pantalla, porque `challenge_progress` no existe hasta el primer consumo.

**2. Configurar el envío de mails**

En el dashboard: Authentication → Emails → plantilla **Magic Link**.

Supabase usa esa plantilla también para el OTP. Si tiene solo `{{ .ConfirmationURL }}`, el mail llega con un link y no con el código. Cambiala para que incluya:

```
{{ .Token }}
```

Sin esto el socio recibe un mail que no le sirve.

> El SMTP que trae Supabase gratis está limitado a unos pocos mails por hora y solo a direcciones del equipo del proyecto. Para producción hay que conectar un SMTP propio (Resend, Postmark, SendGrid). Para probar entre ustedes dos alcanza.

**3. Probar el circuito**

```bash
npm run dev
```

- `/join` → nombre y email → llega el código → `/verificar` → entrás a `/club`
- `/ingresar` → mismo flujo para alguien que ya existe
- Entrar a `/club` sin sesión ahora redirige a `/ingresar`

Un socio nuevo va a ver 0 de 13. Es lo honesto.

**4. Cargar consumos de prueba**

Editá `supabase/cargar-consumos-demo.sql`, cambiá el email por el tuyo, y pegalo en el SQL Editor. Carga 11 cafés distintos repartidos en las últimas semanas, más tres Cold Brew repetidos para que "lo de siempre" tenga de dónde salir.

Esto **sí escribe** en la base — no tiene rollback. Al final del archivo hay un bloque comentado para deshacerlo.

Volvé a `/club` y vas a ver el progreso real, calculado por el mismo motor que verificaste con los 26 chequeos.

## Qué cambió en el código

| Archivo | Qué hace |
|---|---|
| `app/(auth)/actions.ts` | Server Actions de alta, ingreso, verificación y salida |
| `app/(auth)/ingresar/` | Login de socio existente |
| `app/(auth)/verificar/` | Los 6 dígitos |
| `app/join/` | Ahora es un alta real, no una maqueta |
| `lib/queries.ts` | Todas las consultas del Club, bajo RLS |
| `middleware.ts` | Protección reactivada, redirige a `/ingresar` |

## Decisiones que tomé

**Sin magic link, solo código.** El socio abre el mail en la computadora y un link lo dejaría logueado ahí, no en el teléfono que va a usar en el mostrador. Seis dígitos se transcriben entre dispositivos sin fricción.

**"Lo de siempre" solo aparece con dos consumos o más del mismo producto.** Inventarle un hábito a alguien que vino una vez es peor que no mostrar nada.

**Los errores de Supabase están traducidos.** El socio no tiene por qué leer "signups not allowed for otp".

**Todas las consultas usan el cliente con sesión, no `service_role`.** RLS ya garantiza que cada socio lee lo suyo. Si alguna consulta necesitara la clave admin, sería señal de que falta una política, no de que falta una excepción.

## Lo que sé que está flojo

**El bloque de "deshacer" del script demo puede fallar.** Usa `(select id from staff limit 1)` como autor de la anulación, y si no cargaste ningún barista eso es `NULL`, que viola el check `void_is_complete`. Es la misma restricción que descubrimos en los tests. Si lo necesitás, creá un staff antes o te paso una variante.

**Nada de esta fase fue compilado ni probado.** Sigo sin poder ejecutar código. Lo más probable que falle: la forma en que Supabase devuelve las relaciones anidadas (`profiles(display_name)` puede venir como objeto o como array según la versión del cliente — lo manejo con `Array.isArray`, pero es defensivo, no verificado).

**El QR sigue siendo decorativo.** El rotativo con HMAC es la Fase 5. El `member_code` de la credencial sí es real y ya sirve como fallback humano.

## Siguiente

Fase 4: catálogo administrable desde Operations. O saltar a la 5 y 6 — credencial real y escáner — que es donde el sistema empieza a servir en el mostrador.
