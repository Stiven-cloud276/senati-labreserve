import '../src/config/env.js'
import bcrypt from 'bcryptjs'
import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import pool from '../src/db/pool.js'

async function ask(label) {
  const prompt = createInterface({ input: stdin, output: stdout })
  try {
    return (await prompt.question(label)).trim()
  } finally {
    prompt.close()
  }
}

function askSecret(label) {
  return new Promise((resolve, reject) => {
    if (!stdin.isTTY || typeof stdin.setRawMode !== 'function') {
      reject(new Error('Ejecuta este comando en una terminal interactiva para proteger la entrada de contraseñas.'))
      return
    }

    stdout.write(label)
    stdin.setEncoding('utf8')
    stdin.setRawMode(true)
    stdin.resume()
    let value = ''

    function finish(error) {
      stdin.removeListener('data', onData)
      stdin.setRawMode(false)
      stdout.write('\n')
      if (error) reject(error)
      else resolve(value)
    }

    function onData(input) {
      for (const character of input) {
        if (character === '\u0003') return finish(new Error('Operación cancelada.'))
        if (character === '\r' || character === '\n') return finish()
        if (character === '\u007f' || character === '\b') {
          if (value.length) {
            value = value.slice(0, -1)
            stdout.write('\b \b')
          }
          continue
        }
        if (character >= ' ') {
          value += character
          stdout.write('*')
        }
      }
    }

    stdin.on('data', onData)
  })
}

async function main() {
  const database = process.env.DB_NAME || 'bd_reservas_laboratorios_senati'
  const [tables] = await pool.execute(
    `SELECT TABLE_NAME FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN ('usuarios', 'reservas')`,
    [database],
  )
  const tableNames = new Set(tables.map(({ TABLE_NAME }) => TABLE_NAME))
  const [ownerColumns] = tableNames.has('reservas')
    ? await pool.execute(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'reservas' AND COLUMN_NAME = 'usuario_id'`,
      [database],
    )
    : [[]]
  if (!tableNames.has('usuarios') || !tableNames.has('reservas') || !ownerColumns.length) {
    throw new Error(
      'Falta preparar el esquema de autenticación. En phpMyAdmin selecciona la base bd_reservas_laboratorios_senati e importa, en orden, database/migrations/001_usuarios.sql y database/migrations/002_reservation_owner.sql. Después vuelve a ejecutar este comando.',
    )
  }

  const nombres = await ask('Nombres del administrador: ')
  const apellidos = await ask('Apellidos del administrador: ')
  const correo = (await ask('Correo del administrador: ')).toLowerCase()
  const password = await askSecret('Contraseña (mínimo 12 caracteres): ')
  const confirmation = await askSecret('Confirma la contraseña: ')

  if (nombres.length < 2 || nombres.length > 80 || apellidos.length < 2 || apellidos.length > 80) {
    throw new Error('Los nombres y apellidos deben tener entre 2 y 80 caracteres.')
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) || correo.length > 160) {
    throw new Error('Ingresa un correo válido de hasta 160 caracteres.')
  }
  if (password.length < 12 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new Error('La contraseña debe tener entre 12 caracteres y 72 bytes UTF-8.')
  }
  if (password !== confirmation) throw new Error('Las contraseñas no coinciden.')

  const connection = await pool.getConnection()
  let lockAcquired = false
  try {
    const [lockRows] = await connection.query("SELECT GET_LOCK('senati_labreserve_admin_bootstrap', 10) AS acquired")
    if (lockRows[0].acquired !== 1) throw new Error('No se pudo reservar el proceso de creación del administrador.')
    lockAcquired = true

    const [admins] = await connection.execute("SELECT id FROM usuarios WHERE role = 'admin' LIMIT 1")
    if (admins.length) throw new Error('Ya existe un administrador. No se creó ni modificó ninguna cuenta.')

    const passwordHash = await bcrypt.hash(password, 12)
    await connection.execute(
      `INSERT INTO usuarios (nombres, apellidos, correo, password_hash, role)
       VALUES (?, ?, ?, ?, 'admin')`,
      [nombres, apellidos, correo, passwordHash],
    )
    stdout.write('Cuenta de administrador creada. Conserva sus credenciales en un gestor seguro.\n')
  } finally {
    try {
      if (lockAcquired) await connection.query("SELECT RELEASE_LOCK('senati_labreserve_admin_bootstrap')")
    } finally {
      connection.release()
    }
  }
}

main()
  .catch((error) => {
    console.error(`No se pudo crear el administrador: ${error.message}`)
    process.exitCode = 1
  })
  .finally(() => pool.end())
