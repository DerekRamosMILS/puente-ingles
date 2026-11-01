// Configuración de Express: middlewares globales, rutas, archivos estáticos y errores.
// El orden importa: Express ejecuta los middlewares de arriba hacia abajo.
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'node:url';
import { config } from './config/env.js';
import { pool } from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import recursosRoutes from './routes/recursos.routes.js';
import { registrarPeticion } from './middleware/registro.middleware.js';
import { rutaNoEncontrada, manejarErrores } from './middleware/errores.middleware.js';

const carpetaFrontend = fileURLToPath(new URL('../../frontend', import.meta.url));

// CORS: el frontend propio (mismo dominio) siempre funciona;
// otros dominios solo si están en CORS_ORIGINS.
const opcionesCors = {
  origin(origen, responder) {
    responder(null, !origen || config.corsOrigenes.includes(origen));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

export function crearApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1); // Render atiende detrás de un proxy

  // 1. Middlewares globales
  app.use(cors(opcionesCors));
  app.use(express.json({ limit: '20kb' }));
  app.use(registrarPeticion);

  // 2. API REST
  app.get('/api/salud', async (req, res) => {
    await pool.query('SELECT 1');
    res.json({
      ok: true,
      datos: { servicio: 'Puente API', estado: 'en línea', baseDeDatos: 'conectada', entorno: config.entorno },
    });
  });
  app.use('/api/auth', authRoutes);
  app.use('/api/recursos', recursosRoutes);
  app.use('/api', rutaNoEncontrada);

  // 3. Frontend (HTML, CSS y JS) servido por el mismo servidor
  app.use(express.static(carpetaFrontend, { extensions: ['html'] }));

  // 4. Lo que no coincidió con nada → 404, y al final el manejador de errores
  app.use(rutaNoEncontrada);
  app.use(manejarErrores);

  return app;
}
