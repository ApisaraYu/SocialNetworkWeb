import User from '../models/User.js'
import { generateOTP, hashOTP, getOTPExpire } from '../utils/generateOTP.js'
import { sendTokenResponse } from '../utils/generateToken.js'
import { sendVerifyOTP, sendResetPasswordOTP } from '../services/email.service.js'
import { successResponse, errorResponse } from '../utils/apiResponse.js'

// ============ ตรวจสอบ password ============
const validatePassword = (password) => {
  if (password.length < 8) return 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'
  if (!/[A-Z]/.test(password)) return 'รหัสผ่านต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว'
  if (!/[a-z]/.test(password)) return 'รหัสผ่านต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัว'
  if (!/[0-9]/.test(password)) return 'รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว'
  return null
}
// sign up
export const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body

    // ตรวจสอบว่า email หรือ username ซ้ำไหม
    const existingUser = await User.findOne({ $or: [{ email }, { username }] })
    if (existingUser) {
      return errorResponse(res, 400,
        existingUser.email === email ? 'Email นี้ถูกใช้งานแล้ว' : 'Username นี้ถูกใช้งานแล้ว'
      )
    }
    // ตรวจสอบ password
    const passwordError = validatePassword(password)
    if (passwordError) return errorResponse(res, 400, passwordError)
    
      // สร้าง OTP สำหรับยืนยัน email
    const otp = generateOTP()
    const hashedOTP = await hashOTP(otp)
    const otpExpire = getOTPExpire(10) // หมดอายุใน 10 นาที

    // สร้าง user ใหม่
    const user = await User.create({
      username,
      email,
      password,
      verifyOtp: hashedOTP,
      verifyOtpExpire: otpExpire,
    })

    // ส่ง OTP ไปทาง email
    await sendVerifyOTP(email, otp)

    return successResponse(res, 201, 'สมัครสมาชิกสำเร็จ กรุณายืนยัน email ของคุณ')

  } catch (error) {
    next(error)
  }
}

// ยืนยัน Email
export const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return errorResponse(res, 404, 'ไม่พบผู้ใช้งาน')
    }

    // ตรวจสอบว่า verify แล้วหรือยัง
    if (user.isVerified) {
      return errorResponse(res, 400, 'Email นี้ยืนยันแล้ว')
    }

    // ตรวจสอบ OTP
    const isValid = await user.verifyOtpCode(otp, 'verify')
    if (!isValid) {
      return errorResponse(res, 400, 'OTP ไม่ถูกต้องหรือหมดอายุแล้ว')
    }

    // อัปเดตสถานะ
    user.isVerified = true
    user.verifyOtp = ''
    user.verifyOtpExpire = null
    await user.save()

    return successResponse(res, 200, 'ยืนยัน Email สำเร็จ')

  } catch (error) {
    next(error)
  }
}

// ขอ OTP ใหม่
export const resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return errorResponse(res, 404, 'ไม่พบผู้ใช้งาน')
    }

    if (user.isVerified) {
      return errorResponse(res, 400, 'Email นี้ยืนยันแล้ว')
    }

    // สร้าง OTP ใหม่
    const otp = generateOTP()
    user.verifyOtp = await hashOTP(otp)
    user.verifyOtpExpire = getOTPExpire(10)
    await user.save()

    await sendVerifyOTP(email, otp)

    return successResponse(res, 200, 'ส่ง OTP ใหม่สำเร็จ กรุณาตรวจสอบ email')

  } catch (error) {
    next(error)
  }
}

// log in
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    // ดึง password มาด้วย (select: false ใน model)
    const user = await User.findOne({ email }).select('+password')
    if (!user) {
      return errorResponse(res, 401, 'Email หรือรหัสผ่านไม่ถูกต้อง')
    }

    // ตรวจสอบรหัสผ่าน
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return errorResponse(res, 401, 'Email หรือรหัสผ่านไม่ถูกต้อง')
    }

    // ตรวจสอบว่า verify email แล้วหรือยัง
    if (!user.isVerified) {
      return errorResponse(res, 403, 'กรุณายืนยัน email ก่อนเข้าสู่ระบบ')
    }

    // ส่ง token กลับไป
    sendTokenResponse(res, user, 200)

  } catch (error) {
    next(error)
  }
}

// log out
export const logout = async (req, res, next) => {
  try {
    // ลบ refreshToken cookie
    res.clearCookie('refreshToken')
    return successResponse(res, 200, 'ออกจากระบบสำเร็จ')

  } catch (error) {
    next(error)
  }
}

// ลืมรหัสผ่าน
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return errorResponse(res, 404, 'ไม่พบผู้ใช้งาน')
    }

    // สร้าง OTP สำหรับ reset รหัสผ่าน
    const otp = generateOTP()
    user.resetPasswordOtp = await hashOTP(otp)
    user.resetPasswordOtpExpire = getOTPExpire(10)
    await user.save()

    await sendResetPasswordOTP(email, otp)

    return successResponse(res, 200, 'ส่ง OTP สำหรับรีเซ็ตรหัสผ่านแล้ว กรุณาตรวจสอบ email')

  } catch (error) {
    next(error)
  }
}

// รีเซ็ตรหัส
export const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return errorResponse(res, 404, 'ไม่พบผู้ใช้งาน')
    }

    // ตรวจสอบ OTP
    const isValid = await user.verifyOtpCode(otp, 'reset')
    if (!isValid) {
      return errorResponse(res, 400, 'OTP ไม่ถูกต้องหรือหมดอายุแล้ว')
    }

    // อัปเดตรหัสผ่านใหม่
    user.password = newPassword
    user.resetPasswordOtp = ''
    user.resetPasswordOtpExpire = null
    await user.save()

    return successResponse(res, 200, 'รีเซ็ตรหัสผ่านสำเร็จ')

  } catch (error) {
    next(error)
  }
}