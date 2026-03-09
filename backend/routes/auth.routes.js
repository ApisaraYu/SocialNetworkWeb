import express from 'express'
import {
  register,
  verifyEmail,
  resendOTP,
  login,
  logout,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller.js'
import { authLimiter, otpLimiter } from '../middleware/rateLimit.middleware.js'
import { protect } from '../middleware/auth.middleware.js'

const router = express.Router()

// sign up
router.post('/register', authLimiter, register)

// ยืนยันอีเมล์
router.post('/verify-email', otpLimiter, verifyEmail)

// ขอ OTP ใหม่
router.post('/resend-otp', otpLimiter, resendOTP)

// log in
router.post('/login', authLimiter, login)

// log out
router.post('/logout', protect, logout)

// ลืมรหัสผ่าน
router.post('/forgot-password', otpLimiter, forgotPassword)

// รีเซ็ตรหัสผ่าน
router.post('/reset-password', resetPassword)

export default router