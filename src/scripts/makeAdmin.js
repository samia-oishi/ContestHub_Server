import 'dotenv/config'
import { connectDB } from '../config/db.js'

const email = process.argv[2]?.toLowerCase().trim()

if (!email) {
  console.error('Usage: npm run make-admin -- user@example.com')
  process.exit(1)
}

const now = new Date()
const db = await connectDB()
const users = db.collection('users')

const result = await users.findOneAndUpdate(
  { email },
  {
    $set: {
      email,
      role: 'admin',
      updatedAt: now,
    },
    $setOnInsert: {
      name: email.split('@')[0],
      photoURL: '',
      bio: '',
      winCount: 0,
      createdAt: now,
    },
  },
  {
    upsert: true,
    returnDocument: 'after',
  },
)

console.log(`Admin ready: ${result.email}`)
process.exit(0)
