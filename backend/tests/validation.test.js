import test from 'node:test'
import assert from 'node:assert/strict'
import { hasTimeConflict, isValidDate, validateReservation } from '../src/utils/validation.js'

const validReservation = {
  laboratorio_id: 1,
  solicitante_id: 2,
  fecha: '2026-10-28',
  hora_inicio: '09:00',
  hora_fin: '10:00',
  motivo: 'Práctica de desarrollo',
  estado: 'pendiente',
}

test('accepts a complete valid reservation and normalizes its times', () => {
  assert.deepEqual(validateReservation(validReservation), {
    ...validReservation,
    hora_inicio: '09:00:00',
    hora_fin: '10:00:00',
    observaciones: '',
  })
})

test('rejects invalid calendar dates and non-positive durations', () => {
  assert.equal(isValidDate('2026-02-29'), false)
  assert.throws(() => validateReservation({ ...validReservation, fecha: '2026-02-29' }), /fecha debe ser válida/)
  assert.throws(() => validateReservation({ ...validReservation, hora_fin: '09:00' }), /posterior/)
  assert.throws(() => validateReservation(null), /objeto JSON/)
})

test('detects partial overlaps but allows adjacent reservations', () => {
  const existing = [{ hora_inicio: '09:00:00', hora_fin: '10:00:00' }]
  assert.equal(hasTimeConflict('09:30:00', '10:30:00', existing), true)
  assert.equal(hasTimeConflict('10:00:00', '11:00:00', existing), false)
  assert.equal(hasTimeConflict('08:00:00', '09:00:00', existing), false)
})
