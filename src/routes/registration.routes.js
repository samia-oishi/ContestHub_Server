import { Router } from 'express'
import { verifyJwt } from '../middleware/verifyJwt.js'

const router = Router()

router.get('/my', verifyJwt, (req, res) => {
  res.status(501).json({ success: false, message: 'Participated contests will be implemented in the user phase' })
})

router.get('/wins', verifyJwt, (req, res) => {
  res.status(501).json({ success: false, message: 'Winning contests will be implemented in the user phase' })
})

router.get('/check/:contestId', verifyJwt, (req, res) => {
  res.status(501).json({ success: false, message: 'Registration status will be implemented in the payment phase' })
})

export default router
