import { Router } from 'express'
import { verifyJwt } from '../middleware/verifyJwt.js'

const router = Router()

router.post('/', verifyJwt, (req, res) => {
  res.status(501).json({ success: false, message: 'Task submission will be implemented in the submission phase' })
})

router.get('/creator', verifyJwt, (req, res) => {
  res.status(501).json({ success: false, message: 'Creator submissions will be implemented in the creator phase' })
})

router.patch('/:id/winner', verifyJwt, (req, res) => {
  res.status(501).json({ success: false, message: 'Winner declaration will be implemented in the winner phase' })
})

export default router
