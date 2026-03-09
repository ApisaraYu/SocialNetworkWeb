import mongoose from 'mongoose'

const groupPostSchema = new mongoose.Schema(
  {
    // กลุ่มที่โพสต์นี้อยู่
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },

    // เจ้าของโพสต์ (ต้องเป็นสมาชิกกลุ่มเท่านั้น)
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // เนื้อหาโพสต์
    content: {
      type: String,
      maxlength: [2000, 'โพสต์ต้องไม่เกิน 2000 ตัวอักษร'],
      default: '',
    },

    // ไฟล์รูป/วิดีโอที่แนบมากับโพสต์
    media: [
      {
        url: { type: String, required: true },
        key: { type: String, required: true },
        type: {
          type: String,
          enum: ['image', 'video'],
          required: true,
        },
      },
    ],

    // จำนวนไลค์
    likesCount: { type: Number, default: 0 },

    // จำนวนคอมเมนต์
    commentsCount: { type: Number, default: 0 },

    // สถานะโพสต์
    // pending = รอ admin อนุมัติ (ใช้เฉพาะกลุ่ม private)
    // approved = ผ่านการอนุมัติแล้ว
    // rejected = ถูกปฏิเสธ
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved', // กลุ่ม public อนุมัติอัตโนมัติ
    },
  },
  {
    timestamps: true,
  }
)

// ============ Indexes ============

// ดึงโพสต์ทั้งหมดในกลุ่มนั้นๆ เรียงจากใหม่ไปเก่า
groupPostSchema.index({ group: 1, createdAt: -1 })

// ดึงโพสต์ที่รอ admin อนุมัติ
groupPostSchema.index({ group: 1, status: 1 })

// ดึงโพสต์ของ user ในกลุ่ม
groupPostSchema.index({ author: 1, group: 1 })

const GroupPost = mongoose.model('GroupPost', groupPostSchema)

export default GroupPost