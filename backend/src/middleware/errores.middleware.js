// Manejo centralizado de errores: TODAS las respuestas de error tienen el mismo formato.
// { ok: false, error: { estado, mensaje, detalles? } }
import { ErrorApi } from '../utils/ErrorApi.js';
import { config } from '../config/env.js';

// Ruta que no existe → 404
export function rutaNoEncontrada(req, res, next) {
  next(ErrorApi.noEncontrado(`La ruta ${req.method} ${req.originalUrl} no existe.`));
}

// Express reconoce un middleware de errores porque recibe 4 parámetros
// eslint-disable-next-line no-unused-vars
export function manejarErrores(error, req, res, next) {
  let estado = error instanceof ErrorApi ? error.estado : 500;
  let mensaje = error.message;
  const detalles = error.detalles;

  if (error.type === 'entity.parse.failed') {
    estado = 400;
    mensaje = 'El cuerpo de la petición no es un JSON válido.';
  } else if (error.type === 'entity.too.large') {
    estado = 413;
    mensaje = 'El cuerpo de la petición es demasiado grande.';
  } else if (error.code === 'ER_DUP_ENTRY') {
    estado = 409;
    mensaje = 'Ya existe un registro con ese valor (por ejemplo, el mismo correo).';
  } else if (['ECONNREFUSED', 'PROTOCOL_CONNECTION_LOST', 'ETIMEDOUT', 'ER_ACCESS_DENIED_ERROR'].includes(error.code)) {
    estado = 503;
    mensaje = 'La base de datos no está disponible en este momento.';
  }

  if (estado >= 500) {
    console.error(`✖ ${req.method} ${req.originalUrl}:`, error);
    // En producción no se filtran detalles internos al cliente
    if (estado === 500 && config.entorno === 'production') mensaje = 'Ocurrió un error interno. Intenta de nuevo.';
  }

  res.status(estado).json({
    ok: false,
    error: { estado, mensaje, ...(detalles && { detalles }) },
  });
}
