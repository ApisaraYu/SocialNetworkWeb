import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema(
  {
    // ห้องแชทที่ข้อความนี้อยู่
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },

    // คนที่ส่งข้อความ
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // เนื้อหาข้อความ (ไม่ required เผื่อส่งแค่รูป/วิดีโออย่างเดียว)
    content: {
      type: String,
      maxlength: [2000, 'ข้อความต้องไม่เกิน 2000 ตัวอักษร'],
      default: '',
      trim: true,
    },

    // ไฟล์รูป/วิดีโอที่แนบมากับข้อความ
    media: [
      {
        url: { type: String, required: true },
        key: { type: String, required: true }, // key ใน S3 สำหรับลบไฟล์
        type: {
          type: String,
          enum: ['image', 'video'],
          required: true,
        },
      },
    ],

    // รายชื่อ user ที่อ่านข้อความนี้แล้ว
    readBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        readAt: { type: Date, default: Date.now }, // เวลาที่อ่าน
      },
    ],

    // ข้อความที่ถูก reply (ถ้ามี)
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },

    // สถานะว่าข้อความถูกลบหรือยัง
    // ใช้ soft delete แทนการลบจริง
    // เพื่อให้คนอื่นยังเห็นว่า "ข้อความถูกลบแล้ว"
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
)

// ============ Indexes ============

// ดึงข้อความทั้งหมดในห้องแชทนั้นๆ เรียงจากเก่าไปใหม่
messageSchema.index({ conversation: 1, createdAt: 1 })

// ดึงข้อความที่ยังไม่ได้อ่าน
messageSchema.index({ 'readBy.user': 1 })

const Message = mongoose.model('Message', messageSchema)

export default Message