import { MongoClient, ServerApiVersion } from 'mongodb'

let client
let database

export async function connectDB() {
  if (database) return database

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not configured')
  }

  client = new MongoClient(process.env.MONGODB_URI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  })

  await client.connect()
  database = client.db(process.env.DB_NAME || 'contesthub')
  return database
}

export async function pingDB() {
  const db = await connectDB()
  await db.command({ ping: 1 })
  return true
}

export function getDB() {
  if (!database) {
    throw new Error('Database is not connected')
  }

  return database
}
