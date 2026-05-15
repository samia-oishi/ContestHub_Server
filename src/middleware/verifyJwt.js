import jwt from 'jsonwebtoken'

export function verifyJwt(req, res, next) {
  const token = req.cookies?.token

  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized access' })
  }

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured')
    }

    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' })
  }
}
