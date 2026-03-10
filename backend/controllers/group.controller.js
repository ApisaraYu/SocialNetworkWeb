import Group from '../models/Group.js'
import GroupPost from '../models/GroupPost.js'
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

// ============ ลบกลุ่ม ============
export const deleteGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.groupId)
    if (!group) return errorResponse(res, 404, 'ไม่พบกลุ่ม')

    // ตรวจสอบว่าเป็น creator ไหม
    if (group.creator.toString() !== req.user.id) {
      return errorResponse(res, 403, 'ไม่มีสิทธิ์ลบกลุ่มนี้')
    }

    // ลบรูปกลุ่มออกจาก S3
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

    // ตรวจสอบว่าเป็นสมาชิกไหม
    const isMember = group.members.some(
      (m) => m.user.toString() === req.user.id
    )
    if (!isMember) return errorResponse(res, 403, 'กรุณาเข้าร่วมกลุ่มก่อน')

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

    const total = await GroupPost.countDocuments({
      group: req.params.groupId,
      status: 'approved',
    })

    return successResponse(res, 200, 'ดึงข้อมูลสำเร็จ', {
      posts,
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
      url: file.location,
      key: file.key,
      type: file.mimetype.startsWith('image/') ? 'image' : 'video',
    })) || []

    // กลุ่ม private → โพสต์ต้องรอ admin อนุมัติ
    const isAdmin = group.members.some(
      (m) => m.user.toString() === req.user.id && m.role === 'admin'
    )
    const status = group.privacy === 'private' && !isAdmin ? 'pending' : 'approved'

    const post = await GroupPost.create({
      group: req.params.groupId,
      author: req.user.id,
      content,
      media,
      status,
    })

    if (status === 'approved') {
      group.postsCount += 1
      await group.save()
    }

    await post.populate('author', 'username avatar')

    return successResponse(res, 201,
      status === 'pending' ? 'ส่งโพสต์เพื่อรอ admin อนุมัติ' : 'สร้างโพสต์สำเร็จ',
      post
    )
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

    // ลบไฟล์ใน S3
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