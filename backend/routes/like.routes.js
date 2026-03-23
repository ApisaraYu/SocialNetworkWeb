import express from 'express'
import { toggleLike, getLikeStatus } from '../controllers/like.controller.js'
import { protect } from '../middleware/auth.middleware.js'

const router = express.Router()

// ทุก route ต้อง login และ verify email ก่อน
router.use(protect)

// POST /api/likes/:targetType/:targetId  ← กดไลค์/ถอนไลค์
router.post('/:targetType/:targetId', toggleLike)

// GET /api/likes/:targetType/:targetId   ← ดูสถานะไลค์
router.get('/:targetType/:targetId', getLikeStatus)

export default router