import { Router } from 'express'
import { verifyJwt } from '../middleware/verifyJwt.js'
import { verifyRole } from '../middleware/verifyRole.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { findUserByEmail, listUsers, serializeUser, updateUserRole } from '../services/user.service.js'

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

router.get(
  '/',
  verifyJwt,
  verifyRole('admin'),
  asyncHandler(async (req, res) => {
    const data = await listUsers(req.query)
    res.json({ success: true, data })
  }),
)

router.patch('/me', verifyJwt, (req, res) => {
  res.status(501).json({ success: false, message: 'Profile update will be implemented in the user dashboard phase' })
})

router.patch(
  '/:id/role',
  verifyJwt,
  verifyRole('admin'),
  asyncHandler(async (req, res) => {
    const user = await updateUserRole(req.params.id, req.body.role)
    res.json({ success: true, message: 'User role updated', data: serializeUser(user) })
  }),
)

export default router
