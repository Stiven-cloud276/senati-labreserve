export class AppError extends Error {
  constructor(message, status = 500) {
    super(message)
    this.status = status
  }
}

export function errorHandler(error, _request, response, _next) {
  if (error instanceof SyntaxError && 'body' in error) {
    return response.status(400).json({ error: { message: 'El cuerpo de la solicitud no contiene JSON válido.' } })
  }

  if (error.code === 'ER_DUP_ENTRY') {
    return response.status(409).json({ error: { message: 'Ya existe un registro con esos datos únicos.' } })
  }

  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    return response.status(400).json({ error: { message: 'El laboratorio o solicitante indicado no existe.' } })
  }

  const status = error.status || 500
  if (status >= 500) console.error('Error de API:', error.message)
  return response.status(status).json({
    error: { message: status >= 500 ? 'Ocurrió un error interno. Inténtalo nuevamente más tarde.' : error.message },
  })
}
