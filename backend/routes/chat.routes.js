import express from 'express'
import {
  getConversations,
  createConversation,
  getMessages,
  sendMessage,
  deleteMessage,
  markAsRead,
} from '../controllers/chat.controller.js'
import { protect, isVerified } from '../middleware/auth.middleware.js'
import { uploadMultiple } from '../middleware/upload.middleware.js'

const router = express.Router()

// ทุก route ต้อง login และ verify email ก่อน
router.use(protect, isVerified)

// ============ ห้องแชท ============
// GET /api/chats
router.get('/', getConversations)

// POST /api/chats
router.post('/', createConversation)

// ============ ข้อความ ============
// GET /api/chats/:conversationId/messages
router.get('/:conversationId/messages', getMessages)

// POST /api/chats/:conversationId/messages
router.post('/:conversationId/messages', uploadMultiple('media', 5), sendMessage)

// DELETE /api/chats/:conversationId/messages/:messageId
router.delete('/:conversationId/messages/:messageId', deleteMessage)

// PUT /api/chats/:conversationId/read
router.put('/:conversationId/read', markAsRead)

export default router