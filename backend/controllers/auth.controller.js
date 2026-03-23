import crypto from 'crypto'
import User from '../models/User.js'
import { sendTokenResponse } from '../utils/generateToken.js'
import { successResponse, errorResponse } from '../utils/apiResponse.js'

// ============ ตรวจสอบ password ============
const validatePassword = (password) => {
  if (password.length < 8) return 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'
  if (!/[A-Z]/.test(password)) return 'รหัสผ่านต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว'
  if (!/[a-z]/.test(password)) return 'รหัสผ่านต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัว'
  if (!/[0-9]/.test(password)) return 'รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว'
  return null
}

// ============ sign up ============
export const register = async (req, res, next) => {
  try {
    const { username, email, password, securityAnswer } = req.body

    if (!securityAnswer || !securityAnswer.trim()) {
      return errorResponse(res, 400, 'กรุณาตอบคำถามความปลอดภัย')
    }

    // ตรวจสอบว่า email หรือ username ซ้ำไหม
    const existingUser = await User.findOne({ $or: [{ email }, { username }] })
    if (existingUser) {
      return errorResponse(
        res, 400,
        existingUser.email === email ? 'Email นี้ถูกใช้งานแล้ว' : 'Username นี้ถูกใช้งานแล้ว'
      )
    }

    // ตรวจสอบ password
    const passwordError = validatePassword(password)
    if (passwordError) return errorResponse(res, 400, passwordError)

    // สร้าง user — securityAnswer จะถูก hash อัตโนมัติใน pre-save hook
    const user = await User.create({ username, email, password, securityAnswer })

    // สมัครสำเร็จ → ส่ง token กลับเลย (ไม่ต้องยืนยัน email)
    sendTokenResponse(res, user, 201)
  } catch (error) {
    next(error)
  }
}

// ============ log in ============
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email }).select('+password')
    if (!user) return errorResponse(res, 401, 'Email หรือรหัสผ่านไม่ถูกต้อง')

    const isMatch = await user.comparePassword(password)
    if (!isMatch) return errorResponse(res, 401, 'Email หรือรหัสผ่านไม่ถูกต้อง')

    sendTokenResponse(res, user, 200)
  } catch (error) {
    next(error)
  }
}

// ============ log out ============
export const logout = async (req, res, next) => {
  try {
    res.clearCookie('refreshToken')
    return successResponse(res, 200, 'ออกจากระบบสำเร็จ')
  } catch (error) {
    next(error)
  }
}

// ============ ลืมรหัสผ่าน — ตรวจสอบด้วย Security Question ============
// Step 1: รับ email + securityAnswer → ถ้าถูกส่ง resetToken กลับ
export const forgotPassword = async (req, res, next) => {
  try {
    const { email, securityAnswer } = req.body

    if (!email || !securityAnswer) {
      return errorResponse(res, 400, 'กรุณากรอกอีเมล์และคำตอบให้ครบ')
    }

    const user = await User.findOne({ email }).select('+securityAnswer')
    if (!user) {
      // ตอบกำกวมเพื่อไม่ให้เดา email ได้
      return errorResponse(res, 400, 'ข้อมูลไม่ถูกต้อง')
    }

    const isMatch = await user.compareSecurityAnswer(securityAnswer)
    if (!isMatch) {
      return errorResponse(res, 400, 'คำตอบไม่ถูกต้อง')
    }

    // สร้าง resetToken ชั่วคราว หมดอายุใน 15 นาที
    const resetToken = crypto.randomBytes(32).toString('hex')
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex')
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000
    await user.save()

    return successResponse(res, 200, 'ตอบคำถามถูกต้อง', { resetToken })
  } catch (error) {
    next(error)
  }
}

// ============ รีเซ็ตรหัสผ่าน ============
// Step 2: รับ resetToken + newPassword → อัปเดตรหัสผ่าน
export const resetPassword = async (req, res, next) => {
  try {
    const { resetToken, newPassword } = req.body

    if (!resetToken || !newPassword) {
      return errorResponse(res, 400, 'ข้อมูลไม่ครบถ้วน')
    }

    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex')

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    })

    if (!user) {
      return errorResponse(res, 400, 'Token ไม่ถูกต้องหรือหมดอายุแล้ว กรุณาเริ่มใหม่อีกครั้ง')
    }

    const passwordError = validatePassword(newPassword)
    if (passwordError) return errorResponse(res, 400, passwordError)

    user.password = newPassword
    user.resetPasswordToken = ''
    user.resetPasswordExpire = null
    await user.save()

    return successResponse(res, 200, 'รีเซ็ตรหัสผ่านสำเร็จ')
  } catch (error) {
    next(error)
  }
}