import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'กรุณากรอก username'],
      unique: true,
      trim: true,
      minlength: [3, 'Username ต้องมีอย่างน้อย 3 ตัวอักษร'],
      maxlength: [30, 'Username ต้องไม่เกิน 30 ตัวอักษร'],
    },

    email: {
      type: String,
      required: [true, 'กรุณากรอก email'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'รูปแบบ email ไม่ถูกต้อง'], //pattern สำหรับเช็ค email
    },

    password: {
      type: String,
      required: [true, 'กรุณากรอกรหัสผ่าน'],
      minlength: [6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'],
      select: false,
    },

    avatar: {
      url: { type: String, default: '' },
      key: { type: String, default: '' },
    },

    coverPhoto: {
      url: { type: String, default: '' },
      key: { type: String, default: '' },
    },

    bio: {
      type: String,
      maxlength: [200, 'Bio ต้องไม่เกิน 200 ตัวอักษร'],
      default: '',
    },

    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    friendRequests: [
      {
        from: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // ============ ระบบยืนยัน Email ตอนสมัคร ============

    // สถานะว่า verify email แล้วหรือยัง
    isVerified: { type: Boolean, default: false },

    // OTP สำหรับยืนยัน Email ตอนสมัคร
    // เก็บเป็น hash เพื่อความปลอดภัย ไม่เก็บ OTP ตรงๆ
    verifyOtp: { type: String, default: '' },

    // วันหมดอายุของ OTP ยืนยัน Email (10 นาที)
    verifyOtpExpire: { type: Date, default: null },

    // ============ ระบบลืมรหัสผ่าน ============

    // OTP สำหรับ reset รหัสผ่าน
    resetPasswordOtp: { type: String, default: '' },

    // วันหมดอายุของ OTP reset รหัสผ่าน (10 นาที)
    resetPasswordOtpExpire: { type: Date, default: null },

    // token สำหรับ reset รหัสผ่าน (ใช้คู่กับ OTP)
    resetPasswordToken: { type: String, default: '' },
    resetPasswordExpire: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
)

// Hash password ก่อน save ทุกครั้ง
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

// เปรียบเทียบรหัสผ่านตอน login
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

// ตรวจสอบ OTP ว่าถูกต้องและยังไม่หมดอายุ
// type = 'verify' ยืนยัน email หรือ ลืมรหัสผ่าน
userSchema.methods.verifyOtpCode = async function (otp, type) {
  if (type === 'verify') {
    // ตรวจว่า OTP หมดอายุหรือยัง
    if (Date.now() > this.verifyOtpExpire) return false
    // เปรียบเทียบ OTP กับที่เก็บไว้
    return await bcrypt.compare(otp, this.verifyOtp)
  }

  if (type === 'reset') {
    if (Date.now() > this.resetPasswordOtpExpire) return false
    return await bcrypt.compare(otp, this.resetPasswordOtp)
  }

  return false
}

const User = mongoose.model('User', userSchema)

export default User