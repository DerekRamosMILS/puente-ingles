# Consultas a inteligencia artificial

La actividad pide consultar una IA en dos momentos: para un ejemplo de configuración con **dotenv** y para sugerencias de **diseño CSS del login**. Aquí se registra qué se preguntó, qué respondió la IA (Claude, de Anthropic) y qué se adaptó o se descartó, con su porqué.

---

## 1. Ejemplo de configuración con dotenv

**Pregunta:** «Dame un ejemplo de cómo usar dotenv en un proyecto de Node.js con Express para guardar el puerto, los datos de conexión a MySQL y el secreto de JWT».

**Respuesta de la IA (resumen del ejemplo):**

```ini
# .env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=1234
DB_NAME=mi_base
JWT_SECRET=secreto
```

```js
// index.js
require('dotenv').config();
const express = require('express');
const app = express();
app.listen(process.env.PORT, () => console.log('Servidor en el puerto ' + process.env.PORT));
```

**Evaluación y adaptación en Puente:**

| Del ejemplo | Qué se hizo en Puente | Por qué |
|---|---|---|
| `require('dotenv').config()` en el archivo principal | `src/config/env.js` carga dotenv una sola vez con sintaxis ES6 (`import`) y exporta un objeto `config` congelado | Un solo lugar para toda la configuración; el resto del código no toca `process.env` |
| No valida nada | Si falta `DB_HOST`, `DB_USER`, `DB_NAME` o `JWT_SECRET`, el servidor se detiene con un mensaje claro | Evita arrancar a medias y fallar después con errores confusos |
| `JWT_SECRET=secreto` | Se exige un secreto de 32 caracteres o más, generado con `crypto.randomBytes` | Un secreto corto se puede adivinar y permitiría falsificar tokens |
| Usuario `root` con contraseña `1234` | Usuario propio `puente_app` con permisos solo sobre la base `puente` | Principio de mínimo privilegio |
| Solo conexión local | Se agregaron `DB_SSL` y `DB_SSL_CA` | Aiven (la base en la nube) exige conexión cifrada con TLS |
| Sin expiración del token | `JWT_EXPIRES_IN=2h` | Un token robado deja de servir pronto |
| — | `.env.example` con valores de muestra y `.env` en `.gitignore` | Se documentan las variables sin publicar secretos en GitHub |

---

## 2. Sugerencias de diseño CSS para el login

**Pregunta:** «Sugiéreme un diseño CSS moderno para la página de inicio de sesión de una plataforma educativa gratuita para aprender inglés».

**Respuesta de la IA (sugerencias):**

1. Tarjeta con efecto *glassmorphism* (fondo translúcido con `backdrop-filter: blur`) sobre un degradado de colores.
2. Diseño dividido: un panel con la marca o una ilustración y otro con el formulario; en el celular se apilan en una sola columna.
3. Etiquetas flotantes (*floating labels*) que suben cuando el usuario escribe.
4. Campos con anillo de enfoque del color de la marca y transiciones suaves; botón que se eleva con sombra al pasar el cursor.
5. Botón con ícono para mostrar u ocultar la contraseña.
6. Esquinas redondeadas (12–16 px) y sombras suaves.
7. Animación de entrada de la tarjeta (aparece y sube un poco).
8. Modo oscuro automático.

**Evaluación:**

| Sugerencia | Decisión | Razón |
|---|---|---|
| 2. Diseño dividido | ✅ Adoptada | Da identidad a la marca sin estorbar al formulario; en móvil el panel de marca se reduce a una franja |
| 4. Enfoque visible y transiciones | ✅ Adoptada | El anillo de enfoque es clave para quien navega con teclado |
| 5. Mostrar contraseña | ✅ Adoptada | Con `aria-pressed` y etiqueta que cambia («Mostrar» / «Ocultar») |
| 6. Esquinas y sombras suaves | ✅ Adoptada | Coherente con el resto de la interfaz |
| 7. Animación de entrada | ✅ Adaptada | Se desactiva con `prefers-reduced-motion` para personas sensibles al movimiento |
| 1. Glassmorphism | ❌ Descartada | El texto sobre un fondo translúcido y degradado pierde contraste (no cumple WCAG AA) y el desenfoque es costoso en equipos modestos |
| 3. Etiquetas flotantes | ❌ Descartada | La etiqueta se encoge y el placeholder desaparece; se usan etiquetas fijas arriba de cada campo, más claras para principiantes |
| 8. Modo oscuro | ⏸ Pospuesta | Se evaluará en la siguiente fase del reto |

**Agregados propios** (no venían en la respuesta): aviso de **Bloq Mayús activado**, errores por campo enlazados con `aria-describedby`, estado de carga en el botón «Entrar» y un mensaje cuando la sesión expira.
