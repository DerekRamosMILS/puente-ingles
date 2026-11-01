// Controlador de autenticación: login, perfil y alta de usuarios.
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { Usuario } from '../models/usuario.model.js';
import { ErrorApi } from '../utils/ErrorApi.js';

// Hash de relleno: si el correo no existe se compara igual contra algo,
// así la respuesta tarda lo mismo y no revela qué correos están registrados.
const HASH_DE_RELLENO = bcrypt.hashSync('contraseña-de-relleno', 10);

function generarToken(usuario) {
  return jwt.sign({ nombre: usuario.nombre, rol: usuario.rol }, config.jwt.secreto, {
    subject: String(usuario.id),
    expiresIn: config.jwt.expiraEn,
    issuer: config.jwt.emisor,
    algorithm: 'HS256',
  });
}

const sinHash = ({ password_hash, ...usuario }) => usuario;

// POST /api/auth/login  (público)
export async function iniciarSesion(req, res) {
  const { correo, password } = req.datosValidados;
  const usuario = await Usuario.buscarPorCorreo(correo);
  const coincide = await bcrypt.compare(password, usuario?.password_hash ?? HASH_DE_RELLENO);

  if (!usuario || !coincide) throw ErrorApi.noAutorizado('Correo o contraseña incorrectos.');

  res.json({
    ok: true,
    datos: {
      token: generarToken(usuario),
      tipo: 'Bearer',
      expiraEn: config.jwt.expiraEn,
      usuario: sinHash(usuario),
    },
  });
}

// GET /api/auth/perfil  (requiere token)
export async function obtenerPerfil(req, res) {
  const usuario = await Usuario.buscarPorId(req.usuario.id);
  if (!usuario) throw ErrorApi.noAutorizado('El usuario de este token ya no existe.');
  res.json({ ok: true, datos: usuario });
}

// POST /api/auth/registro  (solo admin)
export async function registrarUsuario(req, res) {
  const { nombre, correo, password, rol } = req.datosValidados;
  if (await Usuario.buscarPorCorreo(correo)) throw ErrorApi.conflicto('Ya existe un usuario con ese correo.');

  const passwordHash = await bcrypt.hash(password, 10);
  const usuario = await Usuario.crear({ nombre, correo, passwordHash, rol });
  res.status(201).json({ ok: true, mensaje: 'Usuario creado.', datos: usuario });
}
