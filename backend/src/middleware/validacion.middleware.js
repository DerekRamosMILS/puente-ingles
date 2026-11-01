// Middlewares de validación: revisan los datos ANTES de llegar al controlador.
// Si algo está mal responden 400 con el detalle de cada campo.
import { ErrorApi } from '../utils/ErrorApi.js';
import { TIPOS, NIVELES, HABILIDADES, ROLES } from '../utils/catalogos.js';

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const texto = (valor) => (typeof valor === 'string' ? valor.trim() : '');

function esUrlWeb(valor) {
  try {
    const url = new URL(valor);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function rechazarSiHayErrores(errores, mensaje, next) {
  if (Object.keys(errores).length > 0) {
    next(ErrorApi.solicitudInvalida(mensaje, errores));
    return true;
  }
  return false;
}

// /api/recursos/:id → el id debe ser un entero positivo
export function validarId(req, res, next) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return next(ErrorApi.solicitudInvalida('El id debe ser un número entero positivo.'));
  }
  req.idRecurso = id;
  return next();
}

// GET /api/recursos?nivel=&habilidad=&tipo=&q=
export function validarFiltros(req, res, next) {
  const { nivel, habilidad, tipo } = req.query;
  const q = texto(req.query.q);
  const errores = {};

  if (nivel && !NIVELES.includes(nivel)) errores.nivel = `Usa uno de: ${NIVELES.join(', ')}.`;
  if (habilidad && !HABILIDADES.includes(habilidad)) errores.habilidad = `Usa uno de: ${HABILIDADES.join(', ')}.`;
  if (tipo && !TIPOS.includes(tipo)) errores.tipo = `Usa uno de: ${TIPOS.join(', ')}.`;
  if (q.length > 60) errores.q = 'La búsqueda admite máximo 60 caracteres.';

  if (rechazarSiHayErrores(errores, 'Los filtros no son válidos.', next)) return;
  req.filtros = { nivel, habilidad, tipo, q };
  return next();
}

// POST y PUT /api/recursos
export function validarRecurso(req, res, next) {
  const cuerpo = req.body ?? {};
  const errores = {};

  const titulo = texto(cuerpo.titulo);
  const descripcion = texto(cuerpo.descripcion);
  const url = texto(cuerpo.url);
  const { tipo, nivel, habilidad } = cuerpo;

  if (titulo.length < 3 || titulo.length > 120) errores.titulo = 'Escribe un título de 3 a 120 caracteres.';
  if (descripcion.length < 10 || descripcion.length > 500)
    errores.descripcion = 'La descripción debe tener de 10 a 500 caracteres.';
  if (!esUrlWeb(url) || url.length > 255) errores.url = 'Escribe un enlace completo que empiece con https://';
  if (!TIPOS.includes(tipo)) errores.tipo = 'Elige un tipo de recurso válido.';
  if (!NIVELES.includes(nivel)) errores.nivel = 'Elige un nivel entre A1 y C2.';
  if (!HABILIDADES.includes(habilidad)) errores.habilidad = 'Elige una habilidad válida.';

  let duracion = null;
  if (cuerpo.duracion_min !== undefined && cuerpo.duracion_min !== null && cuerpo.duracion_min !== '') {
    duracion = Number(cuerpo.duracion_min);
    if (!Number.isInteger(duracion) || duracion < 1 || duracion > 600)
      errores.duracion_min = 'La duración debe ser un número entero de 1 a 600 minutos.';
  }

  if (cuerpo.requiere_cuenta !== undefined && typeof cuerpo.requiere_cuenta !== 'boolean')
    errores.requiere_cuenta = 'requiere_cuenta debe ser true o false.';

  if (rechazarSiHayErrores(errores, 'Revisa los datos del recurso.', next)) return;

  // Solo estos campos llegan al modelo; cualquier otro dato del cliente se ignora
  req.datosValidados = {
    titulo,
    descripcion,
    url,
    tipo,
    nivel,
    habilidad,
    duracion_min: duracion,
    requiere_cuenta: cuerpo.requiere_cuenta === true,
  };
  return next();
}

// POST /api/auth/login
export function validarLogin(req, res, next) {
  const cuerpo = req.body ?? {};
  const correo = texto(cuerpo.correo).toLowerCase();
  const password = typeof cuerpo.password === 'string' ? cuerpo.password : '';
  const errores = {};

  if (!CORREO.test(correo)) errores.correo = 'Escribe un correo válido.';
  if (!password) errores.password = 'Escribe tu contraseña.';

  if (rechazarSiHayErrores(errores, 'Faltan datos para iniciar sesión.', next)) return;
  req.datosValidados = { correo, password };
  return next();
}

// POST /api/auth/registro (solo admin)
export function validarRegistro(req, res, next) {
  const cuerpo = req.body ?? {};
  const nombre = texto(cuerpo.nombre);
  const correo = texto(cuerpo.correo).toLowerCase();
  const password = typeof cuerpo.password === 'string' ? cuerpo.password : '';
  const rol = cuerpo.rol ?? 'editor';
  const errores = {};

  if (nombre.length < 2 || nombre.length > 80) errores.nombre = 'El nombre debe tener de 2 a 80 caracteres.';
  if (!CORREO.test(correo) || correo.length > 120) errores.correo = 'Escribe un correo válido.';
  if (password.length < 8 || !/\d/.test(password) || !/[A-Za-z]/.test(password))
    errores.password = 'La contraseña necesita al menos 8 caracteres, con letras y números.';
  if (!ROLES.includes(rol)) errores.rol = `El rol debe ser: ${ROLES.join(' o ')}.`;

  if (rechazarSiHayErrores(errores, 'Revisa los datos del usuario.', next)) return;
  req.datosValidados = { nombre, correo, password, rol };
  return next();
}
