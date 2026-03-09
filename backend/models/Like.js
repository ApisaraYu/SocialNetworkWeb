import mongoose from 'mongoose'

const likeSchema = new mongoose.Schema(
  {
    // คนที่กดไลค์
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // อ้างอิงไปยัง document ที่ถูกไลค์
    // เก็บ id ของ Post, Comment, หรือ GroupPost
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    // ประเภทของสิ่งที่ถูกไลค์
    targetType: {
      type: String,
      enum: ['Post', 'Comment', 'GroupPost'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

// ============ Indexes ============

// ป้องกันไลค์ซ้ำ — user คนเดียวกันไลค์ target เดียวกันได้แค่ครั้งเดียว
likeSchema.index({ user: 1, targetId: 1, targetType: 1 }, { unique: true })

// ดึงไลค์ทั้งหมดของ target นั้นๆ
likeSchema.index({ targetId: 1, targetType: 1 })

const Like = mongoose.model('Like', likeSchema)

export default Like