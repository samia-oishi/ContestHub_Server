import { getDB } from '../config/db.js'

const allowedRoles = ['user', 'creator', 'admin']

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
  const existingUser = await findUserByEmail(email)

  if (existingUser) {
    const updates = {
      updatedAt: now,
    }

    if (payload.name && payload.name !== existingUser.name) updates.name = payload.name
    if (payload.photoURL && payload.photoURL !== existingUser.photoURL) updates.photoURL = payload.photoURL

    if (Object.keys(updates).length > 1) {
      await usersCollection().updateOne({ email }, { $set: updates })
    }

    return findUserByEmail(email)
  }

  const user = {
    name: payload.name || email.split('@')[0],
    email,
    photoURL: payload.photoURL || '',
    role: allowedRoles.includes(payload.role) ? payload.role : 'user',
    bio: '',
    winCount: 0,
    createdAt: now,
    updatedAt: now,
  }

  await usersCollection().insertOne(user)
  return findUserByEmail(email)
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
