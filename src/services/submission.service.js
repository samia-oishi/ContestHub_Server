import { getDB } from '../config/db.js'
import { serializeDocument, toObjectId } from '../utils/mongo.js'

function contestsCollection() {
  return getDB().collection('contests')
}

function registrationsCollection() {
  return getDB().collection('registrations')
}

function submissionsCollection() {
  return getDB().collection('submissions')
}

function usersCollection() {
  return getDB().collection('users')
}

async function ensureSubmissionIndexes() {
  await submissionsCollection().createIndex({ contestId: 1, userEmail: 1 }, { unique: true })
}

function normalizeTask(payload) {
  const taskLinkOrText = payload.taskLinkOrText?.trim()

  if (!taskLinkOrText || taskLinkOrText.length < 8) {
    const error = new Error('Submission must include a valid task link or note')
    error.statusCode = 400
    throw error
  }

  if (taskLinkOrText.length > 1000) {
    const error = new Error('Submission is too long')
    error.statusCode = 400
    throw error
  }

  return taskLinkOrText
}

export async function createSubmission(payload, user) {
  if (!payload.contestId) {
    const error = new Error('Contest id is required')
    error.statusCode = 400
    throw error
  }

  await ensureSubmissionIndexes()

  const contestId = toObjectId(payload.contestId)
  const contest = await contestsCollection().findOne({ _id: contestId, status: 'approved' })

  if (!contest) {
    const error = new Error('Contest not found')
    error.statusCode = 404
    throw error
  }

  if (contest.deadline && new Date(contest.deadline).getTime() <= Date.now()) {
    const error = new Error('Submission time has ended')
    error.statusCode = 409
    throw error
  }

  const registration = await registrationsCollection().findOne({
    contestId,
    userEmail: user.email,
  })

  if (!registration) {
    const error = new Error('You must register before submitting a task')
    error.statusCode = 403
    throw error
  }

  const profile = await usersCollection().findOne({ email: user.email })
  const now = new Date()
  const submission = {
    contestId,
    userEmail: user.email,
    userName: profile?.name || registration.userName || user.email,
    userPhoto: profile?.photoURL || registration.userPhoto || '',
    taskLinkOrText: normalizeTask(payload),
    status: 'submitted',
    isWinner: false,
    submittedAt: now,
    updatedAt: now,
  }

  try {
    const result = await submissionsCollection().insertOne(submission)
    return serializeSubmission({ ...submission, _id: result.insertedId, contestTitle: contest.title })
  } catch (error) {
    if (error.code === 11000) {
      const conflict = new Error('You have already submitted a task for this contest')
      conflict.statusCode = 409
      throw conflict
    }

    throw error
  }
}

export async function getSubmissionStatus(contestId, email) {
  if (!contestId) {
    const error = new Error('Contest id is required')
    error.statusCode = 400
    throw error
  }

  const submission = await submissionsCollection().findOne({
    contestId: toObjectId(contestId),
    userEmail: email,
  })

  return {
    submitted: Boolean(submission),
    submission: serializeSubmission(submission),
  }
}

export async function listCreatorSubmissions(email) {
  const contests = await contestsCollection()
    .find({ creatorEmail: email }, { projection: { _id: 1, title: 1, deadline: 1, winnerUserId: 1 } })
    .toArray()
  const contestMap = new Map(contests.map((contest) => [contest._id.toString(), contest]))
  const contestIds = contests.map((contest) => contest._id)

  if (contestIds.length === 0) return []

  const submissions = await submissionsCollection()
    .find({ contestId: { $in: contestIds } })
    .sort({ submittedAt: -1 })
    .toArray()

  return submissions.map((submission) => {
    const contest = contestMap.get(submission.contestId.toString())

    return serializeSubmission({
      ...submission,
      contestTitle: contest?.title,
      contestDeadline: contest?.deadline,
      contestHasWinner: Boolean(contest?.winnerUserId || contest?.winnerName),
    })
  })
}

export async function declareWinner(submissionId, creator) {
  const submission = await submissionsCollection().findOne({ _id: toObjectId(submissionId) })

  if (!submission) {
    const error = new Error('Submission not found')
    error.statusCode = 404
    throw error
  }

  const contest = await contestsCollection().findOne({
    _id: submission.contestId,
    creatorEmail: creator.email,
  })

  if (!contest) {
    const error = new Error('Contest not found')
    error.statusCode = 404
    throw error
  }

  if (contest.deadline && new Date(contest.deadline).getTime() > Date.now()) {
    const error = new Error('Winner can be declared only after the deadline')
    error.statusCode = 409
    throw error
  }

  if (contest.winnerUserId) {
    const error = new Error('Winner has already been declared for this contest')
    error.statusCode = 409
    throw error
  }

  const winner = await usersCollection().findOne({ email: submission.userEmail })
  const now = new Date()
  const winnerUserId = winner?._id?.toString() || null
  const winnerName = submission.userName || submission.userEmail
  const winnerPhoto = submission.userPhoto || winner?.photoURL || ''

  await submissionsCollection().updateMany(
    { contestId: submission.contestId },
    { $set: { isWinner: false, status: 'reviewed', updatedAt: now } },
  )
  await submissionsCollection().updateOne(
    { _id: submission._id },
    { $set: { isWinner: true, status: 'winner', updatedAt: now } },
  )
  await contestsCollection().updateOne(
    { _id: contest._id },
    {
      $set: {
        winnerUserId,
        winnerName,
        winnerPhoto,
        updatedAt: now,
      },
    },
  )
  await registrationsCollection().updateMany(
    { contestId: contest._id },
    { $set: { isWinner: false } },
  )
  await registrationsCollection().updateOne(
    { contestId: contest._id, userEmail: submission.userEmail },
    { $set: { isWinner: true } },
  )

  if (winner?._id) {
    await usersCollection().updateOne(
      { _id: winner._id },
      { $inc: { winCount: 1 }, $set: { updatedAt: now } },
    )
  }

  const updatedSubmission = await submissionsCollection().findOne({ _id: submission._id })
  return serializeSubmission({
    ...updatedSubmission,
    contestTitle: contest.title,
    contestDeadline: contest.deadline,
    contestHasWinner: true,
  })
}

function serializeSubmission(submission) {
  if (!submission) return null

  return {
    ...serializeDocument(submission),
    contestId: submission.contestId?.toString(),
  }
}
