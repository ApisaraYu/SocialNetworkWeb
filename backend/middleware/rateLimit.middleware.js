import rateLimit from 'express-rate-limit'

// Rate Limit ทั่วไป สำหรับทุก API
// จำกัด 100 requests ต่อ 15 นาที ต่อ IP
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 นาที
  max: 100,
  message: {
    success: false,
    message: 'มีการส่ง request มากเกินไป กรุณาลองใหม่ใน 15 นาที',
  },
  standardHeaders: true, // ส่ง rate limit info ใน headers กลับไปด้วย
  legacyHeaders: false,
})

// Rate Limit สำหรับ Authentication
// เข้มงวดกว่า เพื่อป้องกัน brute force attack
// จำกัด 10 requests ต่อ 15 นาที ต่อ IP
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 นาที
  max: process.env.NODE_ENV === 'production' ? 10 : 100,
  message: {
    success: false,
    message: 'พยายาม login มากเกินไป กรุณาลองใหม่ใน 15 นาที',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Rate Limit สำหรับส่ง OTP
// จำกัด 5 requests ต่อ 1 ชั่วโมง ต่อ IP
// ป้องกันการส่ง email spam
export const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 ชั่วโมง
  max: 5,
  message: {
    success: false,
    message: 'ขอ OTP มากเกินไป กรุณาลองใหม่ใน 1 ชั่วโมง',
  },
  standardHeaders: true,
  legacyHeaders: false,
})