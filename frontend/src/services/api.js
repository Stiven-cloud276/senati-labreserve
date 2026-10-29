let accessToken = ''
let handleUnauthorized = () => {}

const apiBase = import.meta.env.VITE_API_URL || (
  import.meta.env.DEV ? 'http://localhost:3000/api' : ''
)

export function setApiSession(token, onUnauthorized = () => {}) {
  accessToken = token
  handleUnauthorized = onUnauthorized
}

export async function request(path, options = {}) {
  if (!apiBase) {
    throw new Error('Configura VITE_API_URL con la URL pública del backend.')
  }

  const method = options.method || 'GET'
  const headers = { Accept: 'application/json', ...options.headers }
  if (options.body) headers['Content-Type'] = 'application/json'
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`

  let response
  try {
    response = await fetch(`${apiBase}${path}`, { ...options, method, headers })
  } catch {
    throw new Error('No se pudo conectar con la API. Comprueba que el backend esté disponible.')
  }

  if (response.status === 204) return null
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    if (response.status === 401 && !path.startsWith('/auth/')) handleUnauthorized()
    throw new Error(payload.error?.message || payload.message || `La solicitud falló (HTTP ${response.status}).`)
  }
  return payload.data
}

export const api = {
  health: () => request('/health'),
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  dashboard: () => request('/dashboard'),
  laboratories: () => request('/laboratorios'),
  createLaboratory: (data) => request('/laboratorios', { method: 'POST', body: JSON.stringify(data) }),
  requesters: () => request('/solicitantes'),
  createRequester: (data) => request('/solicitantes', { method: 'POST', body: JSON.stringify(data) }),
  reservations: (query = '') => request(`/reservas${query ? `?${query}` : ''}`),
  reservation: (id) => request(`/reservas/${encodeURIComponent(id)}`),
  createReservation: (data) => request('/reservas', { method: 'POST', body: JSON.stringify(data) }),
  updateReservation: (id, data) => request(`/reservas/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteReservation: (id) => request(`/reservas/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  availability: (date) => request(`/disponibilidad?fecha=${encodeURIComponent(date)}`),
}
