import express from 'express'
import {
  createPost,
  getTimeline,
  getPostById,
  getUserPosts,
  updatePost,
  deletePost,
} from '../controllers/post.controller.js'
import { protect, isVerified } from '../middleware/auth.middleware.js'
import { uploadMultiple } from '../middleware/upload.middleware.js'

const router = express.Router()

// ทุก route ต้อง login และ verify email ก่อน
router.use(protect, isVerified)

// โพสต์
// GET /api/posts/timeline
router.get('/timeline', getTimeline)

// POST /api/posts
router.post('/', uploadMultiple('media', 5), createPost)

// GET /api/posts/:id
router.get('/:id', getPostById)

// PUT /api/posts/:id
router.put('/:id', updatePost)

// DELETE /api/posts/:id
router.delete('/:id', deletePost)

// โพสต์ของ user
// GET /api/posts/user/:id
router.get('/user/:id', getUserPosts)

export default router