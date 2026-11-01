// Funciones de apoyo que comparten todas las páginas.

// Evita que un texto con < > & " ' se interprete como HTML (protección XSS)
export function escaparHTML(texto) {
  return String(texto ?? '').replace(
    /[&<>"']/g,
    (caracter) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[caracter]
  );
}

// Solo deja pasar enlaces http(s); cualquier otra cosa (p. ej. javascript:) se anula
export function urlSegura(url) {
  try {
    const { protocol } = new URL(url);
    return protocol === 'https:' || protocol === 'http:' ? url : '#';
  } catch {
    return '#';
  }
}

// Ejecuta la función solo cuando el usuario deja de escribir por "espera" ms
export function retrasar(funcion, espera = 300) {
  let temporizador;
  return (...argumentos) => {
    clearTimeout(temporizador);
    temporizador = setTimeout(() => funcion(...argumentos), espera);
  };
}

const formatoFecha = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
export const formatearFecha = (fecha) => formatoFecha.format(new Date(fecha));

// Notificación flotante que desaparece sola
export function notificar(mensaje, tipo = 'exito') {
  const contenedor = document.getElementById('toasts');
  if (!contenedor) return;
  const toast = document.createElement('div');
  toast.className = `toast toast--${tipo}`;
  toast.setAttribute('role', tipo === 'error' ? 'alert' : 'status');
  toast.textContent = mensaje;
  contenedor.append(toast);
  setTimeout(() => {
    toast.classList.add('saliendo');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, 3800);
}

export const ICONOS = {
  externo:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6"/><path d="M10 14 20 4"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/></svg>',
  ojo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
  ojoTachado:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l18 18"/><path d="M10.6 5.1A10.4 10.4 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.2M6.6 6.6A17.4 17.4 0 0 0 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>',
  vacio:
    '<svg viewBox="0 0 120 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M8 48 Q60 4 112 48"/><path d="M8 48h104"/><path d="M34 48V31M60 48V26M86 48V31"/><path d="M8 58c10-5 20 5 30 0s20-5 30 0 20 5 30 0 10-3 14-2" stroke-width="2"/></svg>',
};
