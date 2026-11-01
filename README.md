# Puente · Recursos gratuitos para aprender inglés

Aplicación full stack (HTML, CSS y JavaScript + Node.js, Express y MySQL) con un catálogo público de recursos gratuitos para aprender inglés, organizados por nivel del Marco Común Europeo (A1–C2) y por habilidad. El equipo editorial administra el catálogo desde un panel protegido con **JWT**.

Avance del reto · Desarrollo Full Stack · Universidad Tecmilenio
Derek Joan Ramos del Ángel · AL07195561

- **En la nube (Render + Aiven MySQL):** https://puente-ingles.onrender.com
- **Local:** http://localhost:3000

## Tecnologías

| Capa | Herramientas |
|---|---|
| Frontend | HTML5, CSS3 (mobile-first), JavaScript ES6+ con módulos, Fetch API |
| Backend | Node.js 20+, Express 5 |
| Base de datos | MySQL 8/9 con `mysql2` (pool de conexiones y consultas parametrizadas) |
| Seguridad | `jsonwebtoken` (JWT HS256), `bcryptjs` (hash de contraseñas), `cors`, límite de intentos de login |
| Configuración | `dotenv` (`.env` local, variables de entorno en Render) |

## Estructura del proyecto

```
puente-ingles/
├── backend/
│   ├── server.js                  Arranque: conecta con MySQL, prepara la base y escucha el puerto
│   ├── package.json               Dependencias y scripts (start, dev, db:init)
│   ├── .env.example               Plantilla de variables de entorno
│   ├── db/
│   │   ├── schema.sql             Tablas usuarios y recursos
│   │   ├── datos-iniciales.js     14 recursos reales para arrancar
│   │   ├── inicializar.js         Script manual: npm run db:init
│   │   └── crear-usuario-local.sql.example   Base y usuario de MySQL local
│   └── src/
│       ├── app.js                 Express: middlewares, rutas, frontend estático y errores
│       ├── config/                env.js (dotenv), db.js (pool MySQL), inicializarBD.js
│       ├── routes/                auth.routes.js, recursos.routes.js
│       ├── controllers/           auth.controller.js, recursos.controller.js
│       ├── models/                usuario.model.js, recurso.model.js (SQL)
│       ├── middleware/            auth, validacion, errores, registro
│       └── utils/                 ErrorApi.js, catalogos.js
├── frontend/
│   ├── index.html                 Catálogo público (lectura sin cuenta)
│   ├── login.html                 Inicio de sesión
│   ├── panel.html                 Panel CRUD protegido
│   ├── css/estilos.css
│   ├── js/                        api.js, catalogo.js, login.js, panel.js, catalogos.js, utilidades.js
│   └── img/favicon.svg
└── docs/consultas-ia.md           Consultas a IA (dotenv y diseño del login)
```

Flujo de una petición: **ruta → middlewares (token, rol, validación) → controlador → modelo → MySQL**, y cualquier error termina en el manejador central con el mismo formato JSON.

## Endpoints de la API

Todas las respuestas son JSON: `{ "ok": true, "datos": … }` o `{ "ok": false, "error": { "estado", "mensaje", "detalles?" } }`.

| Método | Ruta | Acceso | Descripción | Códigos |
|---|---|---|---|---|
| GET | `/api/salud` | Público | Estado del servidor y de la base | 200, 503 |
| POST | `/api/auth/login` | Público (máx. 5 fallos / 15 min) | Devuelve el token JWT | 200, 400, 401, 429 |
| GET | `/api/auth/perfil` | Token | Datos del usuario de la sesión | 200, 401 |
| POST | `/api/auth/registro` | Token · admin | Crea un usuario editor o admin | 201, 400, 401, 403, 409 |
| GET | `/api/recursos` | Público | Lista; filtros `?nivel=&habilidad=&tipo=&q=` | 200, 400 |
| GET | `/api/recursos/estadisticas` | Público | Totales por nivel y habilidad | 200 |
| GET | `/api/recursos/:id` | Público | Un recurso | 200, 400, 404 |
| POST | `/api/recursos` | Token · admin o editor | Crea un recurso | 201, 400, 401, 403 |
| PUT | `/api/recursos/:id` | Token · admin o editor | Reemplaza un recurso | 200, 400, 401, 403, 404 |
| DELETE | `/api/recursos/:id` | Token · solo admin | Elimina un recurso | 200, 400, 401, 403, 404 |

Las rutas protegidas reciben el encabezado `Authorization: Bearer <token>`.

**Cuerpo de un recurso (POST / PUT):**

```json
{
  "titulo": "6 Minute English (BBC Learning English)",
  "descripcion": "Episodios cortos sobre temas actuales; cada uno enseña vocabulario nuevo.",
  "url": "https://www.bbc.co.uk/learningenglish/english/features/6-minute-english",
  "tipo": "podcast",
  "nivel": "B1",
  "habilidad": "escucha",
  "duracion_min": 6,
  "requiere_cuenta": false
}
```

Valores permitidos: `tipo` = curso, video, podcast, lectura, ejercicios, app, herramienta · `nivel` = A1, A2, B1, B2, C1, C2 · `habilidad` = escucha, lectura, escritura, conversacion, gramatica, vocabulario.

## Cómo ejecutarlo en local

Requisitos: Node.js 20 o superior y MySQL 8 o superior.

```bash
# 1. Base de datos y usuario de MySQL (una sola vez)
cd backend
cp db/crear-usuario-local.sql.example db/crear-usuario-local.sql   # cambia la contraseña adentro
mysql -u root -p < db/crear-usuario-local.sql

# 2. Variables de entorno
cp .env.example .env      # pon la misma contraseña en DB_PASSWORD, un JWT_SECRET y las contraseñas SEED_*

# 3. Dependencias y arranque
npm install
npm start                 # crea las tablas y los datos iniciales la primera vez
```

Abre http://localhost:3000 (catálogo) y http://localhost:3000/login.html (panel).

## Despliegue en la nube

- **Base de datos:** Aiven for MySQL (plan gratuito). Conexión cifrada con TLS (`DB_SSL=true` y el certificado CA en `DB_SSL_CA`).
- **Backend y frontend:** Render, servicio web gratuito conectado a este repositorio.
  - Build: `cd backend && npm install`
  - Start: `cd backend && npm start`
  - Health check: `/api/salud`
  - Variables: las mismas de `.env.example` con los datos de Aiven y `NODE_ENV=production`.

En el plan gratuito de Render el servicio se duerme tras 15 minutos sin visitas; la primera petición puede tardar cerca de un minuto en despertarlo.

---
Proyecto académico · Los recursos del catálogo pertenecen a sus respectivos sitios.
