import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import pool from '../db/pool.js'
import { AppError } from '../utils/errors.js'
import { blockingStatuses, isValidDate, parsePositiveId, validateLaboratory, validateRequester, validateReservation } from '../utils/validation.js'
import { authenticate, issueToken, requireRole } from '../middlewares/auth.js'
import { createAccount, validateAccountCredentials, validateLoginCredentials, verifyPassword } from '../services/accounts.js'

const router = Router()
const authenticationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: { message: 'Demasiados intentos. Espera unos minutos antes de volver a intentarlo.' } },
})
const reservationSelect = `
  SELECT r.id, r.laboratorio_id, r.solicitante_id, r.usuario_id, DATE_FORMAT(r.fecha, '%Y-%m-%d') AS fecha,
    TIME_FORMAT(r.hora_inicio, '%H:%i:%s') AS hora_inicio,
    TIME_FORMAT(r.hora_fin, '%H:%i:%s') AS hora_fin, r.motivo, r.estado, r.observaciones,
    r.created_at, r.updated_at, l.codigo AS laboratorio_codigo, l.nombre AS laboratorio_nombre,
    s.nombres, s.apellidos, CONCAT(s.nombres, ' ', s.apellidos) AS solicitante_nombre, s.correo
  FROM reservas r
  INNER JOIN laboratorios l ON l.id = r.laboratorio_id
  INNER JOIN solicitantes s ON s.id = r.solicitante_id`

router.get('/health', async (_request, response, next) => {
  try {
    await pool.query('SELECT 1')
    response.json({ data: { status: 'ok', database: 'connected', timezone: 'America/Lima' } })
  } catch (error) { next(error) }
})

router.post('/auth/register', authenticationLimiter, async (request, response, next) => {
  try {
    const account = validateAccountCredentials(request.body)
    const user = await createAccount(account)
    response.status(201).json({ data: { token: issueToken(user), user } })
  } catch (error) { next(error) }
})

router.post('/auth/login', authenticationLimiter, async (request, response, next) => {
  try {
    const credentials = validateLoginCredentials(request.body)
    const [rows] = await pool.execute(
      `SELECT id, nombres, apellidos, correo, password_hash, role
       FROM usuarios WHERE correo = ? AND activo = 1 LIMIT 1`,
      [credentials.correo],
    )
    if (!rows.length || !await verifyPassword(credentials.password, rows[0].password_hash)) {
      throw new AppError('Correo o contraseña incorrectos.', 401)
    }
    const user = {
      id: rows[0].id,
      nombres: rows[0].nombres,
      apellidos: rows[0].apellidos,
      correo: rows[0].correo,
      role: rows[0].role,
    }
    response.json({ data: { token: issueToken(user), user } })
  } catch (error) { next(error) }
})

router.use(authenticate)

router.get('/auth/me', (request, response) => {
  response.json({ data: { user: request.user } })
})

router.get('/laboratorios', async (_request, response, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, codigo, nombre, ubicacion, capacidad, descripcion, equipamiento, estado FROM laboratorios ORDER BY codigo',
    )
    response.json({ data: rows })
  } catch (error) { next(error) }
})

router.get('/solicitantes', async (request, response, next) => {
  try {
    const search = typeof request.query.buscar === 'string' ? `%${request.query.buscar.trim()}%` : '%%'
    const [rows] = await pool.execute(
      `SELECT id, nombres, apellidos, correo, tipo_solicitante
       FROM solicitantes
       WHERE CONCAT(nombres, ' ', apellidos, ' ', correo) LIKE ?
       ORDER BY apellidos, nombres`,
      [search],
    )
    response.json({ data: rows })
  } catch (error) { next(error) }
})

router.post('/solicitantes', async (request, response, next) => {
  try {
    const requester = validateRequester(request.body)
    const [result] = await pool.execute(
      'INSERT INTO solicitantes (nombres, apellidos, correo, tipo_solicitante) VALUES (?, ?, ?, ?)',
      [requester.nombres, requester.apellidos, requester.correo, requester.tipo_solicitante],
    )
    response.status(201).json({ data: { id: result.insertId, ...requester } })
  } catch (error) { next(error) }
})

router.post('/laboratorios', requireRole('admin'), async (request, response, next) => {
  try {
    const laboratory = validateLaboratory(request.body)
    const [result] = await pool.execute(
      `INSERT INTO laboratorios (codigo, nombre, ubicacion, capacidad, descripcion, equipamiento, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [laboratory.codigo, laboratory.nombre, laboratory.ubicacion, laboratory.capacidad,
        laboratory.descripcion, laboratory.equipamiento, laboratory.estado],
    )
    response.status(201).json({ data: { id: result.insertId, ...laboratory } })
  } catch (error) { next(error) }
})

router.get('/reservas', async (request, response, next) => {
  try {
    const filters = []
    const values = []
    if (typeof request.query.estado === 'string') {
      if (!['pendiente', 'confirmada', 'cancelada'].includes(request.query.estado)) throw new AppError('El filtro de estado no es válido.', 400)
      filters.push('r.estado = ?')
      values.push(request.query.estado)
    }
    if (typeof request.query.fecha === 'string') {
      if (!isValidDate(request.query.fecha)) throw new AppError('La fecha del filtro no es válida.', 400)
      filters.push('r.fecha = ?')
      values.push(request.query.fecha)
    }
    if (typeof request.query.buscar === 'string' && request.query.buscar.trim()) {
      const term = `%${request.query.buscar.trim()}%`
      filters.push('(r.motivo LIKE ? OR l.nombre LIKE ? OR s.nombres LIKE ? OR s.apellidos LIKE ?)')
      values.push(term, term, term, term)
    }
    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : ''
    const [rows] = await pool.execute(`${reservationSelect} ${where} ORDER BY r.fecha DESC, r.hora_inicio DESC`, values)
    response.json({ data: rows })
  } catch (error) { next(error) }
})

router.get('/reservas/:id', async (request, response, next) => {
  try {
    const id = parsePositiveId(request.params.id, 'Reserva')
    const [rows] = await pool.execute(`${reservationSelect} WHERE r.id = ? LIMIT 1`, [id])
    if (!rows.length) throw new AppError('La reserva solicitada no existe.', 404)
    response.json({ data: rows[0] })
  } catch (error) { next(error) }
})

async function ensureRelatedRecords(connection, reservation) {
  const [laboratories] = await connection.execute(
    'SELECT id, estado FROM laboratorios WHERE id = ? FOR UPDATE',
    [reservation.laboratorio_id],
  )
  if (!laboratories.length) throw new AppError('El laboratorio seleccionado no existe.', 400)
  if (laboratories[0].estado !== 'activo') throw new AppError('El laboratorio seleccionado no está activo.', 400)
  const [requesters] = await connection.execute('SELECT id FROM solicitantes WHERE id = ?', [reservation.solicitante_id])
  if (!requesters.length) throw new AppError('El solicitante seleccionado no existe.', 400)
}

async function ensureAvailable(connection, reservation, excludeId = null) {
  const statusMarks = blockingStatuses.map(() => '?').join(', ')
  const parameters = [
    reservation.laboratorio_id, reservation.fecha,
    ...blockingStatuses, reservation.hora_fin, reservation.hora_inicio,
  ]
  const excluded = excludeId === null ? '' : ' AND id <> ?'
  if (excludeId !== null) parameters.push(excludeId)
  const [conflicts] = await connection.execute(
    `SELECT id FROM reservas
     WHERE laboratorio_id = ? AND fecha = ? AND estado IN (${statusMarks})
       AND hora_inicio < ? AND hora_fin > ?${excluded}
     LIMIT 1`,
    parameters,
  )
  if (conflicts.length) {
    throw new AppError('El laboratorio seleccionado ya cuenta con una reserva en el horario indicado. Seleccione otro horario disponible.', 409)
  }
}

async function getReservation(connection, id) {
  const [rows] = await connection.execute(`${reservationSelect} WHERE r.id = ? LIMIT 1`, [id])
  return rows[0]
}

async function rollbackAndForward(connection, error, next) {
  if (connection) {
    try {
      await connection.rollback()
    } catch (rollbackError) {
      console.error('No se pudo revertir la transacción:', rollbackError.message)
    }
  }
  next(error)
}

router.post('/reservas', async (request, response, next) => {
  let connection
  try {
    connection = await pool.getConnection()
    const reservation = validateReservation(request.body)
    if (request.user.role !== 'admin') reservation.estado = 'pendiente'
    await connection.beginTransaction()
    await ensureRelatedRecords(connection, reservation)
    if (blockingStatuses.includes(reservation.estado)) await ensureAvailable(connection, reservation)
    const [result] = await connection.execute(
      `INSERT INTO reservas
       (laboratorio_id, solicitante_id, usuario_id, fecha, hora_inicio, hora_fin, motivo, estado, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [reservation.laboratorio_id, reservation.solicitante_id, request.user.id, reservation.fecha, reservation.hora_inicio,
        reservation.hora_fin, reservation.motivo, reservation.estado, reservation.observaciones],
    )
    const created = await getReservation(connection, result.insertId)
    await connection.commit()
    response.status(201).json({ data: created })
  } catch (error) {
    await rollbackAndForward(connection, error, next)
  } finally { connection?.release() }
})

router.put('/reservas/:id', requireRole('admin'), async (request, response, next) => {
  let connection
  try {
    connection = await pool.getConnection()
    const id = parsePositiveId(request.params.id, 'Reserva')
    const reservation = validateReservation(request.body)
    await connection.beginTransaction()
    const [current] = await connection.execute('SELECT id FROM reservas WHERE id = ? FOR UPDATE', [id])
    if (!current.length) throw new AppError('La reserva solicitada no existe.', 404)
    await ensureRelatedRecords(connection, reservation)
    if (blockingStatuses.includes(reservation.estado)) await ensureAvailable(connection, reservation, id)
    await connection.execute(
      `UPDATE reservas SET laboratorio_id = ?, solicitante_id = ?, fecha = ?, hora_inicio = ?,
       hora_fin = ?, motivo = ?, estado = ?, observaciones = ? WHERE id = ?`,
      [reservation.laboratorio_id, reservation.solicitante_id, reservation.fecha, reservation.hora_inicio,
        reservation.hora_fin, reservation.motivo, reservation.estado, reservation.observaciones, id],
    )
    const updated = await getReservation(connection, id)
    await connection.commit()
    response.json({ data: updated })
  } catch (error) {
    await rollbackAndForward(connection, error, next)
  } finally { connection?.release() }
})

router.delete('/reservas/:id', requireRole('admin'), async (request, response, next) => {
  try {
    const id = parsePositiveId(request.params.id, 'Reserva')
    const [result] = await pool.execute('DELETE FROM reservas WHERE id = ?', [id])
    if (!result.affectedRows) {
      throw new AppError('La reserva solicitada no existe.', 404)
    }
    response.status(204).end()
  } catch (error) { next(error) }
})

router.get('/disponibilidad', async (request, response, next) => {
  try {
    const date = request.query.fecha
    if (!isValidDate(date)) throw new AppError('Indica una fecha válida con formato AAAA-MM-DD.', 400)
    const [laboratories] = await pool.execute(
      `SELECT id, codigo, nombre, ubicacion FROM laboratorios WHERE estado = 'activo' ORDER BY codigo`,
    )
    const [reservations] = await pool.execute(
      `${reservationSelect} WHERE r.fecha = ? AND r.estado IN (?, ?) ORDER BY r.hora_inicio`,
      [date, ...blockingStatuses],
    )
    const data = laboratories.map((laboratory) => ({
      ...laboratory,
      reservas: reservations.filter((reservation) => reservation.laboratorio_id === laboratory.id),
    }))
    response.json({ data: { fecha: date, laboratorios: data } })
  } catch (error) { next(error) }
})

router.get('/dashboard', async (_request, response, next) => {
  try {
    const [[laboratories]] = await pool.execute("SELECT COUNT(*) AS total FROM laboratorios WHERE estado = 'activo'")
    const [[today]] = await pool.execute(
      "SELECT COUNT(*) AS total FROM reservas WHERE fecha = CURDATE() AND estado <> 'cancelada'",
    )
    const [[pending]] = await pool.execute("SELECT COUNT(*) AS total FROM reservas WHERE estado = 'pendiente'")
    const [[confirmed]] = await pool.execute("SELECT COUNT(*) AS total FROM reservas WHERE estado = 'confirmada'")
    const [upcoming] = await pool.execute(
      `${reservationSelect} WHERE r.fecha >= CURDATE() AND r.estado <> 'cancelada'
       ORDER BY r.fecha, r.hora_inicio LIMIT 5`,
    )
    response.json({ data: {
      stats: { laboratorios: laboratories.total, hoy: today.total, pendientes: pending.total, confirmadas: confirmed.total },
      proximas: upcoming,
    } })
  } catch (error) { next(error) }
})

export default router
