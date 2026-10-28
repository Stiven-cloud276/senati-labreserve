import { createHash, timingSafeEqual } from 'node:crypto'
import { AppError } from '../utils/errors.js'

export function writeAccess(request, _response, next) {
  const requiredKey = process.env.API_WRITE_KEY
  if (process.env.NODE_ENV !== 'production' && !requiredKey) return next()
  if (!requiredKey) return next(new AppError('La API no tiene configurada la clave de escritura.', 503))

  const providedKey = request.get('x-api-key') || ''
  const expectedHash = createHash('sha256').update(requiredKey).digest()
  const providedHash = createHash('sha256').update(providedKey).digest()
  if (!timingSafeEqual(expectedHash, providedHash)) {
    return next(new AppError('Se requiere una clave de acceso válida para modificar información.', 401))
  }
  return next()
}
