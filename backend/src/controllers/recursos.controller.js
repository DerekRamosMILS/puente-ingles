// Controlador de recursos: el CRUD completo.
// Recibe datos ya validados por los middlewares y responde en JSON.
import { Recurso } from '../models/recurso.model.js';
import { ErrorApi } from '../utils/ErrorApi.js';

async function buscarOFallar(id) {
  const recurso = await Recurso.obtenerPorId(id);
  if (!recurso) throw ErrorApi.noEncontrado(`No existe un recurso con id ${id}.`);
  return recurso;
}

// READ (lista con filtros)  GET /api/recursos
export async function listarRecursos(req, res) {
  const recursos = await Recurso.listar(req.filtros);
  res.json({ ok: true, total: recursos.length, datos: recursos });
}

// READ (uno)  GET /api/recursos/:id
export async function obtenerRecurso(req, res) {
  res.json({ ok: true, datos: await buscarOFallar(req.idRecurso) });
}

// READ (resumen)  GET /api/recursos/estadisticas
export async function obtenerEstadisticas(req, res) {
  res.json({ ok: true, datos: await Recurso.estadisticas() });
}

// CREATE  POST /api/recursos
export async function crearRecurso(req, res) {
  const recurso = await Recurso.crear(req.datosValidados, req.usuario.id);
  res
    .status(201)
    .location(`/api/recursos/${recurso.id}`)
    .json({ ok: true, mensaje: 'Recurso creado.', datos: recurso });
}

// UPDATE  PUT /api/recursos/:id
export async function actualizarRecurso(req, res) {
  await buscarOFallar(req.idRecurso);
  const recurso = await Recurso.actualizar(req.idRecurso, req.datosValidados);
  res.json({ ok: true, mensaje: 'Recurso actualizado.', datos: recurso });
}

// DELETE  DELETE /api/recursos/:id
export async function eliminarRecurso(req, res) {
  const recurso = await buscarOFallar(req.idRecurso);
  await Recurso.eliminar(req.idRecurso);
  res.json({ ok: true, mensaje: `Recurso "${recurso.titulo}" eliminado.`, datos: { id: recurso.id } });
}
