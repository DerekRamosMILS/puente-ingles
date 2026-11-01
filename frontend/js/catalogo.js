// Página pública: catálogo de recursos.
// Lee datos de la API (sin token) y construye las tarjetas en el DOM.
import { api, sesion } from './api.js';
import { NIVELES, HABILIDADES, TIPOS, nombreDe, llenarSelect } from './catalogos.js';
import { escaparHTML, urlSegura, retrasar, ICONOS } from './utilidades.js';

const elementos = {
  formulario: document.getElementById('filtros'),
  busqueda: document.getElementById('filtro-q'),
  habilidad: document.getElementById('filtro-habilidad'),
  tipo: document.getElementById('filtro-tipo'),
  chips: document.getElementById('chips-nivel'),
  lista: document.getElementById('lista-recursos'),
  estado: document.getElementById('estado'),
  conteo: document.getElementById('conteo-resultados'),
  total: document.getElementById('total-recursos'),
  barras: document.getElementById('barras-niveles'),
  enlaceSesion: document.getElementById('enlace-sesion'),
};

const filtros = { q: '', nivel: '', habilidad: '', tipo: '' };
let consultaActual = 0; // para ignorar respuestas viejas si el usuario filtra rápido

// ---------- Plantillas ----------
function plantillaTarjeta(recurso, indice) {
  const duracion = recurso.duracion_min ? `${recurso.duracion_min} min` : 'Libre';
  return `
    <li>
      <article class="tarjeta nivel-${recurso.nivel}" style="animation-delay:${Math.min(indice, 8) * 40}ms">
        <div class="tarjeta__etiquetas">
          <span class="insignia insignia--nivel" title="${escaparHTML(nombreDe(NIVELES, recurso.nivel))}">${recurso.nivel}</span>
          <span class="insignia">${escaparHTML(nombreDe(TIPOS, recurso.tipo))}</span>
        </div>
        <h3>${escaparHTML(recurso.titulo)}</h3>
        <p class="tarjeta__descripcion">${escaparHTML(recurso.descripcion)}</p>
        <dl class="tarjeta__datos">
          <div><dt>Habilidad:</dt><dd>${escaparHTML(nombreDe(HABILIDADES, recurso.habilidad))}</dd></div>
          <div><dt>Sesión:</dt><dd>${duracion}</dd></div>
          <div><dt>Cuenta:</dt><dd>${recurso.requiere_cuenta ? 'Gratis, con registro' : 'No hace falta'}</dd></div>
        </dl>
        <a class="tarjeta__enlace" href="${escaparHTML(urlSegura(recurso.url))}" target="_blank" rel="noopener noreferrer">
          Abrir recurso ${ICONOS.externo}<span class="sr-only">(se abre en otra pestaña)</span>
        </a>
      </article>
    </li>`;
}

function mostrarEsqueletos(cantidad = 6) {
  elementos.lista.innerHTML = '<li class="tarjeta tarjeta--esqueleto" aria-hidden="true"></li>'.repeat(cantidad);
  elementos.lista.setAttribute('aria-busy', 'true');
  elementos.estado.hidden = true;
}

function mostrarEstado({ titulo, texto, error = false, accion }) {
  elementos.lista.innerHTML = '';
  elementos.estado.hidden = false;
  elementos.estado.classList.toggle('estado--error', error);
  elementos.estado.innerHTML = `
    ${ICONOS.vacio}
    <p class="estado__titulo">${escaparHTML(titulo)}</p>
    <p>${escaparHTML(texto)}</p>
    ${accion ? `<button type="button" class="boton boton--secundario boton--chico" data-accion="${accion.id}">${accion.texto}</button>` : ''}`;
}

// ---------- Renderizado ----------
function renderizarRecursos(recursos) {
  elementos.lista.setAttribute('aria-busy', 'false');
  const hayFiltros = Object.values(filtros).some(Boolean);
  elementos.conteo.textContent = `${recursos.length} ${recursos.length === 1 ? 'recurso' : 'recursos'}${hayFiltros ? ' con estos filtros' : ''}`;

  if (recursos.length === 0) {
    mostrarEstado({
      titulo: 'Ningún recurso coincide',
      texto: 'Prueba con otro nivel, otra habilidad o una búsqueda más corta.',
      accion: { id: 'limpiar', texto: 'Quitar filtros' },
    });
    return;
  }
  elementos.estado.hidden = true;
  elementos.lista.innerHTML = recursos.map(plantillaTarjeta).join('');
}

function renderizarResumen({ total, porNivel }) {
  elementos.total.textContent = total;
  const maximo = Math.max(1, ...porNivel.map((fila) => fila.total));
  const conteoPorNivel = Object.fromEntries(porNivel.map((fila) => [fila.nivel, fila.total]));

  elementos.barras.innerHTML = NIVELES.map(({ valor }) => {
    const cantidad = conteoPorNivel[valor] ?? 0;
    return `
      <div class="barra-nivel nivel-${valor}">
        <dt>${valor}</dt>
        <dd>
          <div class="barra-nivel__pista"><div class="barra-nivel__relleno" data-ancho="${(cantidad / maximo) * 100}"></div></div>
          <span class="barra-nivel__valor">${cantidad}</span>
        </dd>
      </div>`;
  }).join('');

  // Se asigna el ancho un instante después para que la transición CSS anime las barras
  requestAnimationFrame(() => {
    elementos.barras.querySelectorAll('.barra-nivel__relleno').forEach((barra) => {
      barra.style.width = `${barra.dataset.ancho}%`;
    });
  });
}

function renderizarChips() {
  const opciones = [{ valor: '', nombre: 'Todos los niveles' }, ...NIVELES];
  elementos.chips.innerHTML = opciones
    .map(
      ({ valor, nombre }) =>
        `<button type="button" class="chip" data-nivel="${valor}" aria-pressed="${filtros.nivel === valor}" title="${nombre}">${valor || 'Todos'}</button>`
    )
    .join('');
}

// ---------- Datos ----------
async function cargarRecursos() {
  const numero = ++consultaActual;
  mostrarEsqueletos();
  try {
    const recursos = await api.listarRecursos(filtros);
    if (numero === consultaActual) renderizarRecursos(recursos);
  } catch (error) {
    if (numero !== consultaActual) return;
    elementos.conteo.textContent = '';
    mostrarEstado({
      titulo: 'No pudimos cargar el catálogo',
      texto: error.message,
      error: true,
      accion: { id: 'reintentar', texto: 'Reintentar' },
    });
  }
}

async function cargarResumen() {
  try {
    renderizarResumen(await api.estadisticas());
  } catch {
    elementos.total.textContent = '–';
  }
}

// Mantiene los filtros en la URL (?nivel=B1&habilidad=escucha) para poder compartirlos
function sincronizarUrl() {
  const parametros = new URLSearchParams(Object.entries(filtros).filter(([, valor]) => valor));
  const consulta = parametros.toString();
  history.replaceState(null, '', consulta ? `?${consulta}` : location.pathname);
}

function aplicarFiltros() {
  sincronizarUrl();
  cargarRecursos();
}

function leerFiltrosDeUrl() {
  const parametros = new URLSearchParams(location.search);
  filtros.q = parametros.get('q') ?? '';
  filtros.nivel = NIVELES.some((n) => n.valor === parametros.get('nivel')) ? parametros.get('nivel') : '';
  filtros.habilidad = HABILIDADES.some((h) => h.valor === parametros.get('habilidad')) ? parametros.get('habilidad') : '';
  filtros.tipo = TIPOS.some((t) => t.valor === parametros.get('tipo')) ? parametros.get('tipo') : '';
  elementos.busqueda.value = filtros.q;
  elementos.habilidad.value = filtros.habilidad;
  elementos.tipo.value = filtros.tipo;
}

function limpiarFiltros() {
  Object.keys(filtros).forEach((clave) => (filtros[clave] = ''));
  elementos.formulario.reset();
  renderizarChips();
  aplicarFiltros();
}

// ---------- Eventos ----------
function registrarEventos() {
  const buscarConRetraso = retrasar(() => aplicarFiltros(), 300);
  elementos.busqueda.addEventListener('input', () => {
    filtros.q = elementos.busqueda.value.trim();
    buscarConRetraso();
  });

  elementos.formulario.addEventListener('change', (evento) => {
    if (evento.target === elementos.habilidad || evento.target === elementos.tipo) {
      filtros[evento.target.name] = evento.target.value;
      aplicarFiltros();
    }
  });

  elementos.formulario.addEventListener('submit', (evento) => evento.preventDefault());
  elementos.formulario.addEventListener('reset', (evento) => {
    evento.preventDefault();
    limpiarFiltros();
  });

  // Delegación de eventos: un solo listener para todos los chips
  elementos.chips.addEventListener('click', (evento) => {
    const chip = evento.target.closest('.chip');
    if (!chip) return;
    filtros.nivel = chip.dataset.nivel;
    elementos.chips.querySelectorAll('.chip').forEach((boton) => {
      boton.setAttribute('aria-pressed', String(boton === chip));
    });
    aplicarFiltros();
  });

  elementos.estado.addEventListener('click', (evento) => {
    const accion = evento.target.closest('[data-accion]')?.dataset.accion;
    if (accion === 'limpiar') limpiarFiltros();
    if (accion === 'reintentar') {
      cargarRecursos();
      cargarResumen();
    }
  });
}

function actualizarEnlaceSesion() {
  const actual = sesion.obtener();
  if (!actual) return;
  elementos.enlaceSesion.textContent = `Ir al panel · ${actual.usuario.nombre.split(' ')[0]}`;
  elementos.enlaceSesion.href = 'panel.html';
}

// ---------- Inicio ----------
llenarSelect(elementos.habilidad, HABILIDADES, 'Todas');
llenarSelect(elementos.tipo, TIPOS, 'Todos');
leerFiltrosDeUrl();
renderizarChips();
registrarEventos();
actualizarEnlaceSesion();
cargarResumen();
cargarRecursos();
