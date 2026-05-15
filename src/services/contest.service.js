import { getDB } from '../config/db.js'
import { serializeDocument, toObjectId } from '../utils/mongo.js'

export const contestTypes = [
  'Image Design',
  'Article Writing',
  'Marketing Strategy',
  'Business Idea',
  'Gaming Review',
  'UI/UX Design',
]

function contestsCollection() {
  return getDB().collection('contests')
}

function normalizeContestPayload(payload) {
  const title = payload.title?.trim()
  const image = payload.image?.trim()
  const description = payload.description?.trim()
  const taskInstruction = payload.taskInstruction?.trim()
  const type = payload.type?.trim()
  const price = Number(payload.price)
  const prizeMoney = Number(payload.prizeMoney)
  const deadline = payload.deadline ? new Date(payload.deadline) : null

  if (!title || !image || !description || !taskInstruction || !type) {
    const error = new Error('All contest fields are required')
    error.statusCode = 400
    throw error
  }

  if (!contestTypes.includes(type)) {
    const error = new Error('Invalid contest type')
    error.statusCode = 400
    throw error
  }

  if (!Number.isFinite(price) || price < 0 || !Number.isFinite(prizeMoney) || prizeMoney < 0) {
    const error = new Error('Price and prize money must be valid positive numbers')
    error.statusCode = 400
    throw error
  }

  if (!deadline || Number.isNaN(deadline.getTime()) || deadline.getTime() <= Date.now()) {
    const error = new Error('Deadline must be a future date')
    error.statusCode = 400
    throw error
  }

  return {
    title,
    image,
    description,
    taskInstruction,
    type,
    price,
    prizeMoney,
    deadline,
  }
}

function approvedContestFilter({ type, search } = {}) {
  const filter = { status: 'approved' }
  const normalizedType = type?.trim()
  const normalizedSearch = search?.trim()

  if (normalizedType && normalizedType !== 'All') {
    filter.type = normalizedType
  }

  if (normalizedSearch) {
    filter.type = { $regex: normalizedSearch, $options: 'i' }
  }

  return filter
}

export async function listApprovedContests({ type, search, page = 1, limit = 9 } = {}) {
  const safePage = Math.max(Number(page) || 1, 1)
  const safeLimit = Math.min(Math.max(Number(limit) || 9, 1), 30)
  const filter = approvedContestFilter({ type, search })

  const [items, total] = await Promise.all([
    contestsCollection()
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .toArray(),
    contestsCollection().countDocuments(filter),
  ])

  return {
    items: items.map(serializeDocument),
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(total / safeLimit),
  }
}

export async function listPopularContests(limit = 5) {
  const safeLimit = Math.min(Math.max(Number(limit) || 5, 1), 10)
  const contests = await contestsCollection()
    .find({ status: 'approved' })
    .sort({ participantCount: -1, createdAt: -1 })
    .limit(safeLimit)
    .toArray()

  return contests.map(serializeDocument)
}

export async function findApprovedContestById(id) {
  const contest = await contestsCollection().findOne({
    _id: toObjectId(id),
    status: 'approved',
  })

  return serializeDocument(contest)
}

export async function createContest(payload, creator) {
  const now = new Date()
  const contest = {
    ...normalizeContestPayload(payload),
    creatorEmail: creator.email,
    creatorName: creator.name || creator.email,
    status: 'pending',
    participantCount: 0,
    winnerUserId: null,
    winnerName: '',
    winnerPhoto: '',
    createdAt: now,
    updatedAt: now,
  }

  const result = await contestsCollection().insertOne(contest)
  return serializeDocument({ ...contest, _id: result.insertedId })
}

export async function listCreatorContests(email) {
  const contests = await contestsCollection()
    .find({ creatorEmail: email })
    .sort({ createdAt: -1 })
    .toArray()

  return contests.map(serializeDocument)
}

export async function findCreatorContestById(id, email) {
  const contest = await contestsCollection().findOne({
    _id: toObjectId(id),
    creatorEmail: email,
  })

  return serializeDocument(contest)
}

export async function updateCreatorContest(id, email, payload) {
  const contest = await findCreatorContestById(id, email)

  if (!contest) {
    const error = new Error('Contest not found')
    error.statusCode = 404
    throw error
  }

  if (contest.status !== 'pending') {
    const error = new Error('Only pending contests can be edited')
    error.statusCode = 409
    throw error
  }

  const updates = {
    ...normalizeContestPayload(payload),
    updatedAt: new Date(),
  }

  await contestsCollection().updateOne({ _id: toObjectId(id) }, { $set: updates })
  return findCreatorContestById(id, email)
}

export async function deleteCreatorContest(id, email) {
  const contest = await findCreatorContestById(id, email)

  if (!contest) {
    const error = new Error('Contest not found')
    error.statusCode = 404
    throw error
  }

  if (contest.status !== 'pending') {
    const error = new Error('Only pending contests can be deleted')
    error.statusCode = 409
    throw error
  }

  await contestsCollection().deleteOne({ _id: toObjectId(id) })
  return contest
}
