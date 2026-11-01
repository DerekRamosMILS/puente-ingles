// Script manual: npm run db:init
// Crea tablas y datos iniciales sin levantar el servidor.
import { inicializarBD } from '../src/config/inicializarBD.js';
import { pool } from '../src/config/db.js';

try {
  await inicializarBD();
  console.log('Base de datos lista.');
} catch (error) {
  console.error('No se pudo inicializar la base de datos:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
