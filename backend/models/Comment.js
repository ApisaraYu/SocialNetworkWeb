import mongoose from 'mongoose'

const commentSchema = new mongoose.Schema(
  {
    // โพสต์ที่คอมเมนต์นี้อยู่
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },

    // เจ้าของคอมเมนต์
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // เนื้อหาคอมเมนต์
    content: {
      type: String,
      required: [true, 'กรุณากรอกข้อความคอมเมนต์'],
      maxlength: [500, 'คอมเมนต์ต้องไม่เกิน 500 ตัวอักษร'],
      trim: true,
    },

    // รูปที่แนบมากับคอมเมนต์ (ถ้ามี)
    media: {
      url: { type: String, default: '' },
      key: { type: String, default: '' },
      type: {
        type: String,
        enum: ['image', 'video', ''],
        default: '',
      },
    },

    // สำหรับ Reply (ตอบกลับคอมเมนต์)
    // ถ้าเป็น null = คอมเมนต์หลัก
    // ถ้ามีค่า = เป็น reply ของคอมเมนต์นั้น
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },

    // จำนวนไลค์คอมเมนต์
    likesCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
)

// ============ Indexes ============

// ดึงคอมเมนต์ของโพสต์นั้นๆ เรียงจากเก่าไปใหม่
commentSchema.index({ post: 1, createdAt: 1 })

// ดึง reply ของคอมเมนต์นั้นๆ
commentSchema.index({ parentComment: 1, createdAt: 1 })

const Comment = mongoose.model('Comment', commentSchema)

export default Comment