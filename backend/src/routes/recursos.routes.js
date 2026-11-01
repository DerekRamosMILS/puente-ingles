// Rutas del CRUD de recursos → /api/recursos
// Lectura: pública.  Crear y editar: admin o editor.  Eliminar: solo admin.
import { Router } from 'express';
import {
  listarRecursos,
  obtenerRecurso,
  obtenerEstadisticas,
  crearRecurso,
  actualizarRecurso,
  eliminarRecurso,
} from '../controllers/recursos.controller.js';
import { verificarToken, permitirRoles } from '../middleware/auth.middleware.js';
import { validarFiltros, validarId, validarRecurso } from '../middleware/validacion.middleware.js';

const router = Router();
const puedeEditar = [verificarToken, permitirRoles('admin', 'editor')];
const soloAdmin = [verificarToken, permitirRoles('admin')];

router.get('/', validarFiltros, listarRecursos);
router.get('/estadisticas', obtenerEstadisticas);
router.get('/:id', validarId, obtenerRecurso);
router.post('/', ...puedeEditar, validarRecurso, crearRecurso);
router.put('/:id', ...puedeEditar, validarId, validarRecurso, actualizarRecurso);
router.delete('/:id', ...soloAdmin, validarId, eliminarRecurso);

export default router;
