import mysql from 'mysql2/promise'

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'labreserve_app',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bd_reservas_laboratorios_senati',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  queueLimit: 0,
  timezone: '-05:00',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
})

pool.on('connection', (connection) => {
  connection.query("SET time_zone = '-05:00'", (error) => {
    if (error) console.error('No se pudo establecer la zona horaria America/Lima:', error.message)
  })
})

export default pool
