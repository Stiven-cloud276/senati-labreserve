const storageKey = 'senati-labreserve-demo-v1'
const blockingStatuses = ['pendiente', 'confirmada']

function localDateOffset(days) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function createInitialState() {
  const tomorrow = localDateOffset(1)
  const now = new Date().toISOString()
  return {
    nextIds: { laboratorios: 4, solicitantes: 4, reservas: 3 },
    laboratorios: [
      {
        id: 1,
        codigo: 'LAB-01',
        nombre: 'Laboratorio de Desarrollo',
        ubicacion: 'Pabellón A · segundo nivel',
        capacidad: 28,
        descripcion: 'Espacio para prácticas de programación, desarrollo web y proyectos de software.',
        equipamiento: 'Computadoras, proyector, pizarra y red cableada',
        estado: 'activo',
      },
      {
        id: 2,
        codigo: 'LAB-02',
        nombre: 'Laboratorio de Redes',
        ubicacion: 'Pabellón A · primer nivel',
        capacidad: 24,
        descripcion: 'Ambiente de aprendizaje para configuración de redes y soporte técnico.',
        equipamiento: 'Computadoras, switches de práctica, proyector y pizarra',
        estado: 'activo',
      },
      {
        id: 3,
        codigo: 'LAB-03',
        nombre: 'Aula de Innovación',
        ubicacion: 'Pabellón B · tercer nivel',
        capacidad: 20,
        descripcion: 'Espacio flexible para talleres, presentaciones y trabajo colaborativo.',
        equipamiento: 'Computadoras, proyector, pantalla y mobiliario modular',
        estado: 'activo',
      },
    ],
    solicitantes: [
      { id: 1, nombres: 'Ana Demo', apellidos: 'Instructora', correo: 'ana.demo@example.test', tipo_solicitante: 'instructor' },
      { id: 2, nombres: 'Usuario', apellidos: 'Prueba', correo: 'usuario.prueba@example.test', tipo_solicitante: 'personal' },
      { id: 3, nombres: 'Persona', apellidos: 'Ejemplo', correo: 'persona.ejemplo@example.test', tipo_solicitante: 'instructor' },
    ],
    reservas: [
      {
        id: 1,
        laboratorio_id: 1,
        solicitante_id: 1,
        usuario_id: 1,
        fecha: tomorrow,
        hora_inicio: '09:00:00',
        hora_fin: '11:00:00',
        motivo: 'Práctica de desarrollo web',
        estado: 'confirmada',
        observaciones: 'Datos ficticios de demostración.',
        created_at: now,
        updated_at: now,
      },
      {
        id: 2,
        laboratorio_id: 2,
        solicitante_id: 2,
        usuario_id: 1,
        fecha: tomorrow,
        hora_inicio: '10:00:00',
        hora_fin: '12:00:00',
        motivo: 'Taller de fundamentos de redes',
        estado: 'pendiente',
        observaciones: 'Datos ficticios de demostración.',
        created_at: now,
        updated_at: now,
      },
    ],
  }
}

function validateState(state) {
  if (
    !state
    || !Array.isArray(state.laboratorios)
    || !Array.isArray(state.solicitantes)
    || !Array.isArray(state.reservas)
    || !state.nextIds
  ) {
    throw new Error('Los datos de demostración guardados no tienen un formato válido. Borra solo el almacenamiento de demostración de este navegador para restablecerlo.')
  }
  return state
}

function readState(storage = globalThis.localStorage) {
  try {
    const stored = storage.getItem(storageKey)
    if (stored === null) {
      const initialState = createInitialState()
      writeState(initialState, storage)
      return initialState
    }
    return validateState(JSON.parse(stored))
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('No se pudieron leer los datos locales de demostración porque están dañados. Borra solo el almacenamiento de demostración de este navegador para restablecerlo.')
    }
    throw error
  }
}

function writeState(state, storage = globalThis.localStorage) {
  try {
    storage.setItem(storageKey, JSON.stringify(state))
  } catch {
    throw new Error('No se pudieron guardar los datos de demostración en este navegador. Comprueba el espacio de almacenamiento disponible y los permisos del sitio.')
  }
}

function mutateState(mutator) {
  const state = readState()
  const result = mutator(state)
  writeState(state)
  return result
}

function nextId(state, collection) {
  const id = Math.max(state.nextIds[collection] || 1, ...state[collection].map((item) => item.id + 1))
  state.nextIds[collection] = id + 1
  return id
}

function reservationView(state, reservation) {
  const laboratory = state.laboratorios.find((item) => item.id === reservation.laboratorio_id)
  const requester = state.solicitantes.find((item) => item.id === reservation.solicitante_id)
  if (!laboratory || !requester) {
    throw new Error('Una reserva de demostración apunta a un laboratorio o solicitante inexistente. Revisa los datos locales de demostración.')
  }
  return {
    ...reservation,
    laboratorio_codigo: laboratory.codigo,
    laboratorio_nombre: laboratory.nombre,
    nombres: requester.nombres,
    apellidos: requester.apellidos,
    solicitante_nombre: `${requester.nombres} ${requester.apellidos}`,
    correo: requester.correo,
  }
}

function ensureNoConflict(state, reservation, excludeId = null) {
  const conflict = state.reservas.some((existing) => (
    existing.id !== excludeId
    && existing.laboratorio_id === reservation.laboratorio_id
    && existing.fecha === reservation.fecha
    && blockingStatuses.includes(existing.estado)
    && reservation.estado !== 'cancelada'
    && existing.hora_inicio < reservation.hora_fin
    && existing.hora_fin > reservation.hora_inicio
  ))
  if (conflict) {
    throw new Error('El laboratorio seleccionado ya cuenta con una reserva en el horario indicado. Selecciona otro horario.')
  }
}

function validateReservation(input) {
  const reservation = {
    laboratorio_id: Number(input.laboratorio_id),
    solicitante_id: Number(input.solicitante_id),
    fecha: input.fecha,
    hora_inicio: input.hora_inicio?.length === 5 ? `${input.hora_inicio}:00` : input.hora_inicio,
    hora_fin: input.hora_fin?.length === 5 ? `${input.hora_fin}:00` : input.hora_fin,
    motivo: typeof input.motivo === 'string' ? input.motivo.trim() : '',
    estado: input.estado,
    observaciones: typeof input.observaciones === 'string' ? input.observaciones.trim() : '',
  }
  const dateParts = typeof reservation.fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(reservation.fecha)
    ? reservation.fecha.split('-').map(Number)
    : []
  const dateValue = dateParts.length === 3 ? new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2])) : null
  const validDate = Boolean(dateValue)
    && dateParts[0] >= 1000
    && dateValue.getUTCFullYear() === dateParts[0]
    && dateValue.getUTCMonth() === dateParts[1] - 1
    && dateValue.getUTCDate() === dateParts[2]
  if (!Number.isSafeInteger(reservation.laboratorio_id) || reservation.laboratorio_id < 1) throw new Error('Selecciona un laboratorio válido.')
  if (!Number.isSafeInteger(reservation.solicitante_id) || reservation.solicitante_id < 1) throw new Error('Selecciona un solicitante válido.')
  if (!validDate) throw new Error('La fecha debe ser válida.')
  if (!/^([01]\d|2[0-3]):[0-5]\d:00$/.test(reservation.hora_inicio) || !/^([01]\d|2[0-3]):[0-5]\d:00$/.test(reservation.hora_fin)) {
    throw new Error('Indica horarios válidos en formato de 24 horas.')
  }
  if (reservation.hora_fin <= reservation.hora_inicio) throw new Error('La hora final debe ser posterior a la hora inicial.')
  if (!['pendiente', 'confirmada', 'cancelada'].includes(reservation.estado)) throw new Error('El estado de la reserva no es válido.')
  if (reservation.motivo.length < 4 || reservation.motivo.length > 180) throw new Error('El motivo debe tener entre 4 y 180 caracteres.')
  if (reservation.observaciones.length > 500) throw new Error('Las observaciones no pueden superar 500 caracteres.')
  return reservation
}

function createReservation(input) {
  return mutateState((state) => {
    const reservation = validateReservation(input)
    if (!state.laboratorios.some((item) => item.id === reservation.laboratorio_id && item.estado === 'activo')) {
      throw new Error('El laboratorio seleccionado no existe o no está activo.')
    }
    if (!state.solicitantes.some((item) => item.id === reservation.solicitante_id)) {
      throw new Error('El solicitante seleccionado no existe.')
    }
    ensureNoConflict(state, reservation)
    const now = new Date().toISOString()
    const created = {
      id: nextId(state, 'reservas'),
      ...reservation,
      usuario_id: 1,
      created_at: now,
      updated_at: now,
    }
    state.reservas.push(created)
    return reservationView(state, created)
  })
}

function updateReservation(id, input) {
  return mutateState((state) => {
    const reservationId = Number(id)
    const index = state.reservas.findIndex((item) => item.id === reservationId)
    if (index < 0) throw new Error('La reserva solicitada no existe.')
    const reservation = validateReservation(input)
    if (!state.laboratorios.some((item) => item.id === reservation.laboratorio_id && item.estado === 'activo')) {
      throw new Error('El laboratorio seleccionado no existe o no está activo.')
    }
    if (!state.solicitantes.some((item) => item.id === reservation.solicitante_id)) {
      throw new Error('El solicitante seleccionado no existe.')
    }
    ensureNoConflict(state, reservation, reservationId)
    const updated = { ...state.reservas[index], ...reservation, updated_at: new Date().toISOString() }
    state.reservas[index] = updated
    return reservationView(state, updated)
  })
}

function reservationQuery(query = '') {
  const params = new URLSearchParams(query)
  return mutateState((state) => state.reservas
    .filter((reservation) => {
      const view = reservationView(state, reservation)
      const search = (params.get('buscar') || '').toLocaleLowerCase()
      return (!params.has('estado') || reservation.estado === params.get('estado'))
        && (!params.has('fecha') || reservation.fecha === params.get('fecha'))
        && (!search || `${reservation.motivo} ${view.laboratorio_nombre} ${view.nombres} ${view.apellidos}`.toLocaleLowerCase().includes(search))
    })
    .sort((left, right) => right.fecha.localeCompare(left.fecha) || right.hora_inicio.localeCompare(left.hora_inicio))
    .map((reservation) => reservationView(state, reservation)))
}

function dashboard() {
  return mutateState((state) => {
    const today = localDateOffset(0)
    const upcoming = state.reservas
      .filter((item) => item.fecha >= today && item.estado !== 'cancelada')
      .sort((left, right) => left.fecha.localeCompare(right.fecha) || left.hora_inicio.localeCompare(right.hora_inicio))
      .slice(0, 5)
      .map((item) => reservationView(state, item))
    return {
      stats: {
        laboratorios: state.laboratorios.filter((item) => item.estado === 'activo').length,
        hoy: state.reservas.filter((item) => item.fecha === today && item.estado !== 'cancelada').length,
        pendientes: state.reservas.filter((item) => item.estado === 'pendiente').length,
        confirmadas: state.reservas.filter((item) => item.estado === 'confirmada').length,
      },
      proximas: upcoming,
    }
  })
}

export const demoStore = {
  dashboard,
  laboratories: () => mutateState((state) => [...state.laboratorios].sort((a, b) => a.codigo.localeCompare(b.codigo))),
  createLaboratory(input) {
    return mutateState((state) => {
      const laboratory = {
        codigo: input.codigo.trim().toUpperCase(),
        nombre: input.nombre.trim(),
        ubicacion: input.ubicacion.trim(),
        capacidad: Number(input.capacidad),
        descripcion: input.descripcion?.trim() || '',
        equipamiento: input.equipamiento?.trim() || '',
        estado: input.estado,
      }
      if (state.laboratorios.some((item) => item.codigo.toLocaleLowerCase() === laboratory.codigo.toLocaleLowerCase())) {
        throw new Error('Ya existe un laboratorio con ese código.')
      }
      const created = { id: nextId(state, 'laboratorios'), ...laboratory }
      state.laboratorios.push(created)
      return created
    })
  },
  requesters: () => mutateState((state) => [...state.solicitantes].sort((a, b) => a.apellidos.localeCompare(b.apellidos) || a.nombres.localeCompare(b.nombres))),
  createRequester(input) {
    return mutateState((state) => {
      const requester = {
        nombres: input.nombres.trim(),
        apellidos: input.apellidos.trim(),
        correo: input.correo.trim().toLowerCase(),
        tipo_solicitante: input.tipo_solicitante,
      }
      if (state.solicitantes.some((item) => item.correo.toLowerCase() === requester.correo)) {
        throw new Error('Ya existe un solicitante con ese correo.')
      }
      const created = { id: nextId(state, 'solicitantes'), ...requester }
      state.solicitantes.push(created)
      return created
    })
  },
  reservations: reservationQuery,
  reservation(id) {
    return mutateState((state) => {
      const reservation = state.reservas.find((item) => item.id === Number(id))
      if (!reservation) throw new Error('La reserva solicitada no existe.')
      return reservationView(state, reservation)
    })
  },
  createReservation,
  updateReservation,
  deleteReservation(id) {
    return mutateState((state) => {
      const index = state.reservas.findIndex((item) => item.id === Number(id))
      if (index < 0) throw new Error('La reserva solicitada no existe.')
      state.reservas.splice(index, 1)
      return null
    })
  },
  availability(date) {
    return mutateState((state) => {
      const laboratories = state.laboratorios
        .filter((laboratory) => laboratory.estado === 'activo')
        .sort((a, b) => a.codigo.localeCompare(b.codigo))
        .map((laboratory) => ({
          id: laboratory.id,
          codigo: laboratory.codigo,
          nombre: laboratory.nombre,
          ubicacion: laboratory.ubicacion,
          reservas: state.reservas
            .filter((reservation) => reservation.laboratorio_id === laboratory.id
              && reservation.fecha === date
              && blockingStatuses.includes(reservation.estado))
            .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
            .map((reservation) => reservationView(state, reservation)),
        }))
      return { fecha: date, laboratorios: laboratories }
    })
  },
  health: () => ({ status: 'ok', database: 'localStorage', timezone: 'America/Lima' }),
  clear(storage = globalThis.localStorage) {
    storage.removeItem(storageKey)
  },
}

export const demoStorageKey = storageKey
