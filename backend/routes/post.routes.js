import express from 'express'
import {
  createPost,
  getTimeline,
  getPostById,
  getUserPosts,
  updatePost,
  deletePost,
} from '../controllers/post.controller.js'
import { protect } from '../middleware/auth.middleware.js'
import { uploadMultiple } from '../middleware/upload.middleware.js'
import commentRouter from './comment.routes.js'

const router = express.Router()

// ทุก route ต้อง login และ verify email ก่อน
router.use(protect)
// เชื่อม comment router เข้ากับ post router
router.use('/:postId/comments', commentRouter)

// โพสต์
// GET /api/posts/timeline
router.get('/timeline', getTimeline)

// โพสต์ของ user
// GET /api/posts/user/:id
router.get('/user/:id', getUserPosts)

// POST /api/posts
router.post('/', uploadMultiple('media', 5), createPost)

// GET /api/posts/:id
router.get('/:id', getPostById)

// PUT /api/posts/:id
router.put('/:id', updatePost)

// DELETE /api/posts/:id
router.delete('/:id', deletePost)

export default router