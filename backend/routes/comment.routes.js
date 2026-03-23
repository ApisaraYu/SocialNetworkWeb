import express from 'express'
import {
  getComments,
  getReplies,
  createComment,
  updateComment,
  deleteComment,
} from '../controllers/comment.controller.js'
import { protect } from '../middleware/auth.middleware.js'

const router = express.Router({ mergeParams: true })
// mergeParams: true = ทำให้เข้าถึง params จาก parent route ได้
// เช่น :postId จาก /api/posts/:postId/comments

// ทุก route ต้อง login และ verify email ก่อน
router.use(protect)

// คอมเมนต์
// GET /api/posts/:postId/comments
router.get('/', getComments)

// POST /api/posts/:postId/comments
router.post('/', createComment)

// GET /api/posts/:postId/comments/:commentId/replies
router.get('/:commentId/replies', getReplies)

// PUT /api/posts/:postId/comments/:commentId
router.put('/:commentId', updateComment)

// DELETE /api/posts/:postId/comments/:commentId
router.delete('/:commentId', deleteComment)

export default router