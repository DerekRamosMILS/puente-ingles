// Modelo de recursos: todas las consultas SQL del CRUD.
// Siempre se usan marcadores (?) para evitar inyección SQL.
import { pool } from '../config/db.js';

const SELECCION = `
  SELECT r.id, r.titulo, r.descripcion, r.url, r.tipo, r.nivel, r.habilidad,
         r.duracion_min, r.requiere_cuenta, r.creado_en, r.actualizado_en,
         u.nombre AS autor
  FROM recursos r
  LEFT JOIN usuarios u ON u.id = r.creado_por`;

// MySQL devuelve BOOLEAN como 0/1; aquí se convierte a true/false
const normalizar = (fila) => ({ ...fila, requiere_cuenta: Boolean(fila.requiere_cuenta) });

export const Recurso = {
  async listar({ nivel, habilidad, tipo, q } = {}) {
    const condiciones = [];
    const valores = [];

    if (nivel) {
      condiciones.push('r.nivel = ?');
      valores.push(nivel);
    }
    if (habilidad) {
      condiciones.push('r.habilidad = ?');
      valores.push(habilidad);
    }
    if (tipo) {
      condiciones.push('r.tipo = ?');
      valores.push(tipo);
    }
    if (q) {
      condiciones.push('(r.titulo LIKE ? OR r.descripcion LIKE ?)');
      valores.push(`%${q}%`, `%${q}%`);
    }

    const donde = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
    const orden = "ORDER BY FIELD(r.nivel, 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'), r.titulo";
    const [filas] = await pool.execute(`${SELECCION} ${donde} ${orden}`, valores);
    return filas.map(normalizar);
  },

  async obtenerPorId(id) {
    const [filas] = await pool.execute(`${SELECCION} WHERE r.id = ?`, [id]);
    return filas[0] ? normalizar(filas[0]) : null;
  },

  async crear(datos, usuarioId) {
    const [resultado] = await pool.execute(
      `INSERT INTO recursos
         (titulo, descripcion, url, tipo, nivel, habilidad, duracion_min, requiere_cuenta, creado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        datos.titulo,
        datos.descripcion,
        datos.url,
        datos.tipo,
        datos.nivel,
        datos.habilidad,
        datos.duracion_min,
        datos.requiere_cuenta,
        usuarioId,
      ]
    );
    return this.obtenerPorId(resultado.insertId);
  },

  async actualizar(id, datos) {
    await pool.execute(
      `UPDATE recursos
       SET titulo = ?, descripcion = ?, url = ?, tipo = ?, nivel = ?, habilidad = ?,
           duracion_min = ?, requiere_cuenta = ?
       WHERE id = ?`,
      [
        datos.titulo,
        datos.descripcion,
        datos.url,
        datos.tipo,
        datos.nivel,
        datos.habilidad,
        datos.duracion_min,
        datos.requiere_cuenta,
        id,
      ]
    );
    return this.obtenerPorId(id);
  },

  async eliminar(id) {
    const [resultado] = await pool.execute('DELETE FROM recursos WHERE id = ?', [id]);
    return resultado.affectedRows > 0;
  },

  async contar() {
    const [filas] = await pool.query('SELECT COUNT(*) AS total FROM recursos');
    return filas[0].total;
  },

  async estadisticas() {
    const [porNivel] = await pool.query(
      "SELECT nivel, COUNT(*) AS total FROM recursos GROUP BY nivel ORDER BY FIELD(nivel, 'A1', 'A2', 'B1', 'B2', 'C1', 'C2')"
    );
    const [porHabilidad] = await pool.query(
      'SELECT habilidad, COUNT(*) AS total FROM recursos GROUP BY habilidad ORDER BY total DESC'
    );
    const total = porNivel.reduce((suma, fila) => suma + Number(fila.total), 0);
    return {
      total,
      porNivel: porNivel.map((f) => ({ nivel: f.nivel, total: Number(f.total) })),
      porHabilidad: porHabilidad.map((f) => ({ habilidad: f.habilidad, total: Number(f.total) })),
    };
  },
};
