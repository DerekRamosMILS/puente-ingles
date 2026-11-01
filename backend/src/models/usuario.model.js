// Modelo de usuarios: únicamente consultas SQL, sin lógica HTTP.
import { pool } from '../config/db.js';

const CAMPOS_PUBLICOS = 'id, nombre, correo, rol, creado_en';

export const Usuario = {
  async buscarPorCorreo(correo) {
    // Incluye password_hash: solo lo usa el login para comparar contraseñas
    const [filas] = await pool.execute(
      `SELECT ${CAMPOS_PUBLICOS}, password_hash FROM usuarios WHERE correo = ?`,
      [correo]
    );
    return filas[0] ?? null;
  },

  async buscarPorId(id) {
    const [filas] = await pool.execute(`SELECT ${CAMPOS_PUBLICOS} FROM usuarios WHERE id = ?`, [id]);
    return filas[0] ?? null;
  },

  async crear({ nombre, correo, passwordHash, rol }) {
    const [resultado] = await pool.execute(
      'INSERT INTO usuarios (nombre, correo, password_hash, rol) VALUES (?, ?, ?, ?)',
      [nombre, correo, passwordHash, rol]
    );
    return this.buscarPorId(resultado.insertId);
  },
};
