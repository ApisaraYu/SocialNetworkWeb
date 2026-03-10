import Comment from '../models/Comment.js'
import Post from '../models/Post.js'
import { successResponse, errorResponse } from '../utils/apiResponse.js'

// ดึงคอมเมนต์ของโพสต์
export const getComments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    // ดึงเฉพาะคอมเมนต์หลัก (ไม่ใช่ reply)
    const comments = await Comment.find({
      post: req.params.postId,
      parentComment: null,
    })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username avatar')

    const total = await Comment.countDocuments({
      post: req.params.postId,
      parentComment: null,
    })

    return successResponse(res, 200, 'ดึงข้อมูลสำเร็จ', {
      comments,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalComments: total,
    })
  } catch (error) {
    next(error)
  }
}

// ดึง Reply ของคอมเมนต์
export const getReplies = async (req, res, next) => {
  try {
    const replies = await Comment.find({
      parentComment: req.params.commentId,
    })
      .sort({ createdAt: 1 })
      .populate('author', 'username avatar')

    return successResponse(res, 200, 'ดึงข้อมูลสำเร็จ', replies)
  } catch (error) {
    next(error)
  }
}

// สร้างคอมเมนต์
export const createComment = async (req, res, next) => {
  try {
    const { content, parentComment } = req.body

    if (!content) return errorResponse(res, 400, 'กรุณากรอกข้อความคอมเมนต์')

    // ตรวจสอบว่าโพสต์มีอยู่ไหม
    const post = await Post.findById(req.params.postId)
    if (!post) return errorResponse(res, 404, 'ไม่พบโพสต์')

    // ถ้าเป็น reply ตรวจสอบว่า parentComment มีอยู่ไหม
    if (parentComment) {
      const parent = await Comment.findById(parentComment)
      if (!parent) return errorResponse(res, 404, 'ไม่พบคอมเมนต์ที่ต้องการ reply')
    }

    const comment = await Comment.create({
      post: req.params.postId,
      author: req.user.id,
      content,
      parentComment: parentComment || null,
    })

    // เพิ่มจำนวนคอมเมนต์ในโพสต์
    await Post.findByIdAndUpdate(req.params.postId, {
      $inc: { commentsCount: 1 }
    })

    await comment.populate('author', 'username avatar')

    return successResponse(res, 201, 'คอมเมนต์สำเร็จ', comment)
  } catch (error) {
    next(error)
  }
}

// แก้ไขคอมเมนต์
export const updateComment = async (req, res, next) => {
  try {
    const { content } = req.body
    if (!content) return errorResponse(res, 400, 'กรุณากรอกข้อความคอมเมนต์')

    const comment = await Comment.findById(req.params.commentId)
    if (!comment) return errorResponse(res, 404, 'ไม่พบคอมเมนต์')

    // ตรวจสอบว่าเป็นเจ้าของคอมเมนต์ไหม
    if (comment.author.toString() !== req.user.id) {
      return errorResponse(res, 403, 'ไม่มีสิทธิ์แก้ไขคอมเมนต์นี้')
    }

    comment.content = content
    await comment.save()

    return successResponse(res, 200, 'แก้ไขคอมเมนต์สำเร็จ', comment)
  } catch (error) {
    next(error)
  }
}

// ลบคอมเมนต์
export const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId)
    if (!comment) return errorResponse(res, 404, 'ไม่พบคอมเมนต์')

    // ตรวจสอบว่าเป็นเจ้าของคอมเมนต์ไหม
    if (comment.author.toString() !== req.user.id) {
      return errorResponse(res, 403, 'ไม่มีสิทธิ์ลบคอมเมนต์นี้')
    }

    // ลบ reply ทั้งหมดของคอมเมนต์นี้ด้วย
    await Comment.deleteMany({ parentComment: req.params.commentId })

    await comment.deleteOne()

    // ลดจำนวนคอมเมนต์ในโพสต์
    await Post.findByIdAndUpdate(comment.post, {
      $inc: { commentsCount: -1 }
    })

    return successResponse(res, 200, 'ลบคอมเมนต์สำเร็จ')
  } catch (error) {
    next(error)
  }
}