import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { getFirebaseAuth } from '../config/firebase.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { getCookieOptions } from '../utils/cookies.js'
import { serializeUser, upsertAuthUser } from '../services/user.service.js'

const router = Router()

router.post(
  '/jwt',
  asyncHandler(async (req, res) => {
    const idToken = req.body.idToken

    if (!idToken) {
      return res.status(400).json({ success: false, message: 'Firebase token is required' })
    }

    let decodedToken

    try {
      decodedToken = await getFirebaseAuth().verifyIdToken(idToken)
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid Firebase token' })
    }

    if (!decodedToken.email) {
      return res.status(400).json({ success: false, message: 'Firebase account email is required' })
    }

    const user = await upsertAuthUser({
      name: req.body.name || decodedToken.name,
      email: decodedToken.email,
      photoURL: req.body.photoURL || decodedToken.picture,
      role: req.body.role,
    })
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
