import { getDB } from '../config/db.js'
import { getStripe } from '../config/stripe.js'
import { serializeDocument, toObjectId } from '../utils/mongo.js'

const currency = 'usd'

function contestsCollection() {
  return getDB().collection('contests')
}

function registrationsCollection() {
  return getDB().collection('registrations')
}

function paymentsCollection() {
  return getDB().collection('payments')
}

async function ensurePaymentIndexes() {
  await Promise.all([
    registrationsCollection().createIndex({ contestId: 1, userEmail: 1 }, { unique: true }),
    paymentsCollection().createIndex({ paymentIntentId: 1 }, { unique: true }),
  ])
}

async function getPayableContest(contestId) {
  const contest = await contestsCollection().findOne({ _id: toObjectId(contestId) })

  if (!contest) {
    const error = new Error('Contest not found')
    error.statusCode = 404
    throw error
  }

  if (contest.status !== 'approved') {
    const error = new Error('Only approved contests can accept registrations')
    error.statusCode = 409
    throw error
  }

  if (contest.deadline && new Date(contest.deadline).getTime() <= Date.now()) {
    const error = new Error('Registration is closed for this contest')
    error.statusCode = 409
    throw error
  }

  const amount = Math.round(Number(contest.price || 0) * 100)

  if (!Number.isFinite(amount) || amount < 50) {
    const error = new Error('Contest entry fee must be at least 0.50 USD for card payment')
    error.statusCode = 400
    throw error
  }

  return { contest, amount }
}

export async function createPaymentIntent(contestId, user) {
  if (!contestId) {
    const error = new Error('Contest id is required')
    error.statusCode = 400
    throw error
  }

  await ensurePaymentIndexes()

  const { contest, amount } = await getPayableContest(contestId)
  const existingRegistration = await registrationsCollection().findOne({
    contestId: contest._id,
    userEmail: user.email,
  })

  if (existingRegistration) {
    const error = new Error('You are already registered for this contest')
    error.statusCode = 409
    throw error
  }

  const paymentIntent = await getStripe().paymentIntents.create({
    amount,
    currency,
    payment_method_types: ['card'],
    metadata: {
      contestId: contest._id.toString(),
      userEmail: user.email,
    },
  })

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    amount,
    currency,
  }
}

export async function confirmRegistration({ contestId, paymentIntentId }, user) {
  if (!contestId) {
    const error = new Error('Contest id is required')
    error.statusCode = 400
    throw error
  }

  if (!paymentIntentId) {
    const error = new Error('Payment intent id is required')
    error.statusCode = 400
    throw error
  }

  await ensurePaymentIndexes()

  const { contest, amount } = await getPayableContest(contestId)
  const paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId)

  if (paymentIntent.status !== 'succeeded') {
    const error = new Error('Payment has not been completed')
    error.statusCode = 409
    throw error
  }

  if (
    paymentIntent.metadata?.contestId !== contest._id.toString() ||
    paymentIntent.metadata?.userEmail !== user.email ||
    paymentIntent.amount !== amount ||
    paymentIntent.currency !== currency
  ) {
    const error = new Error('Payment verification failed')
    error.statusCode = 403
    throw error
  }

  const now = new Date()

  await paymentsCollection().updateOne(
    { paymentIntentId: paymentIntent.id },
    {
      $setOnInsert: {
        contestId: contest._id,
        userEmail: user.email,
        amount: amount / 100,
        currency,
        status: paymentIntent.status,
        createdAt: now,
      },
    },
    { upsert: true },
  )

  const registrationResult = await registrationsCollection().updateOne(
    { contestId: contest._id, userEmail: user.email },
    {
      $setOnInsert: {
        contestId: contest._id,
        contestTitle: contest.title,
        userEmail: user.email,
        userName: user.name || user.email,
        userPhoto: user.photoURL || '',
        paymentIntentId: paymentIntent.id,
        amount: amount / 100,
        paymentStatus: paymentIntent.status,
        registeredAt: now,
        isWinner: false,
      },
    },
    { upsert: true },
  )

  if (registrationResult.upsertedCount) {
    await contestsCollection().updateOne(
      { _id: contest._id },
      { $inc: { participantCount: 1 }, $set: { updatedAt: now } },
    )
  }

  const registration = await registrationsCollection().findOne({
    contestId: contest._id,
    userEmail: user.email,
  })

  return serializeRegistration(registration)
}

export async function getRegistrationStatus(contestId, email) {
  if (!contestId) {
    const error = new Error('Contest id is required')
    error.statusCode = 400
    throw error
  }

  const registration = await registrationsCollection().findOne({
    contestId: toObjectId(contestId),
    userEmail: email,
  })

  return {
    registered: Boolean(registration),
    registration: serializeRegistration(registration),
  }
}

export async function listUserRegistrations(email) {
  const registrations = await registrationsCollection()
    .aggregate([
      { $match: { userEmail: email } },
      {
        $lookup: {
          from: 'contests',
          localField: 'contestId',
          foreignField: '_id',
          as: 'contest',
        },
      },
      { $unwind: { path: '$contest', preserveNullAndEmptyArrays: true } },
      { $sort: { registeredAt: -1 } },
    ])
    .toArray()

  return registrations.map(serializeRegistration)
}

export async function listUserWinningRegistrations(email) {
  const registrations = await registrationsCollection()
    .aggregate([
      { $match: { userEmail: email, isWinner: true } },
      {
        $lookup: {
          from: 'contests',
          localField: 'contestId',
          foreignField: '_id',
          as: 'contest',
        },
      },
      { $unwind: { path: '$contest', preserveNullAndEmptyArrays: true } },
      { $sort: { registeredAt: -1 } },
    ])
    .toArray()

  return registrations.map(serializeRegistration)
}

export async function getUserProfileStats(email) {
  const [participated, wins] = await Promise.all([
    registrationsCollection().countDocuments({ userEmail: email }),
    registrationsCollection().countDocuments({ userEmail: email, isWinner: true }),
  ])
  const losses = Math.max(participated - wins, 0)
  const winPercentage = participated ? Math.round((wins / participated) * 100) : 0

  return {
    participated,
    wins,
    losses,
    winPercentage,
    chartData: [
      { name: 'Wins', value: wins },
      { name: 'Other contests', value: losses },
    ],
  }
}

function serializeRegistration(registration) {
  if (!registration) return null

  return {
    ...serializeDocument(registration),
    contestId: registration.contestId?.toString(),
    contest: registration.contest
      ? {
          ...registration.contest,
          _id: registration.contest._id?.toString(),
        }
      : null,
  }
}
