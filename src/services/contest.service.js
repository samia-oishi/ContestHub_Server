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
