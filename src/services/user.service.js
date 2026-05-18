import { getDB } from '../config/db.js'
import { toObjectId } from '../utils/mongo.js'

const allowedRoles = ['user', 'creator', 'admin']
const publicSignupRoles = ['user', 'creator']

export function usersCollection() {
  return getDB().collection('users')
}

export async function findUserByEmail(email) {
  return usersCollection().findOne({ email })
}

export async function listUsers({ page = 1, limit = 10 } = {}) {
  const safePage = Math.max(Number(page) || 1, 1)
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 50)

  const [items, total] = await Promise.all([
    usersCollection()
      .find({})
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .toArray(),
    usersCollection().countDocuments(),
  ])

  return {
    items: items.map(serializeUser),
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(total / safeLimit),
  }
}

export async function updateUserRole(id, role) {
  if (!allowedRoles.includes(role)) {
    const error = new Error('Invalid role')
    error.statusCode = 400
    throw error
  }

  const result = await usersCollection().findOneAndUpdate(
    { _id: toObjectId(id) },
    { $set: { role, updatedAt: new Date() } },
    { returnDocument: 'after' },
  )

  if (!result) {
    const error = new Error('User not found')
    error.statusCode = 404
    throw error
  }

  return result
}

export async function updateUserProfile(email, payload) {
  const updates = {
    updatedAt: new Date(),
  }
  const allowedFields = ['name', 'photoURL', 'bio', 'address']
  const hasProfileField = allowedFields.some((field) => Object.prototype.hasOwnProperty.call(payload, field))

  if (!hasProfileField) {
    const error = new Error('No profile changes provided')
    error.statusCode = 400
    throw error
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'name')) {
    const name = payload.name?.trim()

    if (!name) {
      const error = new Error('Name is required')
      error.statusCode = 400
      throw error
    }

    updates.name = name
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'photoURL')) {
    updates.photoURL = payload.photoURL?.trim() || ''
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'bio')) {
    updates.bio = (payload.bio?.trim() || '').slice(0, 300)
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'address')) {
    updates.address = (payload.address?.trim() || '').slice(0, 160)
  }

  if (updates.photoURL && !/^https?:\/\/.+/i.test(updates.photoURL)) {
    const error = new Error('Photo URL must start with http or https')
    error.statusCode = 400
    throw error
  }

  const result = await usersCollection().findOneAndUpdate(
    { email },
    { $set: updates },
    { returnDocument: 'after' },
  )

  if (!result) {
    const error = new Error('User profile not found')
    error.statusCode = 404
    throw error
  }

  return result
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
    address: user.address || '',
    winCount: user.winCount || 0,
  }
}
