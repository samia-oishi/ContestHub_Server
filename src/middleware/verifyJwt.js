import jwt from 'jsonwebtoken'
import { findUserByEmail, serializeUser } from '../services/user.service.js'

export async function verifyJwt(req, res, next) {
  const token = req.cookies?.token

  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized access' })
  }

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured')
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await findUserByEmail(decoded.email)

    if (!user) {
      return res.status(401).json({ success: false, message: 'User profile not found' })
    }

    req.user = serializeUser(user)
    next()
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' })
  }
}
