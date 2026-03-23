import express from 'express'
import {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller.js'
import { authLimiter } from '../middleware/rateLimit.middleware.js'
import { protect } from '../middleware/auth.middleware.js'

const router = express.Router()

// sign up
router.post('/register', authLimiter, register)

// log in
router.post('/login', authLimiter, login)

// log out
router.post('/logout', protect, logout)

// ลืมรหัสผ่าน (ตรวจสอบด้วย security question)
router.post('/forgot-password', authLimiter, forgotPassword)

// รีเซ็ตรหัสผ่าน
router.post('/reset-password', resetPassword)

export default router