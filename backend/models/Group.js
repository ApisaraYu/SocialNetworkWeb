import mongoose from 'mongoose'

const groupSchema = new mongoose.Schema(
  {
    // ชื่อกลุ่ม
    name: {
      type: String,
      required: [true, 'กรุณากรอกชื่อกลุ่ม'],
      trim: true,
      maxlength: [100, 'ชื่อกลุ่มต้องไม่เกิน 100 ตัวอักษร'],
    },

    // คำอธิบายกลุ่ม
    description: {
      type: String,
      maxlength: [500, 'คำอธิบายกลุ่มต้องไม่เกิน 500 ตัวอักษร'],
      default: '',
    },

    // รูปโปรไฟล์กลุ่ม
    avatar: {
      url: { type: String, default: '' },
      key: { type: String, default: '' },
    },

    // รูปหน้าปกกลุ่ม
    coverPhoto: {
      url: { type: String, default: '' },
      key: { type: String, default: '' },
    },

    // คนสร้างกลุ่ม
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // สมาชิกในกลุ่ม
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        // role = admin (จัดการกลุ่มได้) หรือ member (สมาชิกทั่วไป)
        role: {
          type: String,
          enum: ['admin', 'member'],
          default: 'member',
        },
        joinedAt: { type: Date, default: Date.now },
      },
    ],

    // ประเภทกลุ่ม
    // public = ทุกคนเข้าร่วมได้เลย
    // private = ต้องรอ admin อนุมัติ
    privacy: {
      type: String,
      enum: ['public', 'private'],
      default: 'public',
    },

    // คำขอเข้าร่วมกลุ่ม (ใช้เฉพาะ privacy = 'private')
    joinRequests: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // จำนวนสมาชิก (เก็บตัวเลขไว้เลยเพื่อความเร็ว)
    membersCount: { type: Number, default: 1 },

    // จำนวนโพสต์ในกลุ่ม
    postsCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
)

// ============ Indexes ============

// ค้นหากลุ่มตามชื่อ
groupSchema.index({ name: 'text' })

// ดึงกลุ่มที่ user นั้นเป็นสมาชิกอยู่
groupSchema.index({ 'members.user': 1 })

// ดึงกลุ่มที่ user นั้นสร้าง
groupSchema.index({ creator: 1 })

const Group = mongoose.model('Group', groupSchema)

export default Group