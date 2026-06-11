import { Router } from 'express'
import { verifyJwt } from '../middleware/verifyJwt.js'
import { verifyRole } from '../middleware/verifyRole.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import {
  contestTypes,
  createContest,
  deleteContestAsAdmin,
  deleteCreatorContest,
  findApprovedContestById,
  findCreatorContestById,
  listRelatedContests,
  listAllContestsForAdmin,
  listApprovedContests,
  listCreatorContests,
  listPopularContests,
  updateContestStatus,
  updateCreatorContest,
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
  '/mine',
  verifyJwt,
  verifyRole('creator'),
  asyncHandler(async (req, res) => {
    const data = await listCreatorContests(req.user.email)
    res.json({ success: true, data })
  }),
)

router.get(
  '/admin/all',
  verifyJwt,
  verifyRole('admin'),
  asyncHandler(async (req, res) => {
    const data = await listAllContestsForAdmin(req.query)
    res.json({ success: true, data })
  }),
)

router.get(
  '/mine/:id',
  verifyJwt,
  verifyRole('creator'),
  asyncHandler(async (req, res) => {
    const contest = await findCreatorContestById(req.params.id, req.user.email)

    if (!contest) {
      return res.status(404).json({ success: false, message: 'Contest not found' })
    }

    res.json({ success: true, data: contest })
  }),
)

router.get(
  '/:id/related',
  asyncHandler(async (req, res) => {
    const contest = await findApprovedContestById(req.params.id)

    if (!contest) {
      return res.status(404).json({ success: false, message: 'Contest not found' })
    }

    const data = await listRelatedContests(req.params.id, contest.type, req.query.limit)
    res.json({ success: true, data })
  }),
)

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const contest = await findApprovedContestById(req.params.id)

    if (!contest) {
      return res.status(404).json({ success: false, message: 'Contest not found' })
    }

    res.json({ success: true, data: contest })
  }),
)

router.post(
  '/',
  verifyJwt,
  verifyRole('creator'),
  asyncHandler(async (req, res) => {
    const data = await createContest(req.body, req.user)
    res.status(201).json({ success: true, message: 'Contest submitted for approval', data })
  }),
)

router.patch(
  '/:id',
  verifyJwt,
  verifyRole('creator'),
  asyncHandler(async (req, res) => {
    const data = await updateCreatorContest(req.params.id, req.user.email, req.body)
    res.json({ success: true, message: 'Contest updated', data })
  }),
)

router.patch(
  '/:id/status',
  verifyJwt,
  verifyRole('admin'),
  asyncHandler(async (req, res) => {
    const data = await updateContestStatus(req.params.id, req.body.status)
    res.json({ success: true, message: 'Contest status updated', data })
  }),
)

router.delete(
  '/:id',
  verifyJwt,
  verifyRole('creator', 'admin'),
  asyncHandler(async (req, res) => {
    if (req.user.role === 'admin') {
      const data = await deleteContestAsAdmin(req.params.id)
      return res.json({ success: true, message: 'Contest deleted', data })
    }

    const data = await deleteCreatorContest(req.params.id, req.user.email)
    res.json({ success: true, message: 'Contest deleted', data })
  }),
)

export default router
