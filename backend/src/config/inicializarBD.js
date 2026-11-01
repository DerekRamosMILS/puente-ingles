// Crea las tablas si no existen y carga los datos iniciales.
// Es idempotente: se puede ejecutar muchas veces sin duplicar nada.
import { readFile } from 'node:fs/promises';
import bcrypt from 'bcryptjs';
import { pool } from './db.js';
import { config } from './env.js';
import { Usuario } from '../models/usuario.model.js';
import { Recurso } from '../models/recurso.model.js';
import { recursosIniciales } from '../../db/datos-iniciales.js';

const rutaEsquema = new URL('../../db/schema.sql', import.meta.url);

async function crearTablas() {
  const sql = await readFile(rutaEsquema, 'utf8');
  const sentencias = sql
    .split('\n')
    .filter((linea) => !linea.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map((sentencia) => sentencia.trim())
    .filter(Boolean);

  for (const sentencia of sentencias) {
    await pool.query(sentencia);
  }
}

async function crearUsuariosIniciales() {
  const creados = [];
  for (const datos of [config.semilla.admin, config.semilla.editor]) {
    if (!datos.correo || !datos.password) continue;
    const existente = await Usuario.buscarPorCorreo(datos.correo);
    if (existente) continue;
    const passwordHash = await bcrypt.hash(datos.password, 10);
    await Usuario.crear({ nombre: datos.nombre, correo: datos.correo, passwordHash, rol: datos.rol });
    creados.push(`${datos.correo} (${datos.rol})`);
  }
  return creados;
}

async function cargarRecursosIniciales() {
  if ((await Recurso.contar()) > 0) return 0;
  const admin = config.semilla.admin.correo ? await Usuario.buscarPorCorreo(config.semilla.admin.correo) : null;
  for (const recurso of recursosIniciales) {
    await Recurso.crear(recurso, admin?.id ?? null);
  }
  return recursosIniciales.length;
}

export async function inicializarBD() {
  await crearTablas();
  const usuarios = await crearUsuariosIniciales();
  const recursos = await cargarRecursosIniciales();

  console.log('✔ Tablas verificadas: usuarios, recursos');
  if (usuarios.length) console.log(`✔ Usuarios iniciales creados: ${usuarios.join(', ')}`);
  if (recursos) console.log(`✔ ${recursos} recursos iniciales cargados`);

  const [[{ admins }]] = await pool.query("SELECT COUNT(*) AS admins FROM usuarios WHERE rol = 'admin'");
  if (Number(admins) === 0) {
    console.warn('⚠ No hay administradores: define SEED_ADMIN_CORREO y SEED_ADMIN_PASSWORD en .env');
  }
}
