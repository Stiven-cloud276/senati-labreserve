import jwt from 'jsonwebtoken'
import { AppError } from '../utils/errors.js'

function tokenSecret() {
  const secret = process.env.AUTH_TOKEN_SECRET
  if (!secret || secret.length < 32) throw new AppError('La autenticación no está configurada correctamente.', 503)
  return secret
}

export function issueToken(user) {
  return jwt.sign(
    { role: user.role, correo: user.correo },
    tokenSecret(),
    { subject: String(user.id), expiresIn: '2h', issuer: 'senati-labreserve' },
  )
}

export function authenticate(request, _response, next) {
  const authorization = request.get('authorization') || ''
  const [scheme, token] = authorization.split(' ')
  if (scheme !== 'Bearer' || !token) {
    return next(new AppError('Inicia sesión para continuar.', 401))
  }

  try {
    const payload = jwt.verify(token, tokenSecret(), {
      algorithms: ['HS256'],
      issuer: 'senati-labreserve',
    })
    if (!payload || typeof payload !== 'object') {
      return next(new AppError('La sesión venció o no es válida. Inicia sesión nuevamente.', 401))
    }

    const id = Number(payload.sub)
    if (
      !Number.isSafeInteger(id)
      || id < 1
      || typeof payload.correo !== 'string'
      || !['admin', 'usuario'].includes(payload.role)
    ) {
      return next(new AppError('La sesión venció o no es válida. Inicia sesión nuevamente.', 401))
    }
    request.user = {
      id,
      correo: payload.correo,
      role: payload.role,
    }
    return next()
  } catch (error) {
    if (error instanceof AppError) return next(error)
    return next(new AppError('La sesión venció o no es válida. Inicia sesión nuevamente.', 401))
  }
}

export function requireRole(role) {
  return (request, _response, next) => {
    if (request.user?.role !== role) {
      return next(new AppError('No tienes permisos para realizar esta acción.', 403))
    }
    return next()
  }
}
