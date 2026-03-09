import multer from 'multer'
import multerS3 from 'multer-s3'
import s3 from '../config/s3.js'
import { errorResponse } from '../utils/apiResponse.js'

// กำหนดประเภทไฟล์ที่รับได้
const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/quicktime',
]

// ตรวจสอบประเภทไฟล์ก่อนอัปโหลด
const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true)  // อนุญาต
  } else {
    cb(new Error('ไฟล์ประเภทนี้ไม่รองรับ รองรับเฉพาะ jpg, png, gif, webp, mp4, mov'), false)
  }
}

// กำหนดปลายทางการอัปโหลดไปยัง AWS S3
const upload = multer({
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // จำกัดขนาดไฟล์ 50MB
  },
  storage: multerS3({
    s3,
    bucket: process.env.AWS_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE, // กำหนด content-type อัตโนมัติ

    // กำหนดชื่อและโฟลเดอร์ของไฟล์ใน S3
    key: (req, file, cb) => {
      // แยกโฟลเดอร์ตามประเภทไฟล์
      const folder = file.mimetype.startsWith('image/') ? 'images' : 'videos'
      // ตั้งชื่อไฟล์ด้วย timestamp เพื่อป้องกันชื่อซ้ำ
      const filename = `${folder}/${Date.now()}-${file.originalname}`
      cb(null, filename)
    },
  }),
})

// Middleware สำหรับอัปโหลดไฟล์เดียว
// fieldName = ชื่อ field ที่ส่งมาจาก Frontend
const uploadSingle = (fieldName) => (req, res, next) => {
  upload.single(fieldName)(req, res, (err) => {
    if (err) return errorResponse(res, 400, err.message)
    next()
  })
}

// Middleware สำหรับอัปโหลดหลายไฟล์ (สูงสุด 5 ไฟล์)
const uploadMultiple = (fieldName, maxCount = 5) => (req, res, next) => {
  upload.array(fieldName, maxCount)(req, res, (err) => {
    if (err) return errorResponse(res, 400, err.message)
    next()
  })
}

export { uploadSingle, uploadMultiple }