// Página de inicio de sesión: valida, envía las credenciales a la API
// y guarda el token JWT que devuelve el backend.
import { api, sesion } from './api.js';
import { ICONOS } from './utilidades.js';

const formulario = document.getElementById('form-login');
const correo = document.getElementById('correo');
const password = document.getElementById('password');
const botonEntrar = document.getElementById('btn-entrar');
const botonMostrar = document.getElementById('mostrar-password');
const avisoMayus = document.getElementById('aviso-mayus');
const alerta = document.getElementById('alerta-login');

const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Si ya hay una sesión vigente, no tiene caso volver a pedir datos
if (sesion.obtener()) location.replace('panel.html');

function mostrarAlerta(mensaje, tipo = 'error') {
  alerta.textContent = mensaje;
  alerta.className = tipo === 'info' ? 'alerta alerta--info' : 'alerta';
  alerta.hidden = false;
}

function marcarError(campo, mensaje) {
  document.getElementById(`error-${campo.id}`).textContent = mensaje;
  campo.setAttribute('aria-invalid', mensaje ? 'true' : 'false');
}

function validar() {
  let primero = null;
  const valorCorreo = correo.value.trim();

  if (!valorCorreo) marcarError(correo, 'Escribe tu correo.');
  else if (!CORREO_VALIDO.test(valorCorreo)) marcarError(correo, 'Ese correo no tiene un formato válido.');
  else marcarError(correo, '');
  if (correo.getAttribute('aria-invalid') === 'true') primero = correo;

  marcarError(password, password.value ? '' : 'Escribe tu contraseña.');
  if (!primero && !password.value) primero = password;

  primero?.focus();
  return !primero;
}

function alternarPassword() {
  const visible = password.type === 'text';
  password.type = visible ? 'password' : 'text';
  botonMostrar.innerHTML = visible ? ICONOS.ojo : ICONOS.ojoTachado;
  botonMostrar.setAttribute('aria-pressed', String(!visible));
  botonMostrar.setAttribute('aria-label', visible ? 'Mostrar contraseña' : 'Ocultar contraseña');
}

function revisarMayusculas(evento) {
  if (typeof evento.getModifierState === 'function') avisoMayus.hidden = !evento.getModifierState('CapsLock');
}

async function enviar(evento) {
  evento.preventDefault();
  alerta.hidden = true;
  if (!validar()) return;

  botonEntrar.disabled = true;
  botonEntrar.classList.add('cargando');
  botonEntrar.setAttribute('aria-label', 'Entrando…');

  try {
    const usuario = await api.iniciarSesion(correo.value.trim(), password.value);
    mostrarAlerta(`Bienvenida/o, ${usuario.nombre}. Abriendo el panel…`, 'info');
    setTimeout(() => location.assign('panel.html'), 600);
  } catch (error) {
    if (error.detalles) {
      Object.entries(error.detalles).forEach(([campo, mensaje]) => {
        const entrada = document.getElementById(campo);
        if (entrada) marcarError(entrada, mensaje);
      });
    }
    mostrarAlerta(error.message);
    password.select();
    botonEntrar.disabled = false;
    botonEntrar.classList.remove('cargando');
    botonEntrar.removeAttribute('aria-label');
  }
}

// Mensajes cuando se llega aquí desde el panel
const motivo = new URLSearchParams(location.search).get('motivo');
if (motivo === 'expirada') mostrarAlerta('Tu sesión expiró. Inicia sesión de nuevo.', 'info');
if (motivo === 'requerida') mostrarAlerta('Inicia sesión para entrar al panel de recursos.', 'info');
if (motivo === 'salida') mostrarAlerta('Cerraste sesión correctamente.', 'info');

botonMostrar.innerHTML = ICONOS.ojo;
botonMostrar.addEventListener('click', alternarPassword);
password.addEventListener('keyup', revisarMayusculas);
password.addEventListener('keydown', revisarMayusculas);
correo.addEventListener('input', () => correo.getAttribute('aria-invalid') === 'true' && marcarError(correo, ''));
password.addEventListener('input', () => password.getAttribute('aria-invalid') === 'true' && marcarError(password, ''));
formulario.addEventListener('submit', enviar);
correo.focus();
