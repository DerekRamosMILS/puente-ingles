// Rutas de autenticación → /api/auth
import { Router } from 'express';
import { iniciarSesion, obtenerPerfil, registrarUsuario } from '../controllers/auth.controller.js';
import { verificarToken, permitirRoles, limitarIntentos } from '../middleware/auth.middleware.js';
import { validarLogin, validarRegistro } from '../middleware/validacion.middleware.js';

const router = Router();

router.post('/login', limitarIntentos(), validarLogin, iniciarSesion);
router.get('/perfil', verificarToken, obtenerPerfil);
router.post('/registro', verificarToken, permitirRoles('admin'), validarRegistro, registrarUsuario);

export default router;
