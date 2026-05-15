import 'dotenv/config'
import { connectDB } from '../config/db.js'

const email = process.argv[2]?.toLowerCase().trim()
const role = process.argv[3]?.toLowerCase().trim()
const allowedRoles = ['user', 'creator', 'admin']

if (!email || !allowedRoles.includes(role)) {
  console.error('Usage: npm run set-role -- user@example.com user|creator|admin')
  process.exit(1)
}

const now = new Date()
const db = await connectDB()
const result = await db.collection('users').findOneAndUpdate(
  { email },
  {
    $set: {
      email,
      role,
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

console.log(`${result.email} is now ${result.role}`)
process.exit(0)
