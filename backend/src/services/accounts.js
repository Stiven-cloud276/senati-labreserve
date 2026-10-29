import bcrypt from 'bcryptjs'
import pool from '../db/pool.js'
import { AppError } from '../utils/errors.js'

function ensureObject(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new AppError('El cuerpo de la solicitud debe ser un objeto JSON.', 400)
  }
}

function validatePassword(password) {
  if (typeof password !== 'string' || password.length < 12) {
    throw new AppError('La contraseña debe tener al menos 12 caracteres.', 400)
  }
  if (Buffer.byteLength(password, 'utf8') > 72) {
    throw new AppError('La contraseña no puede superar 72 bytes UTF-8.', 400)
  }
}

function validateEmail(value) {
  if (typeof value !== 'string') throw new AppError('El correo no tiene un formato válido.', 400)
  const correo = value.trim().toLowerCase()
  if (correo.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    throw new AppError('El correo no tiene un formato válido.', 400)
  }
  return correo
}

function validateName(value, label) {
  if (typeof value !== 'string' || value.trim().length < 2 || value.trim().length > 80) {
    throw new AppError(`${label} debe tener entre 2 y 80 caracteres.`, 400)
  }
  return value.trim()
}

export function validateAccountCredentials(body) {
  ensureObject(body)
  const nombres = validateName(body.nombres, 'Los nombres')
  const apellidos = validateName(body.apellidos, 'Los apellidos')
  const correo = validateEmail(body.correo)
  validatePassword(body.password)
  return { nombres, apellidos, correo, password: body.password }
}

export function validateLoginCredentials(body) {
  ensureObject(body)
  const correo = validateEmail(body.correo)
  if (typeof body.password !== 'string' || body.password.length === 0) {
    throw new AppError('Ingresa tu contraseña.', 400)
  }
  return { correo, password: body.password }
}

export async function createAccount(account) {
  const password_hash = await bcrypt.hash(account.password, 12)
  const [result] = await pool.execute(
    `INSERT INTO usuarios (nombres, apellidos, correo, password_hash, role)
     VALUES (?, ?, ?, ?, 'usuario')`,
    [account.nombres, account.apellidos, account.correo, password_hash],
  )
  return {
    id: result.insertId,
    nombres: account.nombres,
    apellidos: account.apellidos,
    correo: account.correo,
    role: 'usuario',
  }
}

export function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash)
}
