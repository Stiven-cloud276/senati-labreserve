import test from 'node:test'
import assert from 'node:assert/strict'
import { demoStorageKey, demoStore } from '../src/services/demoStore.js'

const values = new Map()
globalThis.localStorage = {
  getItem(key) {
    return values.get(key) ?? null
  },
  setItem(key, value) {
    values.set(key, value)
  },
  removeItem(key) {
    values.delete(key)
  },
}

function nextDay() {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function validReservation(overrides = {}) {
  return {
    laboratorio_id: 1,
    solicitante_id: 3,
    fecha: nextDay(),
    hora_inicio: '14:00',
    hora_fin: '15:00',
    motivo: 'Práctica de demostración',
    estado: 'pendiente',
    observaciones: '',
    ...overrides,
  }
}

test.beforeEach(() => {
  demoStore.clear()
})

test('seeds fictitious records and preserves changes across reads', () => {
  const laboratories = demoStore.laboratories()
  assert.equal(laboratories.length, 3)
  assert.equal(demoStore.reservations().length, 2)

  const created = demoStore.createLaboratory({
    codigo: 'lab-04',
    nombre: 'Laboratorio de Prueba',
    ubicacion: 'Pabellón C',
    capacidad: 18,
    descripcion: '',
    equipamiento: '',
    estado: 'activo',
  })

  assert.equal(created.codigo, 'LAB-04')
  assert.equal(demoStore.laboratories().length, 4)
  assert.ok(values.has(demoStorageKey))
})

test('creates, updates and deletes reservations while detecting overlaps', () => {
  const created = demoStore.createReservation(validReservation())
  assert.equal(created.laboratorio_nombre, 'Laboratorio de Desarrollo')

  assert.throws(
    () => demoStore.createReservation(validReservation({ hora_inicio: '14:30', hora_fin: '15:30' })),
    /ya cuenta con una reserva/,
  )

  const updated = demoStore.updateReservation(created.id, validReservation({
    hora_inicio: '15:00',
    hora_fin: '16:00',
    estado: 'confirmada',
  }))
  assert.equal(updated.estado, 'confirmada')
  assert.equal(demoStore.reservation(created.id).hora_inicio, '15:00:00')

  demoStore.deleteReservation(created.id)
  assert.throws(() => demoStore.reservation(created.id), /no existe/)
})

test('returns availability and dashboard values from persisted demo data', () => {
  const date = nextDay()
  const availability = demoStore.availability(date)
  const labOne = availability.laboratorios.find((laboratory) => laboratory.id === 1)
  assert.equal(labOne.reservas.length, 1)

  const dashboard = demoStore.dashboard()
  assert.equal(dashboard.stats.laboratorios, 3)
  assert.equal(dashboard.stats.confirmadas, 1)
})
