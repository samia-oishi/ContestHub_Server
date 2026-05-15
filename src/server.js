import app from './app.js'
import { connectDB } from './config/db.js'

const port = process.env.PORT || 5000

async function startServer() {
  await connectDB()

  app.listen(port, () => {
    console.log(`ContestHub API listening on port ${port}`)
  })
}

startServer().catch((error) => {
  console.error('Failed to start ContestHub API')
  console.error(error)
  process.exit(1)
})
