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
      match: [/^\S+@\S+\.\S+$/, 'รูปแบบ email ไม่ถูกต้อง'],
    },

    password: {
      type: String,
      required: [true, 'กรุณากรอกรหัสผ่าน'],
      minlength: [6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'],
      select: false,
    },

    // ============ Security Question ============
    // คำตอบ "คุณชอบอาหารอะไร" เก็บแบบ hash
    securityAnswer: {
      type: String,
      required: [true, 'กรุณาตอบคำถามความปลอดภัย'],
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

    // ============ ระบบ Reset Password ============
    resetPasswordToken: { type: String, default: '' },
    resetPasswordExpire: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
)

// Hash password ก่อน save
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})

// Hash securityAnswer ก่อน save
userSchema.pre('save', async function () {
  if (!this.isModified('securityAnswer')) return
  const salt = await bcrypt.genSalt(10)
  // normalize lowercase + trim ก่อน hash เพื่อให้ตอบได้ case-insensitive
  this.securityAnswer = await bcrypt.hash(this.securityAnswer.trim().toLowerCase(), salt)
})

// เปรียบเทียบรหัสผ่านตอน login
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

// เปรียบเทียบคำตอบ security question
userSchema.methods.compareSecurityAnswer = async function (answer) {
  return await bcrypt.compare(answer.trim().toLowerCase(), this.securityAnswer)
}

const User = mongoose.model('User', userSchema)

export default User