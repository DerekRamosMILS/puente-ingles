// Panel protegido: CRUD de recursos con el token JWT de la sesión.
// Crear y editar: admin y editor.  Eliminar: solo admin (lo valida el backend y la interfaz lo refleja).
import { api, sesion } from './api.js';
import { NIVELES, HABILIDADES, TIPOS, nombreDe, llenarSelect } from './catalogos.js';
import { escaparHTML, urlSegura, formatearFecha, notificar, retrasar } from './utilidades.js';

// ---------- Guardia: sin sesión válida no se entra ----------
const sesionActual = sesion.obtener();
if (!sesionActual) location.replace('login.html?motivo=requerida');

const el = {
  avatar: document.getElementById('usuario-avatar'),
  nombre: document.getElementById('usuario-nombre'),
  rol: document.getElementById('usuario-rol'),
  permisos: document.getElementById('texto-permisos'),
  salir: document.getElementById('btn-salir'),
  nuevo: document.getElementById('btn-nuevo'),
  indicadores: document.getElementById('indicadores'),
  buscar: document.getElementById('buscar-panel'),
  conteo: document.getElementById('conteo-panel'),
  cuerpo: document.getElementById('cuerpo-tabla'),
  estado: document.getElementById('estado-panel'),
  dialogo: document.getElementById('dialogo-recurso'),
  formulario: document.getElementById('form-recurso'),
  tituloDialogo: document.getElementById('titulo-dialogo'),
  alertaForm: document.getElementById('alerta-form'),
  guardar: document.getElementById('btn-guardar'),
  contador: document.getElementById('contador-descripcion'),
  dialogoEliminar: document.getElementById('dialogo-eliminar'),
  textoEliminar: document.getElementById('texto-eliminar'),
  confirmarEliminar: document.getElementById('btn-confirmar-eliminar'),
};

const campos = ['titulo', 'url', 'descripcion', 'nivel', 'habilidad', 'tipo', 'duracion_min', 'requiere_cuenta'].reduce(
  (mapa, id) => ({ ...mapa, [id]: document.getElementById(id) }),
  {}
);

const estado = {
  usuario: sesionActual?.usuario,
  recursos: [],
  filtro: '',
  editandoId: null,
  eliminandoId: null,
};

const esAdmin = () => estado.usuario?.rol === 'admin';

// ---------- Sesión ----------
function salir(motivo = 'salida') {
  sesion.cerrar();
  location.replace(`login.html?motivo=${motivo}`);
}

function atenderError(error) {
  if (error.estado === 401) return salir('expirada');
  notificar(error.message, 'error');
}

function mostrarUsuario() {
  const { nombre, rol } = estado.usuario;
  el.avatar.textContent = nombre.trim().charAt(0).toUpperCase();
  el.nombre.textContent = nombre;
  el.rol.textContent = rol === 'admin' ? 'Administrador' : 'Editor';
  el.rol.className = `rol rol--${rol}`;
  el.permisos.textContent = esAdmin()
    ? 'Como administrador puedes crear, editar y eliminar recursos.'
    : 'Como editor puedes crear y editar recursos; eliminar es solo para administradores.';
}

// ---------- Renderizado ----------
function filaRecurso(recurso) {
  const bloqueado = esAdmin() ? '' : 'aria-disabled="true"';
  return `
    <tr data-id="${recurso.id}">
      <td class="tabla__recurso">
        <span class="tabla__titulo">${escaparHTML(recurso.titulo)}</span>
        <a class="tabla__url" href="${escaparHTML(urlSegura(recurso.url))}" target="_blank" rel="noopener noreferrer">${escaparHTML(recurso.url)}</a>
      </td>
      <td>
        <div class="tabla__meta nivel-${recurso.nivel}">
          <span class="insignia insignia--nivel">${recurso.nivel}</span>
          <span class="insignia">${escaparHTML(nombreDe(HABILIDADES, recurso.habilidad))}</span>
          <span class="insignia">${escaparHTML(nombreDe(TIPOS, recurso.tipo))}</span>
        </div>
      </td>
      <td class="tabla__fecha">${formatearFecha(recurso.actualizado_en)}</td>
      <td class="tabla__acciones">
        <div class="acciones">
          <button type="button" class="boton boton--secundario boton--chico" data-accion="editar">Editar<span class="sr-only"> ${escaparHTML(recurso.titulo)}</span></button>
          <button type="button" class="boton boton--peligro boton--chico" data-accion="eliminar" ${bloqueado}>Eliminar<span class="sr-only"> ${escaparHTML(recurso.titulo)}</span></button>
        </div>
      </td>
    </tr>`;
}

function recursosVisibles() {
  const texto = estado.filtro.toLowerCase();
  if (!texto) return estado.recursos;
  return estado.recursos.filter((recurso) =>
    [recurso.titulo, recurso.nivel, nombreDe(HABILIDADES, recurso.habilidad), nombreDe(TIPOS, recurso.tipo)]
      .join(' ')
      .toLowerCase()
      .includes(texto)
  );
}

function renderizarTabla() {
  const visibles = recursosVisibles();
  el.conteo.textContent = `${visibles.length} de ${estado.recursos.length} recursos`;
  el.cuerpo.innerHTML = visibles.map(filaRecurso).join('');

  el.estado.hidden = visibles.length > 0;
  if (!visibles.length) {
    el.estado.innerHTML = estado.recursos.length
      ? '<p class="estado__titulo">Sin coincidencias</p><p>Ningún recurso coincide con el filtro.</p>'
      : '<p class="estado__titulo">Aún no hay recursos</p><p>Agrega el primero con «+ Nuevo recurso».</p>';
  }
}

function renderizarIndicadores() {
  const contar = (niveles) => estado.recursos.filter((recurso) => niveles.includes(recurso.nivel)).length;
  const datos = [
    ['Total', estado.recursos.length],
    ['Básicos (A1–A2)', contar(['A1', 'A2'])],
    ['Intermedios (B1–B2)', contar(['B1', 'B2'])],
    ['Avanzados (C1–C2)', contar(['C1', 'C2'])],
  ];
  el.indicadores.innerHTML = datos
    .map(([etiqueta, valor]) => `<div class="indicador"><dt>${etiqueta}</dt><dd>${valor}</dd></div>`)
    .join('');
}

function renderizar() {
  renderizarIndicadores();
  renderizarTabla();
}

async function cargarRecursos() {
  estado.recursos = await api.listarRecursos();
  renderizar();
}

function resaltarFila(id) {
  const fila = el.cuerpo.querySelector(`tr[data-id="${id}"]`);
  if (!fila) return;
  fila.classList.add('fila--nueva');
  fila.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

// ---------- Formulario (crear / editar) ----------
function marcarError(id, mensaje = '') {
  const salida = document.getElementById(`error-${id}`);
  if (salida) salida.textContent = mensaje;
  campos[id]?.setAttribute('aria-invalid', mensaje ? 'true' : 'false');
}

function limpiarErrores() {
  Object.keys(campos).forEach((id) => marcarError(id));
  el.alertaForm.hidden = true;
}

function actualizarContador() {
  el.contador.textContent = `${campos.descripcion.value.length} / 500`;
}

function abrirFormulario(recurso = null) {
  estado.editandoId = recurso?.id ?? null;
  el.formulario.reset();
  limpiarErrores();
  el.tituloDialogo.textContent = recurso ? 'Editar recurso' : 'Nuevo recurso';
  el.guardar.textContent = recurso ? 'Guardar cambios' : 'Guardar recurso';

  if (recurso) {
    ['titulo', 'url', 'descripcion', 'nivel', 'habilidad', 'tipo'].forEach((id) => (campos[id].value = recurso[id]));
    campos.duracion_min.value = recurso.duracion_min ?? '';
    campos.requiere_cuenta.checked = recurso.requiere_cuenta;
  }
  actualizarContador();
  el.dialogo.showModal();
  campos.titulo.focus();
}

function leerFormulario() {
  return {
    titulo: campos.titulo.value.trim(),
    url: campos.url.value.trim(),
    descripcion: campos.descripcion.value.trim(),
    nivel: campos.nivel.value,
    habilidad: campos.habilidad.value,
    tipo: campos.tipo.value,
    duracion_min: campos.duracion_min.value === '' ? null : Number(campos.duracion_min.value),
    requiere_cuenta: campos.requiere_cuenta.checked,
  };
}

// Misma regla que el backend: se valida aquí para dar respuesta inmediata
function validarFormulario(datos) {
  const errores = {};
  if (datos.titulo.length < 3) errores.titulo = 'Escribe un título de al menos 3 caracteres.';
  if (!/^https?:\/\/\S+\.\S+/.test(datos.url)) errores.url = 'Escribe un enlace completo que empiece con https://';
  if (datos.descripcion.length < 10) errores.descripcion = 'La descripción necesita al menos 10 caracteres.';
  if (!datos.nivel) errores.nivel = 'Elige un nivel.';
  if (!datos.habilidad) errores.habilidad = 'Elige una habilidad.';
  if (!datos.tipo) errores.tipo = 'Elige un tipo.';
  if (datos.duracion_min !== null && (!Number.isInteger(datos.duracion_min) || datos.duracion_min < 1 || datos.duracion_min > 600))
    errores.duracion_min = 'Usa un número entero de 1 a 600.';
  return errores;
}

function mostrarErrores(errores) {
  Object.entries(errores).forEach(([id, mensaje]) => marcarError(id, mensaje));
  const primero = Object.keys(campos).find((id) => errores[id]);
  campos[primero]?.focus();
}

async function guardar(evento) {
  evento.preventDefault();
  limpiarErrores();
  const datos = leerFormulario();
  const errores = validarFormulario(datos);
  if (Object.keys(errores).length) return mostrarErrores(errores);

  el.guardar.disabled = true;
  el.guardar.classList.add('cargando');
  try {
    const guardado = estado.editandoId
      ? await api.actualizarRecurso(estado.editandoId, datos)
      : await api.crearRecurso(datos);
    el.dialogo.close();
    notificar(estado.editandoId ? `«${guardado.titulo}» se actualizó.` : `«${guardado.titulo}» se agregó al catálogo.`);
    await cargarRecursos();
    resaltarFila(guardado.id);
  } catch (error) {
    if (error.estado === 401) return salir('expirada');
    if (error.detalles) mostrarErrores(error.detalles);
    el.alertaForm.textContent = error.message;
    el.alertaForm.hidden = false;
  } finally {
    el.guardar.disabled = false;
    el.guardar.classList.remove('cargando');
  }
}

// ---------- Eliminar ----------
function pedirConfirmacion(recurso) {
  estado.eliminandoId = recurso.id;
  el.textoEliminar.textContent = `Se quitará «${recurso.titulo}» del catálogo público. Esta acción no se puede deshacer.`;
  el.dialogoEliminar.showModal();
}

async function eliminar() {
  const id = estado.eliminandoId;
  el.confirmarEliminar.disabled = true;
  try {
    const respuesta = await api.eliminarRecurso(id);
    el.dialogoEliminar.close();
    const fila = el.cuerpo.querySelector(`tr[data-id="${id}"]`);
    fila?.classList.add('fila--saliendo');
    setTimeout(() => {
      estado.recursos = estado.recursos.filter((recurso) => recurso.id !== id);
      renderizar();
    }, 300);
    notificar(respuesta.mensaje);
  } catch (error) {
    el.dialogoEliminar.close();
    atenderError(error);
  } finally {
    el.confirmarEliminar.disabled = false;
    estado.eliminandoId = null;
  }
}

// ---------- Eventos ----------
function registrarEventos() {
  el.salir.addEventListener('click', () => salir('salida'));
  el.nuevo.addEventListener('click', () => abrirFormulario());
  el.formulario.addEventListener('submit', guardar);
  campos.descripcion.addEventListener('input', actualizarContador);
  el.confirmarEliminar.addEventListener('click', eliminar);
  el.buscar.addEventListener(
    'input',
    retrasar(() => {
      estado.filtro = el.buscar.value.trim();
      renderizarTabla();
    }, 200)
  );

  // Quitar el error de un campo en cuanto el usuario lo corrige
  el.formulario.addEventListener('input', (evento) => {
    if (evento.target.getAttribute('aria-invalid') === 'true') marcarError(evento.target.id);
  });

  // Delegación: un solo listener atiende Editar y Eliminar de todas las filas
  el.cuerpo.addEventListener('click', (evento) => {
    const boton = evento.target.closest('button[data-accion]');
    if (!boton) return;
    const id = Number(boton.closest('tr').dataset.id);
    const recurso = estado.recursos.find((elemento) => elemento.id === id);
    if (!recurso) return;

    if (boton.dataset.accion === 'editar') abrirFormulario(recurso);
    if (boton.dataset.accion === 'eliminar') {
      if (!esAdmin()) return notificar('Solo un administrador puede eliminar recursos.', 'error');
      pedirConfirmacion(recurso);
    }
  });

  // Cerrar diálogos con los botones [data-cerrar] o haciendo clic fuera de ellos
  [el.dialogo, el.dialogoEliminar].forEach((dialogo) => {
    dialogo.addEventListener('click', (evento) => {
      if (evento.target === dialogo || evento.target.closest('[data-cerrar]')) dialogo.close();
    });
  });
}

// ---------- Inicio ----------
async function iniciar() {
  llenarSelect(campos.nivel, NIVELES, 'Elige…');
  llenarSelect(campos.habilidad, HABILIDADES, 'Elige…');
  llenarSelect(campos.tipo, TIPOS, 'Elige…');
  mostrarUsuario();
  registrarEventos();
  el.cuerpo.innerHTML = '<tr><td class="tabla__recurso">Cargando recursos…</td></tr>';

  try {
    // El servidor confirma que el token sigue siendo válido y devuelve los datos actuales
    estado.usuario = await api.perfil();
    mostrarUsuario();
    await cargarRecursos();
  } catch (error) {
    atenderError(error);
  }
}

if (sesionActual) iniciar();
