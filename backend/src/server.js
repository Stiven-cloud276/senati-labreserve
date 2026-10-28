import 'dotenv/config'
import app from './app.js'
import pool from './db/pool.js'

const port = Number(process.env.PORT || 3000)

if (process.env.NODE_ENV === 'production' && (!process.env.API_WRITE_KEY || process.env.API_WRITE_KEY.length < 32)) {
  console.error('API_WRITE_KEY debe tener al menos 32 caracteres en producción para proteger las operaciones de escritura.')
  process.exit(1)
}

const server = app.listen(port, () => {
  console.log(`SENATI LABRESERVE API escuchando en el puerto ${port}.`)
})

async function shutdown(signal) {
  console.log(`Señal ${signal} recibida. Cerrando conexiones...`)
  server.close(async (error) => {
    try {
      await pool.end()
      if (error) {
        console.error('Error al cerrar el servidor:', error.message)
        process.exitCode = 1
      }
    } catch (poolError) {
      console.error('Error al cerrar la conexión con la base de datos:', poolError.message)
      process.exitCode = 1
    }
  })
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
