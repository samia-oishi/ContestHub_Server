import { Router } from 'express'
import { createContactMessage } from '../services/contact.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = await createContactMessage(req.body)
    res.status(201).json({ success: true, message: 'Message sent', data })
  }),
)

export default router
