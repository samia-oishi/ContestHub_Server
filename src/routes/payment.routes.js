import { Router } from 'express'
import { verifyJwt } from '../middleware/verifyJwt.js'
import { verifyRole } from '../middleware/verifyRole.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { confirmRegistration, createPaymentIntent } from '../services/payment.service.js'

const router = Router()

router.post(
  '/create-intent',
  verifyJwt,
  verifyRole('user'),
  asyncHandler(async (req, res) => {
    const data = await createPaymentIntent(req.body.contestId, req.user)
    res.json({ success: true, data })
  }),
)

router.post(
  '/confirm-registration',
  verifyJwt,
  verifyRole('user'),
  asyncHandler(async (req, res) => {
    const data = await confirmRegistration(req.body, req.user)
    res.status(201).json({ success: true, message: 'Registration confirmed', data })
  }),
)

export default router
