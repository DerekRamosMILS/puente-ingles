// Prueba automática de la API: recorre el CRUD completo, la autenticación y los permisos.
// Uso:  npm run prueba:api                       (servidor local)
//       API_URL=https://mi-app.onrender.com npm run prueba:api   (servidor en la nube)
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const BASE = (process.env.API_URL ?? `http://localhost:${process.env.PORT ?? 3000}`).replace(/\/$/, '');
const EDITOR = { correo: process.env.SEED_EDITOR_CORREO, password: process.env.SEED_EDITOR_PASSWORD };
const ADMIN = { correo: process.env.SEED_ADMIN_CORREO, password: process.env.SEED_ADMIN_PASSWORD };

const resultados = [];

async function probar(descripcion, metodo, ruta, { token, cuerpo, esperado }) {
  const inicio = performance.now();
  const respuesta = await fetch(BASE + ruta, {
    method: metodo,
    headers: {
      ...(cuerpo && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const json = await respuesta.json().catch(() => ({}));
  const ms = Math.round(performance.now() - inicio);
  const paso = respuesta.status === esperado;
  resultados.push({ paso, descripcion, metodo, ruta, esperado, obtenido: respuesta.status, ms });
  const marca = paso ? '\x1b[32m✔\x1b[0m' : '\x1b[31m✖\x1b[0m';
  console.log(
    `${marca} ${metodo.padEnd(6)} ${ruta.padEnd(28)} ${String(respuesta.status).padEnd(4)} ${String(ms).padStart(4)} ms  ${descripcion}`
  );
  return json;
}

const recursoDePrueba = {
  titulo: 'Recurso de prueba automática',
  descripcion: 'Creado por pruebas/probar-api.js para verificar el CRUD completo.',
  url: 'https://example.com/prueba',
  tipo: 'ejercicios',
  nivel: 'A2',
  habilidad: 'gramatica',
  duracion_min: 15,
  requiere_cuenta: false,
};

console.log(`\nPuente · prueba de la API en ${BASE}\n`);
console.log(`  ${'MÉTODO'.padEnd(6)} ${'RUTA'.padEnd(28)} ${'HTTP'.padEnd(4)} ${'TIEMPO'.padStart(7)}  QUÉ SE PRUEBA`);

try {
  await probar('El servidor y la base responden', 'GET', '/api/salud', { esperado: 200 });
  const lista = await probar('READ: lista pública sin token', 'GET', '/api/recursos', { esperado: 200 });
  await probar('READ: filtro por nivel', 'GET', '/api/recursos?nivel=B1', { esperado: 200 });
  await probar('Filtro inválido → validación', 'GET', '/api/recursos?nivel=Z9', { esperado: 400 });
  await probar('CREATE sin token → bloqueado', 'POST', '/api/recursos', { cuerpo: recursoDePrueba, esperado: 401 });

  const editor = await probar('Login del editor', 'POST', '/api/auth/login', { cuerpo: EDITOR, esperado: 200 });
  const tokenEditor = editor.datos?.token;
  await probar('Perfil con token', 'GET', '/api/auth/perfil', { token: tokenEditor, esperado: 200 });
  await probar('CREATE con datos inválidos', 'POST', '/api/recursos', {
    token: tokenEditor,
    cuerpo: { titulo: 'x', url: 'no-es-url' },
    esperado: 400,
  });
  const creado = await probar('CREATE (editor)', 'POST', '/api/recursos', {
    token: tokenEditor,
    cuerpo: recursoDePrueba,
    esperado: 201,
  });
  const id = creado.datos?.id;
  await probar('READ: el recurso recién creado', 'GET', `/api/recursos/${id}`, { esperado: 200 });
  await probar('UPDATE (editor)', 'PUT', `/api/recursos/${id}`, {
    token: tokenEditor,
    cuerpo: { ...recursoDePrueba, titulo: 'Recurso de prueba (editado)', nivel: 'B1' },
    esperado: 200,
  });
  await probar('DELETE (editor) → sin permiso', 'DELETE', `/api/recursos/${id}`, { token: tokenEditor, esperado: 403 });

  const admin = await probar('Login del administrador', 'POST', '/api/auth/login', { cuerpo: ADMIN, esperado: 200 });
  const tokenAdmin = admin.datos?.token;
  await probar('DELETE (admin)', 'DELETE', `/api/recursos/${id}`, { token: tokenAdmin, esperado: 200 });
  await probar('READ: el recurso ya no existe', 'GET', `/api/recursos/${id}`, { esperado: 404 });
  await probar('Token alterado → rechazado', 'DELETE', '/api/recursos/1', {
    token: `${tokenAdmin.slice(0, -4)}AAAA`,
    esperado: 401,
  });
  await probar('Ruta inexistente → 404', 'GET', '/api/no-existe', { esperado: 404 });

  console.log(`\n  Recursos en el catálogo al iniciar la prueba: ${lista.total}`);
} catch (error) {
  console.error(`\n✖ La prueba se detuvo: ${error.message}`);
  if (error.cause?.code === 'ECONNREFUSED') console.error('  ¿Está encendido el servidor? Ejecuta npm start en otra terminal.');
  process.exitCode = 1;
}

const aprobadas = resultados.filter((r) => r.paso).length;
const color = aprobadas === resultados.length ? '\x1b[32m' : '\x1b[31m';
console.log(`${color}  ${aprobadas} de ${resultados.length} pruebas aprobadas\x1b[0m\n`);
if (aprobadas !== resultados.length) process.exitCode = 1;
