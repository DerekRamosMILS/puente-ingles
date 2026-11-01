// Middlewares de autenticación (¿quién eres?) y autorización (¿qué puedes hacer?).
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { ErrorApi } from '../utils/ErrorApi.js';

// 1) Verifica el token JWT enviado en el encabezado Authorization: Bearer <token>
export function verificarToken(req, res, next) {
  const encabezado = req.get('Authorization') ?? '';
  const [esquema, token] = encabezado.split(' ');

  if (esquema !== 'Bearer' || !token) {
    return next(ErrorApi.noAutorizado('Necesitas iniciar sesión: falta el token (Authorization: Bearer <token>).'));
  }

  try {
    const datos = jwt.verify(token, config.jwt.secreto, {
      algorithms: ['HS256'],
      issuer: config.jwt.emisor,
    });
    req.usuario = { id: Number(datos.sub), nombre: datos.nombre, rol: datos.rol };
    return next();
  } catch (error) {
    const mensaje =
      error.name === 'TokenExpiredError'
        ? 'Tu sesión expiró. Inicia sesión de nuevo.'
        : 'El token no es válido.';
    return next(ErrorApi.noAutorizado(mensaje));
  }
}

// 2) Permite el paso solo a los roles indicados. Uso: permitirRoles('admin', 'editor')
export function permitirRoles(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) return next(ErrorApi.noAutorizado());
    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return next(
        ErrorApi.prohibido(
          `Tu rol (${req.usuario.rol}) no tiene permiso para esta acción. Se requiere: ${rolesPermitidos.join(' o ')}.`
        )
      );
    }
    return next();
  };
}

// 3) Frena ataques de fuerza bruta: máximo de intentos FALLIDOS por IP en una ventana de tiempo
export function limitarIntentos({ maximo = 5, ventanaMs = 15 * 60 * 1000 } = {}) {
  const intentos = new Map(); // ip -> { fallos, reinicio }

  return (req, res, next) => {
    const ahora = Date.now();
    const ip = req.ip;
    let registro = intentos.get(ip);

    if (!registro || registro.reinicio <= ahora) {
      registro = { fallos: 0, reinicio: ahora + ventanaMs };
      intentos.set(ip, registro);
    }

    if (registro.fallos >= maximo) {
      const segundos = Math.ceil((registro.reinicio - ahora) / 1000);
      res.set('Retry-After', String(segundos));
      return next(
        new ErrorApi(429, `Demasiados intentos fallidos. Espera ${Math.ceil(segundos / 60)} min e intenta de nuevo.`)
      );
    }

    // Al terminar la respuesta: un 401 suma un fallo, un login correcto limpia el contador
    res.on('finish', () => {
      if (res.statusCode === 401) registro.fallos += 1;
      else if (res.statusCode === 200) intentos.delete(ip);
    });

    return next();
  };
}
