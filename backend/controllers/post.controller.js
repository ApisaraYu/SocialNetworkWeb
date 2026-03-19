import Post from '../models/Post.js'
import User from '../models/User.js'
import { successResponse, errorResponse } from '../utils/apiResponse.js'
import { deleteFiles,getPresignedUrl} from '../services/upload.service.js'
import Like from '../models/Like.js'

// สร้างโพสต์
export const createPost = async (req, res, next) => {
  try {
    const { content, visibility } = req.body

    // ตรวจสอบว่ามีเนื้อหาหรือไฟล์อย่างน้อย 1 อย่าง
    if (!content && (!req.files || req.files.length === 0)) {
      return errorResponse(res, 400, 'กรุณากรอกเนื้อหาหรือแนบไฟล์')
    }

    // แปลงไฟล์ที่อัปโหลดเป็น media array
    const media = req.files?.map((file) => ({
      url: file.path,
      key: file.filename,
      type: file.mimetype.startsWith('image/') ? 'image' : 'video',
    })) || []

    const post = await Post.create({
      author: req.user.id,
      content,
      media,
      visibility: visibility || 'public',
    })

    // populate ข้อมูล author กลับไปด้วย
    await post.populate('author', 'username avatar')

    return successResponse(res, 201, 'สร้างโพสต์สำเร็จ', post)
  } catch (error) {
    next(error)
  }
}

// ดึง Timeline
export const getTimeline = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    // ดึง id ของเพื่อนทั้งหมด
    const user = await User.findById(req.user.id).select('friends')
    const friendIds = user.friends

    // ดึงโพสต์ของตัวเองและเพื่อน เรียงจากใหม่ไปเก่า
    const posts = await Post.find({
      author: { $in: [...friendIds, req.user.id] },
      visibility: { $in: ['public', 'friends'] },
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username avatar')

    // นับจำนวนโพสต์ทั้งหมด
    const total = await Post.countDocuments({
      author: { $in: [...friendIds, req.user.id] },
      visibility: { $in: ['public', 'friends'] },
    })

    const postsWithUrls = await Promise.all(
      posts.map(async (post) => {
        const postObj = post.toObject()

        // เช็คว่า user นี้ like แล้วไหม
        const liked = await Like.findOne({
          user: req.user.id,
          targetId: postObj._id,
          targetType: 'Post',
        })
        postObj.isLiked = !!liked

        if (postObj.media?.length > 0) {
          postObj.media = postObj.media.map((m) => ({ ...m, url: m.url }))
        }
        return postObj
      })
    )

    return successResponse(res, 200, 'ดึงข้อมูลสำเร็จ', {
      posts: postsWithUrls,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total,
    })
  } catch (error) {
    next(error)
  }
}

// ดูโพสต์เดี่ยว
export const getPostById = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username avatar')

    if (!post) return errorResponse(res, 404, 'ไม่พบโพสต์')

    return successResponse(res, 200, 'ดึงข้อมูลสำเร็จ', post)
  } catch (error) {
    next(error)
  }
}

// ดูโพสต์ของ user
export const getUserPosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const posts = await Post.find({ author: req.params.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username avatar')

    const total = await Post.countDocuments({ author: req.params.id })
    
    const postsWithUrls = await Promise.all(
      posts.map(async (post) => {
        const postObj = post.toObject()

        // เช็คว่า user นี้ like แล้วไหม
        const liked = await Like.findOne({
          user: req.user.id,
          targetId: postObj._id,
          targetType: 'Post',
        })
        postObj.isLiked = !!liked

        if (postObj.media?.length > 0) {
          postObj.media = postObj.media.map((m) => ({ ...m, url: m.url }))
        }
        return postObj
      })
    )

    return successResponse(res, 200, 'ดึงข้อมูลสำเร็จ', {
      posts: postsWithUrls,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total,
    })
  } catch (error) {
    next(error)
  }
}

// แก้ไขโพสต์
export const updatePost = async (req, res, next) => {
  try {
    const { content, visibility } = req.body
    const post = await Post.findById(req.params.id)

    if (!post) return errorResponse(res, 404, 'ไม่พบโพสต์')

    // ตรวจสอบว่าเป็นเจ้าของโพสต์ไหม
    if (post.author.toString() !== req.user.id) {
      return errorResponse(res, 403, 'ไม่มีสิทธิ์แก้ไขโพสต์นี้')
    }

    if (content !== undefined) post.content = content
    if (visibility !== undefined) post.visibility = visibility

    await post.save()
    return successResponse(res, 200, 'แก้ไขโพสต์สำเร็จ', post)
  } catch (error) {
    next(error)
  }
}

// ลบโพสต์
export const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)

    if (!post) return errorResponse(res, 404, 'ไม่พบโพสต์')

    // ตรวจสอบว่าเป็นเจ้าของโพสต์ไหม
    if (post.author.toString() !== req.user.id) {
      return errorResponse(res, 403, 'ไม่มีสิทธิ์ลบโพสต์นี้')
    }

    // ลบไฟล์ทั้งหมดออกจาก S3 ก่อน
    if (post.media.length > 0) {
      const keys = post.media.map((m) => m.key)
      await deleteFiles(keys)
    }

    await post.deleteOne()
    return successResponse(res, 200, 'ลบโพสต์สำเร็จ')
  } catch (error) {
    next(error)
  }
}