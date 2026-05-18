import { Router } from 'express'
import { verifyJwt } from '../middleware/verifyJwt.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { getUserProfileStats } from '../services/payment.service.js'
import { listLeaderboard, listRecentWinners } from '../services/stats.service.js'

const router = Router()

router.get(
  '/winners',
  asyncHandler(async (req, res) => {
    const data = await listRecentWinners(req.query.limit)
    res.json({ success: true, data })
  }),
)

router.get(
  '/leaderboard',
  asyncHandler(async (req, res) => {
    const data = await listLeaderboard(req.query.limit)
    res.json({ success: true, data })
  }),
)

router.get(
  '/profile',
  verifyJwt,
  asyncHandler(async (req, res) => {
    const data = await getUserProfileStats(req.user.email)
    res.json({ success: true, data })
  }),
)

export default router
