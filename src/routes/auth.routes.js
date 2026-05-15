import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { asyncHandler } from '../utils/asyncHandler.js'
import { getCookieOptions } from '../utils/cookies.js'
import { serializeUser, upsertAuthUser } from '../services/user.service.js'

const router = Router()

router.post(
  '/jwt',
  asyncHandler(async (req, res) => {
    const user = await upsertAuthUser(req.body)
    const safeUser = serializeUser(user)

    const token = jwt.sign(
      {
        email: safeUser.email,
        role: safeUser.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    )

    res.cookie('token', token, getCookieOptions()).json({
      success: true,
      message: 'Authentication token issued',
      data: safeUser,
    })
  }),
)

router.post('/logout', (req, res) => {
  res.clearCookie('token', getCookieOptions()).json({ success: true, message: 'Logged out' })
})

export default router
