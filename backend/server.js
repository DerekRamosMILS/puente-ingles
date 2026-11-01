// Punto de entrada: conecta con MySQL, prepara la base y levanta el servidor.
import { config } from './src/config/env.js';
import { probarConexion } from './src/config/db.js';
import { inicializarBD } from './src/config/inicializarBD.js';
import { crearApp } from './src/app.js';

async function iniciar() {
  try {
    await probarConexion();
    console.log(`✔ Conectado a MySQL: ${config.db.host}:${config.db.puerto}/${config.db.nombre}`);
    if (config.db.inicializarAlArrancar) await inicializarBD();
  } catch (error) {
    console.error(`✖ No se pudo preparar la base de datos: ${error.message}`);
    process.exit(1);
  }

  const app = crearApp();
  app.listen(config.puerto, () => {
    console.log(`✔ Puente en línea → http://localhost:${config.puerto}  (entorno: ${config.entorno})`);
  });
}

iniciar();
