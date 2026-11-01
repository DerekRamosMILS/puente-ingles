// Error con código HTTP. Los controladores y middlewares lo lanzan
// y el manejador central de errores lo convierte en una respuesta JSON.
export class ErrorApi extends Error {
  constructor(estado, mensaje, detalles) {
    super(mensaje);
    this.name = 'ErrorApi';
    this.estado = estado;
    this.detalles = detalles;
  }

  static solicitudInvalida(mensaje, detalles) {
    return new ErrorApi(400, mensaje, detalles);
  }

  static noAutorizado(mensaje = 'Necesitas iniciar sesión para hacer esto.') {
    return new ErrorApi(401, mensaje);
  }

  static prohibido(mensaje = 'No tienes permiso para hacer esto.') {
    return new ErrorApi(403, mensaje);
  }

  static noEncontrado(mensaje = 'No se encontró el recurso solicitado.') {
    return new ErrorApi(404, mensaje);
  }

  static conflicto(mensaje) {
    return new ErrorApi(409, mensaje);
  }
}
