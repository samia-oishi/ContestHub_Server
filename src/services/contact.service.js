import { getDB } from '../config/db.js'

function contactsCollection() {
  return getDB().collection('contacts')
}

function normalizeContactPayload(payload) {
  const name = payload.name?.trim()
  const email = payload.email?.toLowerCase().trim()
  const subject = payload.subject?.trim()
  const message = payload.message?.trim()

  if (!name || !email || !subject || !message) {
    const error = new Error('All contact fields are required')
    error.statusCode = 400
    throw error
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const error = new Error('A valid email is required')
    error.statusCode = 400
    throw error
  }

  if (message.length < 10 || message.length > 1000) {
    const error = new Error('Message must be between 10 and 1000 characters')
    error.statusCode = 400
    throw error
  }

  return { name, email, subject, message }
}

export async function createContactMessage(payload) {
  const now = new Date()
  const message = {
    ...normalizeContactPayload(payload),
    status: 'new',
    createdAt: now,
  }

  const result = await contactsCollection().insertOne(message)

  return {
    _id: result.insertedId.toString(),
    ...message,
  }
}
