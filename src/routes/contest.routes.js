import { Router } from 'express'
import { verifyJwt } from '../middleware/verifyJwt.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import {
  contestTypes,
  findApprovedContestById,
  listApprovedContests,
  listPopularContests,
} from '../services/contest.service.js'

const router = Router()

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const data = await listApprovedContests(req.query)
    res.json({ success: true, data })
  }),
)

router.get(
  '/popular',
  asyncHandler(async (req, res) => {
    const data = await listPopularContests(req.query.limit)
    res.json({ success: true, data })
  }),
)

router.get('/types', (req, res) => {
  res.json({ success: true, data: contestTypes })
})

router.get(
  '/:id',
  verifyJwt,
  asyncHandler(async (req, res) => {
    const contest = await findApprovedContestById(req.params.id)

    if (!contest) {
      return res.status(404).json({ success: false, message: 'Contest not found' })
    }

    res.json({ success: true, data: contest })
  }),
)

router.post('/', verifyJwt, (req, res) => {
  res.status(501).json({ success: false, message: 'Contest creation will be implemented in the creator phase' })
})

router.patch('/:id', verifyJwt, (req, res) => {
  res.status(501).json({ success: false, message: 'Contest editing will be implemented in the creator phase' })
})

router.patch('/:id/status', verifyJwt, (req, res) => {
  res.status(501).json({ success: false, message: 'Contest approval will be implemented in the admin phase' })
})

router.delete('/:id', verifyJwt, (req, res) => {
  res.status(501).json({ success: false, message: 'Contest deletion will be implemented in the creator/admin phase' })
})

export default router
