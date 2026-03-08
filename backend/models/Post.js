import mongoose from 'mongoose'

const postSchema = new mongoose.Schema(
  {
    // เจ้าของโพสต์ อ้างอิงไปยัง User Model
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // เนื้อหาโพสต์ (ไม่ required เผื่อโพสต์แค่รูปอย่างเดียว)
    content: {
      type: String,
      maxlength: [2000, 'โพสต์ต้องไม่เกิน 2000 ตัวอักษร'],
      default: '',
    },

    // ไฟล์รูป/วิดีโอที่แนบมากับโพสต์ (เก็บ URL จาก AWS S3)
    media: [
      {
        url: { type: String, required: true },  // URL สำหรับแสดงผล
        key: { type: String, required: true },  // key ใน S3 สำหรับลบไฟล์
        type: {
          type: String,
          enum: ['image', 'video'],// รับแค่ image หรือ video เท่านั้น
          required: true,
        },
      },
    ],

    // จำนวนไลค์ (เก็บตัวเลขไว้เลยเพื่อความเร็ว ไม่ต้องนับทุกครั้ง)
    likesCount: { type: Number, default: 0 },

    // จำนวนคอมเมนต์
    commentsCount: { type: Number, default: 0 },

    // การมองเห็นโพสต์
    // public = ทุกคนเห็น, friends = เฉพาะเพื่อน, private = เฉพาะตัวเอง
    visibility: {
      type: String,
      enum: ['public', 'friends', 'private'],
      default: 'public',
    },
  },
  {
    // สร้าง createdAt และ updatedAt อัตโนมัติ
    // ใช้ createdAt สำหรับเรียงลำดับ Timeline
    timestamps: true,
  }
)

// เพิ่ม index เพื่อให้ query Timeline เร็วขึ้น
// เรียงโพสต์จากใหม่ไปเก่าตาม createdAt
postSchema.index({ author: 1, createdAt: -1 })

// index สำหรับ query โพสต์ตาม visibility
postSchema.index({ visibility: 1, createdAt: -1 })

const Post = mongoose.model('Post', postSchema)

export default Post