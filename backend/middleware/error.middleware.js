import { errorResponse } from '../utils/apiResponse.js'

// Global Error Handler
// รับ error ทั้งหมดที่ถูกส่งมาจาก next(error) ใน controllers
// ต้องวางไว้หลัง routes ทั้งหมดใน server.js เสมอ
const errorHandler = (err, req, res, next) => {

  // แสดง error ใน console สำหรับ debug (เฉพาะ development)
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err)
  }

  // Mongoose Validation Error
  // เกิดเมื่อข้อมูลไม่ตรงกับ Schema เช่น required field ขาดหาย
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }))
    return errorResponse(res, 400, 'ข้อมูลไม่ถูกต้อง', errors)
  }

  // Mongoose Duplicate Key Error
  // เกิดเมื่อ unique field ซ้ำกัน เช่น email หรือ username ซ้ำ
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0]
    return errorResponse(res, 400, `${field} นี้ถูกใช้งานแล้ว`)
  }

  // Mongoose Cast Error
  // เกิดเมื่อ id ที่ส่งมาไม่ใช่ ObjectId ที่ถูกต้อง
  if (err.name === 'CastError') {
    return errorResponse(res, 400, 'รูปแบบข้อมูลไม่ถูกต้อง')
  }

  // JWT Error
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 401, 'Token ไม่ถูกต้อง')
  }

  // JWT Expired Error
  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 401, 'Token หมดอายุ กรุณาเข้าสู่ระบบใหม่')
  }

  // Multer Error (อัปโหลดไฟล์)
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return errorResponse(res, 400, 'ไฟล์มีขนาดใหญ่เกินไป สูงสุด 50MB')
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return errorResponse(res, 400, 'อัปโหลดได้สูงสุด 5 ไฟล์')
    }
    return errorResponse(res, 400, err.message)
  }

  // Error อื่นๆ ที่ไม่ได้ระบุ
  return errorResponse(
    res,
    err.status || 500,
    err.message || 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์'
  )
}

export default errorHandler