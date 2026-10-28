export function formatDate(date) {
  if (!date) return '—'
  const [year, month, day] = String(date).slice(0, 10).split('-').map(Number)
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Lima',
  }).format(new Date(year, month - 1, day, 12))
}

export function todayLocal() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  return `${values.year}-${values.month}-${values.day}`
}

export function shiftLocalDate(date, offset) {
  const [year, month, day] = date.split('-').map(Number)
  const shifted = new Date(Date.UTC(year, month - 1, day + offset))
  return shifted.toISOString().slice(0, 10)
}

export function statusLabel(status) {
  return { pendiente: 'Pendiente', confirmada: 'Confirmada', cancelada: 'Cancelada' }[status] || status
}

export function errorMessage(error) {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.'
}
