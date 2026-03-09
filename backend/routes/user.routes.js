import express from 'express'
import {
  getMe,
  getUserById,
  updateProfile,
  updateAvatar,
  updateCoverPhoto,
  sendFriendRequest,
  respondFriendRequest,
  removeFriend,
  getFriends,
} from '../controllers/user.controller.js'
import { protect, isVerified } from '../middleware/auth.middleware.js'
import { uploadSingle } from '../middleware/upload.middleware.js'

const router = express.Router()

// ทุก route ต้อง login และ verify email ก่อน
router.use(protect, isVerified)

// โปรไฟล์
// GET /api/users/me
router.get('/me', getMe)

// PUT /api/users/me
router.put('/me', updateProfile)

// PUT /api/users/me/avatar
router.put('/me/avatar', uploadSingle('avatar'), updateAvatar)

// PUT /api/users/me/cover
router.put('/me/cover', uploadSingle('coverPhoto'), updateCoverPhoto)

// GET /api/users/:id
router.get('/:id', getUserById)

// เพื่อน
// GET /api/users/:id/friends
router.get('/:id/friends', getFriends)

// POST /api/users/:id/friend-request
router.post('/:id/friend-request', sendFriendRequest)

// PUT /api/users/friend-request/respond
router.put('/friend-request/respond', respondFriendRequest)

// DELETE /api/users/:id/friend
router.delete('/:id/friend', removeFriend)

export default router