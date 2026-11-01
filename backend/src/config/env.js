// Carga y valida las variables de entorno UNA sola vez.
// Todo el proyecto lee la configuración desde aquí, nunca directo de process.env.
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const requeridas = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET'];
const faltantes = requeridas.filter((nombre) => !process.env[nombre]);

if (faltantes.length > 0) {
  throw new Error(
    `Faltan variables de entorno: ${faltantes.join(', ')}. ` +
      'Copia backend/.env.example como backend/.env y complétalo.'
  );
}

if (process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET debe tener al menos 32 caracteres para que los tokens sean seguros.');
}

const lista = (valor = '') =>
  valor
    .split(',')
    .map((elemento) => elemento.trim())
    .filter(Boolean);

export const config = Object.freeze({
  entorno: process.env.NODE_ENV ?? 'development',
  puerto: Number(process.env.PORT) || 3000,
  corsOrigenes: lista(process.env.CORS_ORIGINS),
  db: Object.freeze({
    host: process.env.DB_HOST,
    puerto: Number(process.env.DB_PORT) || 3306,
    usuario: process.env.DB_USER,
    password: process.env.DB_PASSWORD ?? '',
    nombre: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true',
    // Render guarda los saltos de línea del certificado como \n literales
    certificadoCA: process.env.DB_SSL_CA ? process.env.DB_SSL_CA.replace(/\\n/g, '\n') : '',
    inicializarAlArrancar: process.env.DB_AUTO_INIT !== 'false',
  }),
  jwt: Object.freeze({
    secreto: process.env.JWT_SECRET,
    expiraEn: process.env.JWT_EXPIRES_IN ?? '2h',
    emisor: 'puente-api',
  }),
  semilla: Object.freeze({
    admin: {
      nombre: process.env.SEED_ADMIN_NOMBRE ?? 'Administración Puente',
      correo: process.env.SEED_ADMIN_CORREO,
      password: process.env.SEED_ADMIN_PASSWORD,
      rol: 'admin',
    },
    editor: {
      nombre: process.env.SEED_EDITOR_NOMBRE ?? 'Equipo editorial',
      correo: process.env.SEED_EDITOR_CORREO,
      password: process.env.SEED_EDITOR_PASSWORD,
      rol: 'editor',
    },
  }),
});
