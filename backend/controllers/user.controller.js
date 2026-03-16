import User from '../models/User.js'
import { successResponse, errorResponse } from '../utils/apiResponse.js'
import { deleteFile } from '../services/upload.service.js'

// ดูโปรไฟล์ตัวเอง 
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -verifyOtp -verifyOtpExpire -resetPasswordOtp -resetPasswordOtpExpire')

    return successResponse(res, 200, 'ดึงข้อมูลสำเร็จ', user)
  } catch (error) {
    next(error)
  }
}

// ดูโปรไฟล์คนอื่น
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('username avatar coverPhoto bio friends createdAt')

    if (!user) return errorResponse(res, 404, 'ไม่พบผู้ใช้งาน')

    return successResponse(res, 200, 'ดึงข้อมูลสำเร็จ', user)
  } catch (error) {
    next(error)
  }
}

// แก้ไขข้อมูลส่วนตัว
export const updateProfile = async (req, res, next) => {
  try {
    const { username, bio } = req.body
    const user = await User.findById(req.user.id)

    // ตรวจสอบว่า username ซ้ำไหม (ถ้าเปลี่ยน)
    if (username && username !== user.username) {
      const existing = await User.findOne({ username })
      if (existing) return errorResponse(res, 400, 'Username นี้ถูกใช้งานแล้ว')
      user.username = username
    }

    if (bio !== undefined) user.bio = bio

    await user.save()
    return successResponse(res, 200, 'แก้ไขข้อมูลสำเร็จ', user)
  } catch (error) {
    next(error)
  }
}

// อัปโหลดรูปโปรไฟล์
export const updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) return errorResponse(res, 400, 'กรุณาเลือกรูปภาพ')

    const user = await User.findById(req.user.id)

    // ลบรูปเดิมออกจาก S3 ก่อน (ถ้ามี)
    if (user.avatar.key) {
      await deleteFile(user.avatar.key)
    }

    // อัปเดตรูปใหม่
    user.avatar = {
      url: req.file.location,
      key: req.file.key,
    }

    await user.save()
    return successResponse(res, 200, 'อัปโหลดรูปโปรไฟล์สำเร็จ', user)
  } catch (error) {
    next(error)
  }
}

// อัปโหลดรูปหน้าปก
export const updateCoverPhoto = async (req, res, next) => {
  try {
    if (!req.file) return errorResponse(res, 400, 'กรุณาเลือกรูปภาพ')

    const user = await User.findById(req.user.id)

    // ลบรูปเดิมออกจาก S3 ก่อน (ถ้ามี)
    if (user.coverPhoto.key) {
      await deleteFile(user.coverPhoto.key)
    }

    user.coverPhoto = {
      url: req.file.location,
      key: req.file.key,
    }

    await user.save()
    return successResponse(res, 200, 'อัปโหลดรูปหน้าปกสำเร็จ', user)
  } catch (error) {
    next(error)
  }
}

// ค้นหา user
export const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query
    if (!q) return errorResponse(res, 400, 'กรุณากรอกคำค้นหา')

    const users = await User.find({
      username: { $regex: q, $options: 'i' },
      _id: { $ne: req.user.id }, // ไม่แสดงตัวเอง
    })
      .select('username avatar')
      .limit(10)

    return successResponse(res, 200, 'ค้นหาสำเร็จ', users)
  } catch (error) {
    next(error)
  }
}

// ส่งคำขอเป็นเพื่อน
export const sendFriendRequest = async (req, res, next) => {
  try {
    const targetUser = await User.findById(req.params.id)
    if (!targetUser) return errorResponse(res, 404, 'ไม่พบผู้ใช้งาน')

    // ตรวจสอบว่าส่งหาตัวเองไหม
    if (req.params.id === req.user.id) {
      return errorResponse(res, 400, 'ไม่สามารถส่งคำขอหาตัวเองได้')
    }

    // ตรวจสอบว่าเป็นเพื่อนกันอยู่แล้วไหม
    if (targetUser.friends.includes(req.user.id)) {
      return errorResponse(res, 400, 'เป็นเพื่อนกันอยู่แล้ว')
    }

    // ตรวจสอบว่าส่งคำขอไปแล้วไหม
    const alreadySent = targetUser.friendRequests.some(
      (r) => r.from.toString() === req.user.id
    )
    if (alreadySent) return errorResponse(res, 400, 'ส่งคำขอไปแล้ว')

    targetUser.friendRequests.push({ from: req.user.id })
    await targetUser.save()

    return successResponse(res, 200, 'ส่งคำขอเป็นเพื่อนสำเร็จ')
  } catch (error) {
    next(error)
  }
}
// ตอบรับ/ปฏิเสธคำขอเป็นเพื่อน
export const respondFriendRequest = async (req, res, next) => {
  try {
    const { fromUserId, action } = req.body // action = 'accept' หรือ 'reject'
    const user = await User.findById(req.user.id)

    // หาคำขอที่ต้องการตอบรับ
    const requestIndex = user.friendRequests.findIndex(
      (r) => r.from.toString() === fromUserId
    )
    if (requestIndex === -1) return errorResponse(res, 404, 'ไม่พบคำขอเป็นเพื่อน')

    if (action === 'accept') {
      // เพิ่มเพื่อนทั้ง 2 ฝั่ง
      user.friends.push(fromUserId)
      await User.findByIdAndUpdate(fromUserId, {
        $push: { friends: req.user.id }
      })
    }

    // ลบคำขอออกไม่ว่าจะ accept หรือ reject
    user.friendRequests.splice(requestIndex, 1)
    await user.save()

    return successResponse(res, 200,
      action === 'accept' ? 'ตอบรับคำขอสำเร็จ' : 'ปฏิเสธคำขอสำเร็จ'
    )
  } catch (error) {
    next(error)
  }
}

// ลบเพื่อน
export const removeFriend = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
    const targetUser = await User.findById(req.params.id)

    if (!targetUser) return errorResponse(res, 404, 'ไม่พบผู้ใช้งาน')

    // ลบเพื่อนทั้ง 2 ฝั่ง
    user.friends = user.friends.filter((id) => id.toString() !== req.params.id)
    targetUser.friends = targetUser.friends.filter(
      (id) => id.toString() !== req.user.id
    )

    await user.save()
    await targetUser.save()

    return successResponse(res, 200, 'ลบเพื่อนสำเร็จ')
  } catch (error) {
    next(error)
  }
}

// ดูรายชื่อเพื่อน
export const getFriends = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('friends', 'username avatar bio')

    if (!user) return errorResponse(res, 404, 'ไม่พบผู้ใช้งาน')

    return successResponse(res, 200, 'ดึงข้อมูลสำเร็จ', user.friends)
  } catch (error) {
    next(error)
  }
}