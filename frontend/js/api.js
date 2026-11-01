// Cliente de la API REST y manejo de la sesión (token JWT).
// Todas las páginas hablan con el backend a través de este módulo.

const BASE = '/api';
const CLAVE_SESION = 'puente.sesion';

export class ErrorDeApi extends Error {
  constructor(estado, mensaje, detalles) {
    super(mensaje);
    this.estado = estado;
    this.detalles = detalles;
  }
}

// Lee el campo "exp" del token (segunda parte del JWT, en base64url)
function tokenVencido(token) {
  try {
    const carga = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return carga.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export const sesion = {
  obtener() {
    try {
      const datos = JSON.parse(localStorage.getItem(CLAVE_SESION));
      if (!datos?.token || tokenVencido(datos.token)) {
        this.cerrar();
        return null;
      }
      return datos;
    } catch {
      return null;
    }
  },
  guardar({ token, usuario }) {
    localStorage.setItem(CLAVE_SESION, JSON.stringify({ token, usuario }));
  },
  cerrar() {
    try {
      localStorage.removeItem(CLAVE_SESION);
    } catch {
      /* almacenamiento no disponible */
    }
  },
};

async function peticion(ruta, { metodo = 'GET', cuerpo, conToken = false } = {}) {
  const encabezados = { Accept: 'application/json' };
  if (cuerpo !== undefined) encabezados['Content-Type'] = 'application/json';

  if (conToken) {
    const actual = sesion.obtener();
    if (!actual) throw new ErrorDeApi(401, 'Tu sesión terminó. Inicia sesión de nuevo.');
    encabezados.Authorization = `Bearer ${actual.token}`;
  }

  let respuesta;
  try {
    respuesta = await fetch(BASE + ruta, {
      method: metodo,
      headers: encabezados,
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    });
  } catch {
    throw new ErrorDeApi(0, 'No hay conexión con el servidor. Revisa que la API esté encendida.');
  }

  const json = await respuesta.json().catch(() => null);
  if (!respuesta.ok || !json?.ok) {
    throw new ErrorDeApi(
      respuesta.status,
      json?.error?.mensaje ?? `El servidor respondió con el código ${respuesta.status}.`,
      json?.error?.detalles
    );
  }
  return json;
}

export const api = {
  async iniciarSesion(correo, password) {
    const { datos } = await peticion('/auth/login', { metodo: 'POST', cuerpo: { correo, password } });
    sesion.guardar(datos);
    return datos.usuario;
  },
  perfil: async () => (await peticion('/auth/perfil', { conToken: true })).datos,

  async listarRecursos(filtros = {}) {
    const parametros = new URLSearchParams(Object.entries(filtros).filter(([, valor]) => valor));
    const consulta = parametros.toString();
    return (await peticion(`/recursos${consulta ? `?${consulta}` : ''}`)).datos;
  },
  estadisticas: async () => (await peticion('/recursos/estadisticas')).datos,
  crearRecurso: async (datos) => (await peticion('/recursos', { metodo: 'POST', cuerpo: datos, conToken: true })).datos,
  actualizarRecurso: async (id, datos) =>
    (await peticion(`/recursos/${id}`, { metodo: 'PUT', cuerpo: datos, conToken: true })).datos,
  eliminarRecurso: (id) => peticion(`/recursos/${id}`, { metodo: 'DELETE', conToken: true }),
};
