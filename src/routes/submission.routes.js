import { Router } from 'express'
import { verifyJwt } from '../middleware/verifyJwt.js'
import { verifyRole } from '../middleware/verifyRole.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { getDB } from '../config/db.js'

const router = Router()

router.post('/', verifyJwt, (req, res) => {
  res.status(501).json({ success: false, message: 'Task submission will be implemented in the submission phase' })
})

router.get(
  '/creator',
  verifyJwt,
  verifyRole('creator'),
  asyncHandler(async (req, res) => {
    const db = getDB()
    const contests = await db.collection('contests').find({ creatorEmail: req.user.email }, { projection: { _id: 1, title: 1 } }).toArray()
    const contestMap = new Map(contests.map((contest) => [contest._id.toString(), contest.title]))
    const contestIds = Array.from(contestMap.keys())

    if (contestIds.length === 0) {
      return res.json({ success: true, data: [] })
    }

    const submissions = await db
      .collection('submissions')
      .find({ contestId: { $in: contestIds } })
      .sort({ submittedAt: -1 })
      .toArray()

    const data = submissions.map((submission) => ({
      ...submission,
      _id: submission._id.toString(),
      contestTitle: contestMap.get(submission.contestId),
    }))

    res.json({ success: true, data })
  }),
)

router.patch('/:id/winner', verifyJwt, (req, res) => {
  res.status(501).json({ success: false, message: 'Winner declaration will be implemented in the winner phase' })
})

export default router
