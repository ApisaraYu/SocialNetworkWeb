import mongoose from 'mongoose'

const conversationSchema = new mongoose.Schema(
  {
    // ผู้เข้าร่วมในการสนทนา
    // direct = 2 คน, group = มากกว่า 2 คน
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],

    // ประเภทการสนทนา
    // direct = แชท 1-1, group = ห้องรวม
    type: {
      type: String,
      enum: ['direct', 'group'],
      default: 'direct',
    },

    // ชื่อห้องแชท (ใช้เฉพาะ type = 'group')
    name: {
      type: String,
      default: '',
      trim: true,
    },

    // รูปห้องแชท (ใช้เฉพาะ type = 'group')
    avatar: {
      url: { type: String, default: '' },
      key: { type: String, default: '' },
    },

    // ข้อความล่าสุดในห้องแชท
    // ใช้แสดงใน inbox โดยไม่ต้อง query Message ทุกครั้ง
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },

    // admin ของห้องแชทกลุ่ม
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
)

// ============ Indexes ============

// ดึงห้องแชททั้งหมดของ user นั้นๆ เรียงจากใหม่ไปเก่า
conversationSchema.index({ participants: 1, updatedAt: -1 })

const Conversation = mongoose.model('Conversation', conversationSchema)

export default Conversation