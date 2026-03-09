// format response สำเร็จ
// ใช้เมื่อ request สำเร็จ เช่น ดึงข้อมูลได้, สร้างข้อมูลสำเร็จ
const successResponse = (res, statusCode, message, data = null) => {
  const response = {
    success: true,
    message,
  }

  // ถ้ามี data ให้แนบไปด้วย
  if (data !== null) {
    response.data = data
  }

  return res.status(statusCode).json(response)
}

// format response เมื่อเกิด error
// ใช้เมื่อ request ล้มเหลว เช่น ข้อมูลไม่ถูกต้อง, ไม่มีสิทธิ์
const errorResponse = (res, statusCode, message, errors = null) => {
  const response = {
    success: false,
    message,
  }

  // ถ้ามี errors เพิ่มเติม เช่น validation errors ให้แนบไปด้วย
  if (errors !== null) {
    response.errors = errors
  }

  return res.status(statusCode).json(response)
}

export { successResponse, errorResponse }