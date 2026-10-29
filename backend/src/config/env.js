import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'

const defaultEnvPath = fileURLToPath(new URL('../../.env', import.meta.url))
const envPath = process.env.ENV_FILE || defaultEnvPath
const result = dotenv.config({ path: envPath })

if (result.error && result.error.code !== 'ENOENT') {
  throw new Error(`No se pudo cargar la configuración del backend desde ${envPath}: ${result.error.message}`)
}
