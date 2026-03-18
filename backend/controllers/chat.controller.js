import Conversation from '../models/Conversation.js'
import Message from '../models/Message.js'
import { successResponse, errorResponse } from '../utils/apiResponse.js'
import { deleteFiles } from '../services/upload.service.js'
import { getIO } from '../config/socket.js'

// ============ ดึงรายการแชทของตัวเอง ============
export const getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id,
    })
      .sort({ updatedAt: -1 })
      .populate('participants', 'username avatar')
      .populate('lastMessage')

    return successResponse(res, 200, 'ดึงข้อมูลสำเร็จ', conversations)
  } catch (error) {
    next(error)
  }
}

// ============ สร้างแชท 1-1 ============
export const createConversation = async (req, res, next) => {
  try {
    const { userId } = req.body

    if (!userId) return errorResponse(res, 400, 'กรุณาระบุ userId')

    // ตรวจสอบว่ามีห้องแชทกับคนนี้อยู่แล้วไหม
    const existing = await Conversation.findOne({
      type: 'direct',
      participants: { $all: [req.user.id, userId] },
    })

    if (existing) {
      return successResponse(res, 200, 'ดึงข้อมูลสำเร็จ', existing)
    }

    // สร้างห้องแชทใหม่
    const conversation = await Conversation.create({
      participants: [req.user.id, userId],
      type: 'direct',
    })

    await conversation.populate('participants', 'username avatar')

    return successResponse(res, 201, 'สร้างแชทสำเร็จ', conversation)
  } catch (error) {
    next(error)
  }
}

// ============ ดึงประวัติข้อความ ============
export const getMessages = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit

    // ตรวจสอบว่าเป็นสมาชิกห้องแชทนี้ไหม
    const conversation = await Conversation.findOne({
      _id: req.params.conversationId,
      participants: req.user.id,
    })

    if (!conversation) return errorResponse(res, 404, 'ไม่พบห้องแชท')

    const messages = await Message.find({
      conversation: req.params.conversationId,
      isDeleted: false,
    })
      .sort({ createdAt: -1 }) // เรียงจากใหม่ไปเก่า
      .skip(skip)
      .limit(limit)
      .populate('sender', 'username avatar')
      .populate('replyTo')

    const total = await Message.countDocuments({
      conversation: req.params.conversationId,
      isDeleted: false,
    })

    return successResponse(res, 200, 'ดึงข้อมูลสำเร็จ', {
      messages: messages.reverse(), // กลับลำดับให้เก่าไปใหม่
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalMessages: total,
    })
  } catch (error) {
    next(error)
  }
}

// ============ ส่งข้อความ ============
export const sendMessage = async (req, res, next) => {
  try {
    const { content, replyTo } = req.body

    // ตรวจสอบว่าเป็นสมาชิกห้องแชทนี้ไหม
    const conversation = await Conversation.findOne({
      _id: req.params.conversationId,
      participants: req.user.id,
    })

    if (!conversation) return errorResponse(res, 404, 'ไม่พบห้องแชท')

    // ตรวจสอบว่ามีเนื้อหาหรือไฟล์อย่างน้อย 1 อย่าง
    if (!content && (!req.files || req.files.length === 0)) {
      return errorResponse(res, 400, 'กรุณากรอกข้อความหรือแนบไฟล์')
    }

    // แปลงไฟล์ที่อัปโหลดเป็น media array
    const media = req.files?.map((file) => ({
      url: file.path,
      key: file.filename,
      type: file.mimetype.startsWith('image/') ? 'image' : 'video',
    })) || []

    const message = await Message.create({
      conversation: req.params.conversationId,
      sender: req.user.id,
      content,
      media,
      replyTo: replyTo || null,
      readBy: [{ user: req.user.id }], // ผู้ส่งอ่านแล้วอัตโนมัติ
    })

    // อัปเดต lastMessage ในห้องแชท
    conversation.lastMessage = message._id
    conversation.updatedAt = new Date()
    await conversation.save()

    await message.populate('sender', 'username avatar')

    // ส่งข้อความ real-time ผ่าน Socket.IO
    const io = getIO()
    io.to(req.params.conversationId).emit('new_message', message)

    return successResponse(res, 201, 'ส่งข้อความสำเร็จ', message)
  } catch (error) {
    next(error)
  }
}

// ============ ลบข้อความ ============
export const deleteMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.messageId)
    if (!message) return errorResponse(res, 404, 'ไม่พบข้อความ')

    // ตรวจสอบว่าเป็นเจ้าของข้อความไหม
    if (message.sender.toString() !== req.user.id) {
      return errorResponse(res, 403, 'ไม่มีสิทธิ์ลบข้อความนี้')
    }

    // ลบไฟล์ใน S3 (ถ้ามี)
    if (message.media.length > 0) {
      const keys = message.media.map((m) => m.key)
      await deleteFiles(keys)
    }

    // Soft delete → แสดงว่า "ข้อความถูกลบแล้ว" แทน
    message.isDeleted = true
    message.content = ''
    message.media = []
    await message.save()

    // แจ้ง real-time ว่าข้อความถูกลบ
    const io = getIO()
    io.to(message.conversation.toString()).emit('message_deleted', {
      messageId: message._id,
    })

    return successResponse(res, 200, 'ลบข้อความสำเร็จ')
  } catch (error) {
    next(error)
  }
}

// ============ อ่านข้อความ ============
export const markAsRead = async (req, res, next) => {
  try {
    // อัปเดตข้อความทั้งหมดในห้องแชทว่าอ่านแล้ว
    await Message.updateMany(
      {
        conversation: req.params.conversationId,
        'readBy.user': { $ne: req.user.id }, // ยังไม่ได้อ่าน
      },
      {
        $push: { readBy: { user: req.user.id } },
      }
    )

    return successResponse(res, 200, 'อ่านข้อความสำเร็จ')
  } catch (error) {
    next(error)
  }
}