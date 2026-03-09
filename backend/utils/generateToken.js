import jwt from 'jsonwebtoken'

// สร้าง Access Token อายุสั้น (15 นาที)
// ใช้สำหรับ authenticate request ทั่วไป
const generateAccessToken = (userId) => {
  return jwt.sign(
    { id: userId },                         // payload ที่เก็บใน token
    process.env.JWT_SECRET,                 // secret key สำหรับ sign token
    { expiresIn: process.env.JWT_EXPIRE || '15m' }
  )
}

// สร้าง Refresh Token อายุยาว (7 วัน)
// ใช้สำหรับขอ Access Token ใหม่เมื่อหมดอายุ
// โดยไม่ต้อง login ใหม่
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  )
}

// ส่ง token กลับไปยัง client ผ่าน HttpOnly Cookie
// HttpOnly = JavaScript ฝั่ง client เข้าถึง cookie ไม่ได้
// ป้องกันการโจมตีแบบ XSS
const sendTokenResponse = (res, user, statusCode) => {
  const accessToken = generateAccessToken(user._id)
  const refreshToken = generateRefreshToken(user._id)

  // ตัวเลือก cookie
  const cookieOptions = {
    httpOnly: true,   // JavaScript เข้าถึงไม่ได้
    secure: process.env.NODE_ENV === 'production', // HTTPS เท่านั้นใน production
    sameSite: 'strict', // ป้องกัน CSRF
  }

  // เก็บ Refresh Token ใน cookie (7 วัน)
  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 วัน (milliseconds)
  })

  // ส่ง Access Token กลับใน response body
  res.status(statusCode).json({
    success: true,
    accessToken,
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      isVerified: user.isVerified,
    },
  })
}

export { generateAccessToken, generateRefreshToken, sendTokenResponse }