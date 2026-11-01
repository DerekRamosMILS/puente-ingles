// Pool de conexiones a MySQL con mysql2 (versión con promesas).
// Un pool reutiliza conexiones abiertas en lugar de abrir una nueva por petición.
import mysql from 'mysql2/promise';
import { config } from './env.js';

function opcionesSSL() {
  if (!config.db.ssl) return undefined;
  // Con el certificado CA se verifica la identidad del servidor (recomendado).
  // Sin él, la conexión va cifrada pero sin verificar el certificado.
  return config.db.certificadoCA
    ? { ca: config.db.certificadoCA, rejectUnauthorized: true }
    : { rejectUnauthorized: false };
}

export const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.puerto,
  user: config.db.usuario,
  password: config.db.password,
  database: config.db.nombre,
  ssl: opcionesSSL(),
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
  timezone: 'Z',
});

export async function probarConexion() {
  const [filas] = await pool.query('SELECT 1 AS ok');
  return filas[0].ok === 1;
}
