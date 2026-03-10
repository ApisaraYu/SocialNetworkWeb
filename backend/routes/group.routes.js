import express from 'express'
import {
  createGroup,
  getGroup,
  updateGroup,
  deleteGroup,
  joinGroup,
  respondJoinRequest,
  leaveGroup,
  getGroupPosts,
  createGroupPost,
  deleteGroupPost,
} from '../controllers/group.controller.js'
import { protect, isVerified } from '../middleware/auth.middleware.js'
import { uploadSingle, uploadMultiple } from '../middleware/upload.middleware.js'

const router = express.Router()

// ทุก route ต้อง login และ verify email ก่อน
router.use(protect, isVerified)

// ============ กลุ่ม ============
// POST /api/groups
router.post('/', createGroup)

// GET /api/groups/:groupId
router.get('/:groupId', getGroup)

// PUT /api/groups/:groupId
router.put('/:groupId', updateGroup)

// DELETE /api/groups/:groupId
router.delete('/:groupId', deleteGroup)

// ============ สมาชิก ============
// POST /api/groups/:groupId/join
router.post('/:groupId/join', joinGroup)

// PUT /api/groups/:groupId/join-request
router.put('/:groupId/join-request', respondJoinRequest)

// DELETE /api/groups/:groupId/leave
router.delete('/:groupId/leave', leaveGroup)

// ============ โพสต์ในกลุ่ม ============
// GET /api/groups/:groupId/posts
router.get('/:groupId/posts', getGroupPosts)

// POST /api/groups/:groupId/posts
router.post('/:groupId/posts', uploadMultiple('media', 5), createGroupPost)

// DELETE /api/groups/:groupId/posts/:postId
router.delete('/:groupId/posts/:postId', deleteGroupPost)

export default router