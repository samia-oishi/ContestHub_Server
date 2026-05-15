import { Router } from 'express'
import { verifyJwt } from '../middleware/verifyJwt.js'

const router = Router()

router.get('/winners', (req, res) => {
  res.json({ success: true, data: [], message: 'Winner stats endpoint is ready for implementation' })
})

router.get('/profile', verifyJwt, (req, res) => {
  res.status(501).json({ success: false, message: 'Profile stats will be implemented in the dashboard phase' })
})

export default router
