import { Router } from 'express'
import { verifyJwt } from '../middleware/verifyJwt.js'
import { verifyRole } from '../middleware/verifyRole.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { getRegistrationStatus, listUserRegistrations, listUserWinningRegistrations } from '../services/payment.service.js'

const router = Router()

router.get(
  '/my',
  verifyJwt,
  verifyRole('user'),
  asyncHandler(async (req, res) => {
    const data = await listUserRegistrations(req.user.email)
    res.json({ success: true, data })
  }),
)

router.get(
  '/wins',
  verifyJwt,
  verifyRole('user'),
  asyncHandler(async (req, res) => {
    const data = await listUserWinningRegistrations(req.user.email)
    res.json({ success: true, data })
  }),
)

router.get(
  '/check/:contestId',
  verifyJwt,
  asyncHandler(async (req, res) => {
    const data = await getRegistrationStatus(req.params.contestId, req.user.email)
    res.json({ success: true, data })
  }),
)

export default router
