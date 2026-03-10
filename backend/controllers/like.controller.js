import Like from '../models/Like.js'
import Post from '../models/Post.js'
import Comment from '../models/Comment.js'
import GroupPost from '../models/GroupPost.js'
import { successResponse, errorResponse } from '../utils/apiResponse.js'

// Toggle Like (กดไลค์/ถอนไลค์)
export const toggleLike = async (req, res, next) => {
  try {
    const { targetType, targetId } = req.params

    // ตรวจสอบว่า targetType ถูกต้องไหม
    const validTypes = ['Post', 'Comment', 'GroupPost']
    if (!validTypes.includes(targetType)) {
      return errorResponse(res, 400, 'ประเภทไม่ถูกต้อง')
    }

    // ตรวจสอบว่า target มีอยู่จริงไหม
    let target
    if (targetType === 'Post') target = await Post.findById(targetId)
    else if (targetType === 'Comment') target = await Comment.findById(targetId)
    else if (targetType === 'GroupPost') target = await GroupPost.findById(targetId)

    if (!target) return errorResponse(res, 404, 'ไม่พบข้อมูล')

    // ตรวจสอบว่าไลค์ไปแล้วหรือยัง
    const existingLike = await Like.findOne({
      user: req.user.id,
      targetId,
      targetType,
    })

    if (existingLike) {
      // ถ้าไลค์แล้ว → ถอนไลค์
      await existingLike.deleteOne()

      // ลดจำนวนไลค์
      await getTargetModel(targetType).findByIdAndUpdate(targetId, {
        $inc: { likesCount: -1 },
      })

      return successResponse(res, 200, 'ถอนไลค์สำเร็จ', { liked: false })
    } else {
      // ถ้ายังไม่ไลค์ → กดไลค์
      await Like.create({ user: req.user.id, targetId, targetType })

      // เพิ่มจำนวนไลค์
      await getTargetModel(targetType).findByIdAndUpdate(targetId, {
        $inc: { likesCount: 1 },
      })

      return successResponse(res, 200, 'กดไลค์สำเร็จ', { liked: true })
    }
  } catch (error) {
    next(error)
  }
}

// ดึงจำนวนและสถานะไลค์
export const getLikeStatus = async (req, res, next) => {
  try {
    const { targetType, targetId } = req.params

    // เช็คว่า user นี้ไลค์แล้วหรือยัง
    const existingLike = await Like.findOne({
      user: req.user.id,
      targetId,
      targetType,
    })

    // นับจำนวนไลค์ทั้งหมด
    const likesCount = await Like.countDocuments({ targetId, targetType })

    return successResponse(res, 200, 'ดึงข้อมูลสำเร็จ', {
      liked: !!existingLike,  // true ถ้าไลค์แล้ว, false ถ้ายังไม่ไลค์
      likesCount,
    })
  } catch (error) {
    next(error)
  }
}

// ============ Helper Function ============
// คืนค่า Model ตาม targetType
const getTargetModel = (targetType) => {
  if (targetType === 'Post') return Post
  if (targetType === 'Comment') return Comment
  if (targetType === 'GroupPost') return GroupPost
}