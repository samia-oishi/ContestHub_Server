import { Router } from 'express'
import { verifyJwt } from '../middleware/verifyJwt.js'

const router = Router()

router.post('/create-intent', verifyJwt, (req, res) => {
  res.status(501).json({ success: false, message: 'Stripe intent creation will be implemented in the payment phase' })
})

router.post('/confirm-registration', verifyJwt, (req, res) => {
  res.status(501).json({ success: false, message: 'Payment verification will be implemented in the payment phase' })
})

export default router
