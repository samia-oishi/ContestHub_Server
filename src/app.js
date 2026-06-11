import cookieParser from 'cookie-parser'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import authRoutes from './routes/auth.routes.js'
import contactRoutes from './routes/contact.routes.js'
import contestRoutes from './routes/contest.routes.js'
import paymentRoutes from './routes/payment.routes.js'
import registrationRoutes from './routes/registration.routes.js'
import statsRoutes from './routes/stats.routes.js'
import submissionRoutes from './routes/submission.routes.js'
import userRoutes from './routes/user.routes.js'
import { corsOptions } from './config/cors.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'
import { connectDB, pingDB } from './config/db.js'

dotenv.config()

const app = express()

app.use(cors(corsOptions()))
app.use(express.json())
app.use(cookieParser())

app.use(async (req, res, next) => {
  try {
    await connectDB()
    next()
  } catch (error) {
    next(error)
  }
})

app.get('/', (req, res) => {
  res.json({ success: true, message: 'ContestHub API is running' })
})

app.get('/health', async (req, res, next) => {
  try {
    await pingDB()
    res.json({
      success: true,
      service: 'contesthub-api',
      database: 'connected',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

app.use('/auth', authRoutes)
app.use('/contacts', contactRoutes)
app.use('/users', userRoutes)
app.use('/contests', contestRoutes)
app.use('/payments', paymentRoutes)
app.use('/registrations', registrationRoutes)
app.use('/submissions', submissionRoutes)
app.use('/stats', statsRoutes)

app.use(notFound)
app.use(errorHandler)

export default app
