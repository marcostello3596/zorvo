# Envío de mails — Gmail como paso intermedio

Para que el OTP funcione de verdad hacen falta 10 minutos: una contraseña de aplicación en Google y cuatro campos en Supabase.

---

## 1. Contraseña de aplicación en Google

**No sirve la contraseña de tu cuenta.** Google retiró el acceso de "apps menos seguras" en 2022. Hoy la única forma es una contraseña de aplicación de 16 caracteres, y para eso necesitás la verificación en dos pasos activada.

1. [myaccount.google.com/security](https://myaccount.google.com/security)
2. Si no tenés **Verificación en 2 pasos**, activala primero. Sin eso no aparece la opción siguiente.
3. Buscá **Contraseñas de aplicaciones** (está dentro de la sección de 2 pasos, o buscala en el buscador de la página).
4. Nombre: `Zorvo Supabase` → Crear.
5. Te da 16 caracteres en cuatro grupos. **Copialos ahora**: no se vuelven a mostrar.

Los espacios no importan; podés pegarla con o sin ellos.

---

## 2. Supabase

Dashboard → Authentication → Emails → **SMTP Settings** → Enable Custom SMTP.

| Campo | Valor |
|---|---|
| Host | `smtp.gmail.com` |
| Port | `587` |
| Username | tu Gmail completo |
| Password | la contraseña de aplicación de 16 caracteres |
| Sender email | el mismo Gmail |
| Sender name | `Zorvo` |

Save.

> **Sender email tiene que ser tu Gmail.** Si ponés otra cosa, Gmail la reescribe con tu dirección real igual. No es configurable desde acá; es cómo funciona el servidor de Google.

---

## 3. La plantilla del mail

Este es el paso que rompe el circuito si se saltea.

Authentication → Emails → plantilla **Magic Link**.

Supabase usa esa misma plantilla para el OTP. Si solo tiene `{{ .ConfirmationURL }}`, al socio le llega un link y no el código de seis dígitos que le pide nuestra pantalla.

Reemplazá el cuerpo por algo así:

```html
<h2>Tu código de Zorvo</h2>

<p>Este es tu código para entrar al Club:</p>

<p style="font-size:32px;letter-spacing:8px;font-weight:bold">{{ .Token }}</p>

<p>Vence en 10 minutos. Si no lo pediste, ignorá este mail.</p>

<p style="color:#696965;font-size:13px">
  Zorvo — Cool Brew Coffee
</p>
```

Lo que importa es `{{ .Token }}`. El resto es tuyo.

---

## 4. Probar

```bash
npm run dev
```

`/join` con tu email → tiene que llegar el mail con seis dígitos → `/verificar` → entrás a `/club`.

Con SMTP propio el límite de Supabase pasa de 2 a **30 mails por hora**, así que ya podés iterar sin esperar.

---

## Los límites de esto, que conviene tener claros

**500 mails por día** en un Gmail personal. Para vos y tu amigo sobra; para una cafetería con socios reales, no.

**Los mails salen de tu dirección personal.** El socio va a ver tu nombre y tu Gmail en el remitente. Para probar está bien; para clientes reales es raro y poco confiable.

**La reputación de envío es la de tu cuenta, no la de Zorvo.** Si Gmail marca los mails como spam, no hay nada que ajustar: no controlás el dominio ni los registros SPF/DKIM.

**Y una advertencia que no es técnica:** los términos de Gmail no contemplan el envío automatizado de mails transaccionales a terceros. En la práctica, con este volumen, no pasa nada. Pero si el Club crece y empiezan a salir cientos de mails por día desde tu cuenta personal, Google puede suspenderla — y ahí perdés tu correo, no solo el envío de Zorvo.

**Por eso es un paso intermedio y no la solución.** Está bien para desbloquearte hoy.

---

## Cuando quieras hacerlo bien

Con un dominio propio (`zorvo.coffee` o el que compre tu amigo):

1. Cuenta en **Resend** o **Postmark**. Ambos tienen plan gratuito de sobra: Resend da 3.000 mails por mes.
2. Verificás el dominio: agregás tres registros DNS (SPF, DKIM, DMARC) donde lo compraste.
3. Cambiás host, usuario y contraseña en la misma pantalla de Supabase.
4. Sender email pasa a ser `hola@zorvo.coffee`.

Son otros 15 minutos y la diferencia es grande: el remitente es la marca, la reputación es del dominio, y tenés métricas de entrega y rebote.

**Que el dominio y la cuenta de Resend las abra tu amigo**, por lo mismo que Supabase. Es su marca y su lista de clientes.
