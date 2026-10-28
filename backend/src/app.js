import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import apiRouter from './routes/api.js'
import { AppError, errorHandler } from './utils/errors.js'

const app = express()
const developmentOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:4173']
const configuredOrigins = (process.env.CORS_ORIGINS || '').split(',').map((origin) => origin.trim()).filter(Boolean)
const allowedOrigins = new Set([...configuredOrigins, ...(process.env.NODE_ENV === 'production' ? [] : developmentOrigins)])

app.disable('x-powered-by')
app.use(helmet())
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true)
    return callback(new AppError('Origen no autorizado.', 403))
  },
}))
app.use(express.json({ limit: '32kb' }))
app.use('/api', apiRouter)
app.use((_request, _response, next) => next(new AppError('La ruta solicitada no existe.', 404)))
app.use(errorHandler)

export default app
