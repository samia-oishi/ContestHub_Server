import { getDB } from '../config/db.js'

const allowedRoles = ['user', 'creator', 'admin']
const publicSignupRoles = ['user', 'creator']

export function usersCollection() {
  return getDB().collection('users')
}

export async function findUserByEmail(email) {
  return usersCollection().findOne({ email })
}

export async function upsertAuthUser(payload) {
  const email = payload.email?.toLowerCase().trim()

  if (!email) {
    const error = new Error('Email is required')
    error.statusCode = 400
    throw error
  }

  const now = new Date()
  const updates = {
    updatedAt: now,
  }

  if (payload.name) updates.name = payload.name
  if (payload.photoURL) updates.photoURL = payload.photoURL

  const result = await usersCollection().findOneAndUpdate(
    { email },
    {
      $set: updates,
      $setOnInsert: {
        email,
        role: publicSignupRoles.includes(payload.role) ? payload.role : 'user',
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

  return result
}

export function serializeUser(user) {
  if (!user) return null

  return {
    _id: user._id?.toString(),
    name: user.name,
    email: user.email,
    photoURL: user.photoURL,
    role: user.role || 'user',
    bio: user.bio || '',
    winCount: user.winCount || 0,
  }
}
