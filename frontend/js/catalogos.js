// Etiquetas legibles para los valores que guarda la base de datos.
export const NIVELES = [
  { valor: 'A1', nombre: 'A1 · Principiante' },
  { valor: 'A2', nombre: 'A2 · Básico' },
  { valor: 'B1', nombre: 'B1 · Intermedio' },
  { valor: 'B2', nombre: 'B2 · Intermedio alto' },
  { valor: 'C1', nombre: 'C1 · Avanzado' },
  { valor: 'C2', nombre: 'C2 · Dominio' },
];

export const HABILIDADES = [
  { valor: 'escucha', nombre: 'Comprensión auditiva' },
  { valor: 'lectura', nombre: 'Lectura' },
  { valor: 'escritura', nombre: 'Escritura' },
  { valor: 'conversacion', nombre: 'Conversación' },
  { valor: 'gramatica', nombre: 'Gramática' },
  { valor: 'vocabulario', nombre: 'Vocabulario' },
];

export const TIPOS = [
  { valor: 'curso', nombre: 'Curso' },
  { valor: 'video', nombre: 'Video' },
  { valor: 'podcast', nombre: 'Podcast' },
  { valor: 'lectura', nombre: 'Lectura' },
  { valor: 'ejercicios', nombre: 'Ejercicios' },
  { valor: 'app', nombre: 'App' },
  { valor: 'herramienta', nombre: 'Herramienta' },
];

export const nombreDe = (lista, valor) => lista.find((elemento) => elemento.valor === valor)?.nombre ?? valor;

// Llena un <select> con opciones; "primera" es la opción vacía inicial
export function llenarSelect(select, lista, primera) {
  const opciones = lista.map(({ valor, nombre }) => `<option value="${valor}">${nombre}</option>`).join('');
  select.innerHTML = (primera ? `<option value="">${primera}</option>` : '') + opciones;
}
