import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { errorResponse } from '../utils/apiResponse.js'

// ตรวจสอบว่า request มี Access Token ที่ถูกต้องไหม
// ใช้กับ route ที่ต้อง login ก่อนถึงจะเข้าได้
const protect = async (req, res, next) => {
  try {
    let token

    // ดึง token จาก Authorization header
    // รูปแบบ: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
    }

    // ถ้าไม่มี token ส่ง error กลับทันที
    if (!token) {
      return errorResponse(res, 401, 'กรุณาเข้าสู่ระบบก่อน')
    }

    // ตรวจสอบว่า token ถูกต้องและยังไม่หมดอายุ
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // ดึงข้อมูล user จาก DB โดยใช้ id ที่อยู่ใน token
    // ไม่ดึง password มาด้วย (select: false ใน User model)
    const user = await User.findById(decoded.id).select('-password')

    // ถ้าไม่เจอ user (อาจถูกลบไปแล้ว)
    if (!user) {
      return errorResponse(res, 401, 'ไม่พบผู้ใช้งาน')
    }

    // เก็บข้อมูล user ไว้ใน req เพื่อให้ controller ใช้ต่อได้
    req.user = user
    next()

  } catch (error) {
    // token หมดอายุ
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 401, 'Token หมดอายุ กรุณาเข้าสู่ระบบใหม่')
    }
    // token ไม่ถูกต้อง
    if (error.name === 'JsonWebTokenError') {
      return errorResponse(res, 401, 'Token ไม่ถูกต้อง')
    }
    return errorResponse(res, 500, 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง')
  }
}

// ตรวจสอบว่า user ยืนยัน email แล้วหรือยัง
const isVerified = (req, res, next) => {
  if (!req.user.isVerified) {
    return errorResponse(res, 403, 'กรุณายืนยัน email ก่อนใช้งาน')
  }
  next()
}

export { protect, isVerified }