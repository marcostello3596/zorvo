# Zorvo — paso a paso, sin Docker

Cada paso dice qué esperar. Si algo no coincide, pará ahí y decímelo: seguir con un paso a medias hace que el error aparezca tres pasos después, donde cuesta mucho más encontrarlo.

---

## Paso 1 — Que tu amigo cree la cuenta de Supabase

**Él, no vos.** Ahí van a estar los nombres, emails e historial de consumo de sus clientes. Si la cuenta queda a tu nombre, esos datos están bajo tu control y no el suyo, y el día que quiera seguir sin vos la migración es incómoda.

1. Entra a supabase.com y crea cuenta.
2. New project. Nombre `zorvo`. **Región: São Paulo** (la más cercana a Argentina; cada salto de latencia se paga en el mostrador).
3. Guarda la contraseña de base de datos que genera. **No se puede recuperar después**, solo resetear.
4. Te invita como colaborador: Settings → Team → Invite.

Plan gratuito: 500 MB y 50.000 usuarios activos por mes. De sobra para arrancar.

**Esperá:** un proyecto tarda unos 2 minutos en aprovisionarse.

---

## Paso 2 — Instalar el proyecto

**No instales la CLI de Supabase globalmente.** No está soportado: la bloquean a propósito porque se rompe con cada actualización de Node y genera errores de permisos. Ya está como dependencia del proyecto, así que se usa con `npx`.

```bash
cd ~/Documents/Claude/Projects/zorvo
npm install
npx supabase --version
```

**Esperá:** unos 40 paquetes y después un número de versión (algo como `2.40.x`). Warnings de peer dependencies son normales; errores rojos no.

> **Si ves `EACCES: permission denied`,** es que estás intentando instalar global. No uses `sudo`: deja archivos con dueño root dentro de `node_modules` y los problemas posteriores son peores. Volvé a este paso tal cual está escrito.
>
> Si preferís tenerla global igual, la vía soportada en macOS es Homebrew: `brew install supabase/tap/supabase`. Con `npx` no hace falta.

**De acá en adelante, todos los comandos `supabase` van con `npx` adelante.**

> Si `npm install` falla por la versión de Next: abrí `package.json` y cambiá `"next": "^16.3.0"` por `"next": "15.5.21"`. Es la rama parcheada de 15.x y no exige migración. Avisame si pasa.

---

## Paso 3 — Conectar con Supabase

En el dashboard, Project Settings → General, copiá el **Reference ID**.

```bash
npx supabase login          # abre el navegador
npx supabase link --project-ref <el-reference-id>
```

Te va a pedir la contraseña de base de datos del paso 1.

**Esperá:** `Finished supabase link.`

---

## Paso 4 — Aplicar las migraciones

```bash
npx supabase db push
```

**Esperá:** que liste las tres migraciones y las aplique.

```
20260814000100_init_schema.sql
20260814000200_helpers_and_rls.sql
20260814000300_loyalty_engine.sql
```

> **Este es el paso donde más probable es que falle algo.** Todo el SQL se escribió sin poder ejecutarse. Si aparece un error, copiámelo entero: el mensaje de Postgres dice el archivo y la línea, y lo corrijo rápido.

---

## Paso 5 — Cargar la carta

El seed no se aplica solo en la nube.

1. Dashboard → SQL Editor → New query.
2. Pegá el contenido de `supabase/seed.sql`.
3. Run.

**Esperá:** `Success. No rows returned.`

Verificá en Table Editor → `products`: tienen que estar los 13 cafés más la medialuna.

---

## Paso 6 — Correr los tests · el paso que importa

1. Dashboard → Database → Extensions → buscá `pgtap` → activala.
2. SQL Editor → New query → pegá `supabase/tests/loyalty_test.sql` entero.
3. Run.

**Esperá:** 17 filas, todas empezando con `ok`.

```
ok 1 - T1 · siete cafés distintos dan 7 de progreso
ok 2 - T1 · con progreso parcial no hay gorra
...
ok 17 - T8 · quien ya completó conserva la gorra
```

Si alguna dice `not ok`, mandámela con el número y el mensaje.

El archivo abre con `begin` y cierra con `rollback`: no deja nada escrito. Podés correrlo las veces que quieras, incluso más adelante con datos reales.

**Por qué este paso importa más que el resto:** el motor de fidelidad es lo único del sistema donde un bug se traduce en plata. Una gorra entregada dos veces, o un progreso que no avanza y hace que alguien se enoje en el mostrador. Estos 17 tests son los ocho escenarios que pueden romperlo.

---

## Paso 7 — Generar los tipos

```bash
npm run db:types:remote
```

(Los scripts de `package.json` ya usan la CLI local, así que estos van sin `npx`.)

**Esperá:** que `types/database.types.ts` pase de un stub de 30 líneas a unas 400 con todas las tablas.

---

## Paso 8 — Variables de entorno

```bash
cp .env.example .env.local
```

Del dashboard, Project Settings → API:

- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

Y generá la master key:

```bash
openssl rand -base64 48
```

Esa va en `CREDENTIAL_HMAC_MASTER`.

> La `service_role` ignora RLS por completo. Nunca en una variable `NEXT_PUBLIC_*`, nunca en el repositorio, nunca por WhatsApp. Usá un gestor de contraseñas compartido con tu amigo.

---

## Paso 9 — Levantar la app

```bash
npm run dev
```

**Esperá:** `Ready on http://localhost:3000`.

> **Ojo:** todavía faltan copiar `app/` y `components/` a tu carpeta — quedaron en el entorno temporal que se trabó. Hasta que estén, este paso va a fallar con "no pages found". Decime y te los paso.

---

## Cuando todo esto pase

Fase 3: auth con OTP por email, el alta de socio real, y el PIN de barista. Ahí el Club empieza a funcionar de verdad.

---

## Si algo falla

Mandame el error completo, no resumido. El mensaje de Postgres y el stack de Node dicen exactamente dónde está el problema; parafraseado se pierde justo lo que sirve.
