import express from 'express'
import {
  getMe,
  getUserById,
  updateProfile,
  updateAvatar,
  updateCoverPhoto,
  searchUsers,
  sendFriendRequest,
  respondFriendRequest,
  getFriendRequests,
  getFriendStatus,
  removeFriend,
  getFriends,
} from '../controllers/user.controller.js'
import { protect } from '../middleware/auth.middleware.js'
import { uploadSingle } from '../middleware/upload.middleware.js'

const router = express.Router()

// ทุก route ต้อง login และ verify email ก่อน
router.use(protect)

// โปรไฟล์
// GET /api/users/me
router.get('/me', getMe)

// PUT /api/users/me
router.put('/me', updateProfile)

// PUT /api/users/me/avatar
router.put('/me/avatar', uploadSingle('avatar'), updateAvatar)

// PUT /api/users/me/cover
router.put('/me/cover', uploadSingle('coverPhoto'), updateCoverPhoto)

// GET /api/users/search
router.get('/search', searchUsers)

// GET /api/users/friend-requests
router.get('/friend-requests', getFriendRequests)

// PUT /api/users/friend-request/respond
router.put('/friend-request/respond', respondFriendRequest)

// GET /api/users/:id/friend-status
router.get('/:id/friend-status', getFriendStatus)

// GET /api/users/:id
router.get('/:id', getUserById)

// เพื่อน
// GET /api/users/:id/friends
router.get('/:id/friends', getFriends)

// POST /api/users/:id/friend-request
router.post('/:id/friend-request', sendFriendRequest)

// DELETE /api/users/:id/friend
router.delete('/:id/friend', removeFriend)

export default router