import { Router } from 'express'
import { verifyJwt } from '../middleware/verifyJwt.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { findUserByEmail, serializeUser } from '../services/user.service.js'

const router = Router()

router.get(
  '/me',
  verifyJwt,
  asyncHandler(async (req, res) => {
    const user = await findUserByEmail(req.user.email)

    if (!user) {
      return res.status(404).json({ success: false, message: 'User profile not found' })
    }

    res.json({ success: true, data: serializeUser(user) })
  }),
)

router.get('/', verifyJwt, (req, res) => {
  res.status(501).json({ success: false, message: 'User management will be implemented in the admin phase' })
})

router.patch('/me', verifyJwt, (req, res) => {
  res.status(501).json({ success: false, message: 'Profile update will be implemented in the user dashboard phase' })
})

router.patch('/:id/role', verifyJwt, (req, res) => {
  res.status(501).json({ success: false, message: 'Role updates will be implemented in the admin phase' })
})

export default router
