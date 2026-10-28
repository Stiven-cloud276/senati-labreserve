let writeKey = ''

const apiBase = import.meta.env.VITE_API_URL || (
  import.meta.env.DEV ? 'http://localhost:3000/api' : ''
)

export function setApiWriteKey(value) {
  writeKey = value.trim()
}

export async function request(path, options = {}) {
  if (!apiBase) {
    throw new Error('Configura VITE_API_URL con la URL pública del backend.')
  }

  const method = options.method || 'GET'
  const headers = { Accept: 'application/json', ...options.headers }
  if (options.body) headers['Content-Type'] = 'application/json'
  if (method !== 'GET' && writeKey) headers['x-api-key'] = writeKey

  let response
  try {
    response = await fetch(`${apiBase}${path}`, { ...options, method, headers })
  } catch {
    throw new Error('No se pudo conectar con la API. Comprueba que el backend esté disponible.')
  }

  if (response.status === 204) return null
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload.message || `La solicitud falló (HTTP ${response.status}).`)
  }
  return payload.data
}

export const api = {
  health: () => request('/health'),
  dashboard: () => request('/dashboard'),
  laboratories: () => request('/laboratorios'),
  requesters: () => request('/solicitantes'),
  createRequester: (data) => request('/solicitantes', { method: 'POST', body: JSON.stringify(data) }),
  reservations: (query = '') => request(`/reservas${query ? `?${query}` : ''}`),
  reservation: (id) => request(`/reservas/${encodeURIComponent(id)}`),
  createReservation: (data) => request('/reservas', { method: 'POST', body: JSON.stringify(data) }),
  updateReservation: (id, data) => request(`/reservas/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteReservation: (id) => request(`/reservas/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  availability: (date) => request(`/disponibilidad?fecha=${encodeURIComponent(date)}`),
}
