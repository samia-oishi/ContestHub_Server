import { Router } from 'express'
import { verifyJwt } from '../middleware/verifyJwt.js'

const router = Router()

router.get('/', (req, res) => {
  res.json({ success: true, data: [], message: 'Contest listing endpoint is ready for implementation' })
})

router.get('/popular', (req, res) => {
  res.json({ success: true, data: [], message: 'Popular contest endpoint is ready for implementation' })
})

router.get('/:id', verifyJwt, (req, res) => {
  res.status(501).json({ success: false, message: 'Contest details will be implemented in the contest browsing phase' })
})

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
