import { AppError } from './errors.js'

export const blockingStatuses = ['pendiente', 'confirmada']
const allowedStatuses = [...blockingStatuses, 'cancelada']

export function parsePositiveId(value, label = 'Identificador') {
  const id = Number(value)
  if (!Number.isSafeInteger(id) || id <= 0) throw new AppError(`${label} no válido.`, 400)
  return id
}

export function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  if (year < 1000) return false
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

function isValidTime(value) {
  return typeof value === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value)
}

function requiredText(value, label, maxLength) {
  if (typeof value !== 'string' || value.trim().length === 0) throw new AppError(`${label} es obligatorio.`, 400)
  if (value.trim().length > maxLength) throw new AppError(`${label} no puede superar ${maxLength} caracteres.`, 400)
  return value.trim()
}

export function validateReservation(body = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new AppError('El cuerpo de la reserva debe ser un objeto JSON.', 400)
  const laboratorio_id = parsePositiveId(body.laboratorio_id, 'Laboratorio')
  const solicitante_id = parsePositiveId(body.solicitante_id, 'Solicitante')
  if (!isValidDate(body.fecha)) throw new AppError('La fecha debe ser válida y usar el formato AAAA-MM-DD.', 400)
  if (!isValidTime(body.hora_inicio) || !isValidTime(body.hora_fin)) throw new AppError('Indica horarios válidos en formato de 24 horas.', 400)

  const hora_inicio = body.hora_inicio.length === 5 ? `${body.hora_inicio}:00` : body.hora_inicio
  const hora_fin = body.hora_fin.length === 5 ? `${body.hora_fin}:00` : body.hora_fin
  if (hora_fin <= hora_inicio) throw new AppError('La hora final debe ser posterior a la hora inicial.', 400)
  if (!allowedStatuses.includes(body.estado)) throw new AppError('El estado debe ser pendiente, confirmada o cancelada.', 400)

  const motivo = requiredText(body.motivo, 'El motivo', 180)
  if (motivo.length < 4) throw new AppError('El motivo debe tener al menos 4 caracteres.', 400)
  const observaciones = body.observaciones == null ? '' : body.observaciones
  if (typeof observaciones !== 'string' || observaciones.length > 500) throw new AppError('Las observaciones no pueden superar 500 caracteres.', 400)

  return { laboratorio_id, solicitante_id, fecha: body.fecha, hora_inicio, hora_fin, motivo, estado: body.estado, observaciones: observaciones.trim() }
}

export function validateRequester(body = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new AppError('El cuerpo del solicitante debe ser un objeto JSON.', 400)
  const nombres = requiredText(body.nombres, 'Los nombres', 80)
  const apellidos = requiredText(body.apellidos, 'Los apellidos', 80)
  const correo = requiredText(body.correo, 'El correo', 160).toLowerCase()
  const tipo_solicitante = body.tipo_solicitante
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) throw new AppError('El correo no tiene un formato válido.', 400)
  if (!['instructor', 'personal', 'otro'].includes(tipo_solicitante)) throw new AppError('El tipo de solicitante no es válido.', 400)
  if (nombres.length < 2 || apellidos.length < 2) throw new AppError('Los nombres y apellidos deben tener al menos 2 caracteres.', 400)
  return { nombres, apellidos, correo, tipo_solicitante }
}

export function validateLaboratory(body = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new AppError('El cuerpo del laboratorio debe ser un objeto JSON.', 400)
  }
  const codigo = requiredText(body.codigo, 'El código', 20).toUpperCase()
  const nombre = requiredText(body.nombre, 'El nombre', 100)
  const ubicacion = requiredText(body.ubicacion, 'La ubicación', 120)
  const capacidad = Number(body.capacidad)
  if (!Number.isSafeInteger(capacidad) || capacidad <= 0 || capacidad > 65535) {
    throw new AppError('La capacidad debe ser un número entero positivo menor a 65536.', 400)
  }
  const descripcion = body.descripcion == null ? '' : body.descripcion
  const equipamiento = body.equipamiento == null ? '' : body.equipamiento
  if (typeof descripcion !== 'string' || descripcion.length > 500) {
    throw new AppError('La descripción no puede superar 500 caracteres.', 400)
  }
  if (typeof equipamiento !== 'string' || equipamiento.length > 500) {
    throw new AppError('El equipamiento no puede superar 500 caracteres.', 400)
  }
  if (!['activo', 'inactivo'].includes(body.estado)) {
    throw new AppError('El estado debe ser activo o inactivo.', 400)
  }
  return { codigo, nombre, ubicacion, capacidad, descripcion: descripcion.trim(), equipamiento: equipamiento.trim(), estado: body.estado }
}

export function hasTimeConflict(start, end, existingReservations) {
  return existingReservations.some((reservation) => (
    start < reservation.hora_fin && end > reservation.hora_inicio
  ))
}
