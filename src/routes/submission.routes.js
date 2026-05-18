import { Router } from 'express'
import { verifyJwt } from '../middleware/verifyJwt.js'
import { verifyRole } from '../middleware/verifyRole.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import {
  createSubmission,
  declareWinner,
  getSubmissionStatus,
  listCreatorSubmissions,
} from '../services/submission.service.js'

const router = Router()

router.post(
  '/',
  verifyJwt,
  verifyRole('user'),
  asyncHandler(async (req, res) => {
    const data = await createSubmission(req.body, req.user)
    res.status(201).json({ success: true, message: 'Task submitted', data })
  }),
)

router.get(
  '/check/:contestId',
  verifyJwt,
  asyncHandler(async (req, res) => {
    const data = await getSubmissionStatus(req.params.contestId, req.user.email)
    res.json({ success: true, data })
  }),
)

router.get(
  '/creator',
  verifyJwt,
  verifyRole('creator'),
  asyncHandler(async (req, res) => {
    const data = await listCreatorSubmissions(req.user.email)
    res.json({ success: true, data })
  }),
)

router.patch(
  '/:id/winner',
  verifyJwt,
  verifyRole('creator'),
  asyncHandler(async (req, res) => {
    const data = await declareWinner(req.params.id, req.user)
    res.json({ success: true, message: 'Winner declared', data })
  }),
)

export default router
