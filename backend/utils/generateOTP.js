import bcrypt from 'bcryptjs'

// สร้าง OTP แบบสุ่ม 6 หลัก
const generateOTP = () => {
  // Math.random() สร้างเลขสุ่ม 0-1
  // คูณด้วย 900000 + 100000 เพื่อให้ได้เลข 6 หลักเสมอ (100000 - 999999)
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Hash OTP ก่อนเก็บลง DB เพื่อความปลอดภัย
// เหมือนกับที่ hash password
const hashOTP = async (otp) => {
  const salt = await bcrypt.genSalt(10)
  return await bcrypt.hash(otp, salt)
}

// คำนวณเวลาหมดอายุของ OTP
// defaultMinutes = 10 นาที ถ้าไม่ได้ระบุ
const getOTPExpire = (minutes = 10) => {
  return new Date(Date.now() + minutes * 60 * 1000)
}

export { generateOTP, hashOTP, getOTPExpire }