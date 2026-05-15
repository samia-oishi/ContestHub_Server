import { ObjectId } from 'mongodb'

export function toObjectId(id) {
  if (!ObjectId.isValid(id)) {
    const error = new Error('Invalid resource id')
    error.statusCode = 400
    throw error
  }

  return new ObjectId(id)
}

export function serializeDocument(document) {
  if (!document) return null

  return {
    ...document,
    _id: document._id?.toString(),
  }
}
