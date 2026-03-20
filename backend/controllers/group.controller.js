import Group from '../models/Group.js'
import GroupPost from '../models/GroupPost.js'
import Like from '../models/Like.js'
import Comment from '../models/Comment.js'
import { successResponse, errorResponse } from '../utils/apiResponse.js'
import { deleteFiles, deleteFile } from '../services/upload.service.js'

// ============ สร้างกลุ่ม ============
export const createGroup = async (req, res, next) => {
  try {
    const { name, description, privacy } = req.body

    if (!name) return errorResponse(res, 400, 'กรุณากรอกชื่อกลุ่ม')

    const group = await Group.create({
      name,
      description,
      privacy: privacy || 'public',
      creator: req.user.id,
      // เพิ่มผู้สร้างเป็น admin อัตโนมัติ
      members: [{ user: req.user.id, role: 'admin' }],
      membersCount: 1,
    })

    await group.populate('creator', 'username avatar')

    return successResponse(res, 201, 'สร้างกลุ่มสำเร็จ', group)
  } catch (error) {
    next(error)
  }
}

// ============ ดูข้อมูลกลุ่ม ============
export const getGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate('creator', 'username avatar')
      .populate('members.user', 'username avatar')
      .populate('joinRequests.user', 'username avatar')

    if (!group) return errorResponse(res, 404, 'ไม่พบกลุ่ม')

    return successResponse(res, 200, 'ดึงข้อมูลสำเร็จ', group)
  } catch (error) {
    next(error)
  }
}

// ============ แก้ไขข้อมูลกลุ่ม ============
export const updateGroup = async (req, res, next) => {
  try {
    const { name, description, privacy } = req.body
    const group = await Group.findById(req.params.groupId)

    if (!group) return errorResponse(res, 404, 'ไม่พบกลุ่ม')

    // ตรวจสอบว่าเป็น admin ไหม
    const isAdmin = group.members.some(
      (m) => m.user.toString() === req.user.id && m.role === 'admin'
    )
    if (!isAdmin) return errorResponse(res, 403, 'ไม่มีสิทธิ์แก้ไขกลุ่มนี้')

    if (name !== undefined) group.name = name
    if (description !== undefined) group.description = description
    if (privacy !== undefined) group.privacy = privacy

    await group.save()
    return successResponse(res, 200, 'แก้ไขกลุ่มสำเร็จ', group)
  } catch (error) {
    next(error)
  }
}

// อัปเดตรูปของกลุ่ม
export const updateGroupAvatar = async (req, res, next) => {
  try {
    if (!req.file) return errorResponse(res, 400, 'กรุณาเลือกรูปภาพ')
    const group = await Group.findById(req.params.groupId)
    if (!group) return errorResponse(res, 404, 'ไม่พบกลุ่ม')

    const isAdmin = group.members.some(
      (m) => m.user.toString() === req.user.id && m.role === 'admin'
    )
    if (!isAdmin) return errorResponse(res, 403, 'ไม่มีสิทธิ์')

    if (group.avatar?.key) await deleteFile(group.avatar.key)
    group.avatar = { url: req.file.path, key: req.file.filename }
    await group.save()

    return successResponse(res, 200, 'อัปโหลดรูปสำเร็จ', group)
  } catch (error) {
    next(error)
  }
}

export const updateGroupCover = async (req, res, next) => {
  try {
    if (!req.file) return errorResponse(res, 400, 'กรุณาเลือกรูปภาพ')
    const group = await Group.findById(req.params.groupId)
    if (!group) return errorResponse(res, 404, 'ไม่พบกลุ่ม')

    const isAdmin = group.members.some(
      (m) => m.user.toString() === req.user.id && m.role === 'admin'
    )
    if (!isAdmin) return errorResponse(res, 403, 'ไม่มีสิทธิ์')

    if (group.coverPhoto?.key) await deleteFile(group.coverPhoto.key)
    group.coverPhoto = { url: req.file.path, key: req.file.filename }
    await group.save()

    return successResponse(res, 200, 'อัปโหลดรูปสำเร็จ', group)
  } catch (error) {
    next(error)
  }
}

// ============ ลบกลุ่ม ============
export const deleteGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.groupId)
    if (!group) return errorResponse(res, 404, 'ไม่พบกลุ่ม')

    // ตรวจสอบว่าเป็น creator ไหม
    if (group.creator.toString() !== req.user.id) {
      return errorResponse(res, 403, 'ไม่มีสิทธิ์ลบกลุ่มนี้')
    }

    // ลบรูปกลุ่มออก
    if (group.avatar.key) await deleteFile(group.avatar.key)
    if (group.coverPhoto.key) await deleteFile(group.coverPhoto.key)

    // ลบโพสต์ทั้งหมดในกลุ่ม
    const groupPosts = await GroupPost.find({ group: req.params.groupId })
    for (const post of groupPosts) {
      if (post.media.length > 0) {
        await deleteFiles(post.media.map((m) => m.key))
      }
    }
    await GroupPost.deleteMany({ group: req.params.groupId })

    await group.deleteOne()
    return successResponse(res, 200, 'ลบกลุ่มสำเร็จ')
  } catch (error) {
    next(error)
  }
}

// ============ เข้าร่วมกลุ่ม ============
export const joinGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.groupId)
    if (!group) return errorResponse(res, 404, 'ไม่พบกลุ่ม')

    // ตรวจสอบว่าเป็นสมาชิกอยู่แล้วไหม
    const isMember = group.members.some(
      (m) => m.user.toString() === req.user.id
    )
    if (isMember) return errorResponse(res, 400, 'เป็นสมาชิกกลุ่มนี้อยู่แล้ว')

    if (group.privacy === 'public') {
      // กลุ่ม public → เข้าร่วมได้เลย
      group.members.push({ user: req.user.id, role: 'member' })
      group.membersCount += 1
      await group.save()
      return successResponse(res, 200, 'เข้าร่วมกลุ่มสำเร็จ')
    } else {
      // กลุ่ม private → ส่งคำขอรอ admin อนุมัติ
      const alreadyRequested = group.joinRequests.some(
        (r) => r.user.toString() === req.user.id
      )
      if (alreadyRequested) return errorResponse(res, 400, 'ส่งคำขอไปแล้ว')

      group.joinRequests.push({ user: req.user.id })
      await group.save()
      return successResponse(res, 200, 'ส่งคำขอเข้าร่วมกลุ่มสำเร็จ รอ admin อนุมัติ')
    }
  } catch (error) {
    next(error)
  }
}

// ============ อนุมัติ/ปฏิเสธคำขอเข้าร่วมกลุ่ม ============
export const respondJoinRequest = async (req, res, next) => {
  try {
    const { userId, action } = req.body // action = 'accept' หรือ 'reject'
    const group = await Group.findById(req.params.groupId)
    if (!group) return errorResponse(res, 404, 'ไม่พบกลุ่ม')

    // ตรวจสอบว่าเป็น admin ไหม
    const isAdmin = group.members.some(
      (m) => m.user.toString() === req.user.id && m.role === 'admin'
    )
    if (!isAdmin) return errorResponse(res, 403, 'ไม่มีสิทธิ์อนุมัติคำขอ')

    // หาคำขอที่ต้องการตอบรับ
    const requestIndex = group.joinRequests.findIndex(
      (r) => r.user.toString() === userId
    )
    if (requestIndex === -1) return errorResponse(res, 404, 'ไม่พบคำขอเข้าร่วมกลุ่ม')

    if (action === 'accept') {
      group.members.push({ user: userId, role: 'member' })
      group.membersCount += 1
    }

    group.joinRequests.splice(requestIndex, 1)
    await group.save()

    return successResponse(res, 200,
      action === 'accept' ? 'อนุมัติคำขอสำเร็จ' : 'ปฏิเสธคำขอสำเร็จ'
    )
  } catch (error) {
    next(error)
  }
}

// ============ ออกจากกลุ่ม ============
export const leaveGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.groupId)
    if (!group) return errorResponse(res, 404, 'ไม่พบกลุ่ม')

    // ตรวจสอบว่าเป็นสมาชิกไหม
    const isMember = group.members.some(
      (m) => m.user.toString() === req.user.id
    )
    if (!isMember) return errorResponse(res, 400, 'ไม่ได้เป็นสมาชิกกลุ่มนี้')

    // creator ออกจากกลุ่มไม่ได้ ต้องลบกลุ่มแทน
    if (group.creator.toString() === req.user.id) {
      return errorResponse(res, 400, 'ผู้สร้างกลุ่มไม่สามารถออกจากกลุ่มได้ กรุณาลบกลุ่มแทน')
    }

    group.members = group.members.filter(
      (m) => m.user.toString() !== req.user.id
    )
    group.membersCount -= 1
    await group.save()

    return successResponse(res, 200, 'ออกจากกลุ่มสำเร็จ')
  } catch (error) {
    next(error)
  }
}

// ============ ดูโพสต์ในกลุ่ม ============
export const getGroupPosts = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.groupId)
    if (!group) return errorResponse(res, 404, 'ไม่พบกลุ่ม')

    const isMember = group.members.some(
      (m) => m.user.toString() === req.user.id
    )

    // กลุ่ม private และไม่ใช่สมาชิก → ดูไม่ได้
    if (!isMember && group.privacy === 'private') {
      return successResponse(res, 200, 'ดึงข้อมูลสำเร็จ', {
        posts: [],
        isMember: false,
        currentPage: 1,
        totalPages: 0,
        totalPosts: 0,
      })
    }

    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const posts = await GroupPost.find({
      group: req.params.groupId,
      status: 'approved',
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username avatar')

      const postsWithLiked = await Promise.all(
      posts.map(async (post) => {
        const postObj = post.toObject()
        const liked = await Like.findOne({
          user: req.user.id,
          targetId: post._id,
          targetType: 'GroupPost',
        })
        postObj.isLiked = !!liked
        return postObj
      })
    )

    const total = await GroupPost.countDocuments({
      group: req.params.groupId,
      status: 'approved',
    })

    return successResponse(res, 200, 'ดึงข้อมูลสำเร็จ', {
      posts: postsWithLiked,
      isMember, // ← true หรือ false ตามจริง
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total,
    })
  } catch (error) {
    next(error)
  }
}

// ============ สร้างโพสต์ในกลุ่ม ============
export const createGroupPost = async (req, res, next) => {
  try {
    const { content } = req.body
    const group = await Group.findById(req.params.groupId)
    if (!group) return errorResponse(res, 404, 'ไม่พบกลุ่ม')

    // ตรวจสอบว่าเป็นสมาชิกไหม
    const isMember = group.members.some(
      (m) => m.user.toString() === req.user.id
    )
    if (!isMember) return errorResponse(res, 403, 'กรุณาเข้าร่วมกลุ่มก่อน')

    if (!content && (!req.files || req.files.length === 0)) {
      return errorResponse(res, 400, 'กรุณากรอกเนื้อหาหรือแนบไฟล์')
    }

    const media = req.files?.map((file) => ({
      url: file.path,
      key: file.filename,
      type: file.mimetype.startsWith('image/') ? 'image' : 'video',
    })) || []

    const post = await GroupPost.create({
      group: req.params.groupId,
      author: req.user.id,
      content,
      media,
      status: 'approved',
    })

  group.postsCount += 1
  await group.save()

  await post.populate('author', 'username avatar')

  return successResponse(res, 201, 'สร้างโพสต์สำเร็จ', post)  

    } catch (error) {
      next(error)
    }
  }

// ============ ดึงคอมเมนต์ของ GroupPost ============
export const getGroupPostComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({
      post: req.params.postId,
      parentComment: null,
    })
      .sort({ createdAt: 1 })
      .populate('author', 'username avatar')

    return successResponse(res, 200, 'ดึงข้อมูลสำเร็จ', { comments })
  } catch (error) {
    next(error)
  }
}

// ============ สร้างคอมเมนต์ใน GroupPost ============
export const createGroupPostComment = async (req, res, next) => {
  try {
    const { content } = req.body
    if (!content) return errorResponse(res, 400, 'กรุณากรอกข้อความคอมเมนต์')

    const post = await GroupPost.findById(req.params.postId)
    if (!post) return errorResponse(res, 404, 'ไม่พบโพสต์')

    const comment = await Comment.create({
      post: req.params.postId,
      author: req.user.id,
      content,
      parentComment: null,
    })

    await GroupPost.findByIdAndUpdate(req.params.postId, {
      $inc: { commentsCount: 1 }
    })

    await comment.populate('author', 'username avatar')

    return successResponse(res, 201, 'คอมเมนต์สำเร็จ', comment)
  } catch (error) {
    next(error)
  }
}

// ============ ลบโพสต์ในกลุ่ม ============
export const deleteGroupPost = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.groupId)
    if (!group) return errorResponse(res, 404, 'ไม่พบกลุ่ม')

    const post = await GroupPost.findById(req.params.postId)
    if (!post) return errorResponse(res, 404, 'ไม่พบโพสต์')

    // ลบได้ถ้าเป็นเจ้าของโพสต์ หรือเป็น admin ของกลุ่ม
    const isAdmin = group.members.some(
      (m) => m.user.toString() === req.user.id && m.role === 'admin'
    )
    const isOwner = post.author.toString() === req.user.id

    if (!isOwner && !isAdmin) {
      return errorResponse(res, 403, 'ไม่มีสิทธิ์ลบโพสต์นี้')
    }

    // ลบไฟล์
    if (post.media.length > 0) {
      await deleteFiles(post.media.map((m) => m.key))
    }

    await post.deleteOne()

    group.postsCount = Math.max(0, group.postsCount - 1)
    await group.save()

    return successResponse(res, 200, 'ลบโพสต์สำเร็จ')
  } catch (error) {
    next(error)
  }
}
// ดึงกลุ่มที่ตัวเองเข้าร่วม
export const getMyGroups = async (req, res, next) => {
  try {
    const groups = await Group.find({
      'members.user': req.user.id,
    }).select('name description privacy avatar coverPhoto membersCount')

    return successResponse(res, 200, 'ดึงข้อมูลสำเร็จ', groups)
  } catch (error) {
    next(error)
  }
}

// ค้นหากลุ่ม
export const searchGroups = async (req, res, next) => {
  try {
    const { q } = req.query
    if (!q) return errorResponse(res, 400, 'กรุณากรอกคำค้นหา')

    const groups = await Group.find({
      name: { $regex: q, $options: 'i' },
    }).select('name description privacy avatar coverPhoto membersCount')

    return successResponse(res, 200, 'ค้นหาสำเร็จ', groups)
  } catch (error) {
    next(error)
  }
}