import multer from 'multer'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import cloudinary from '../config/cloudinary.js'

// Storage สำหรับรูปภาพ
const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'socialio/images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    resource_type: 'image',
  },
})

// Storage สำหรับวิดีโอ
const videoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'socialio/videos',
    allowed_formats: ['mp4', 'mov', 'avi'],
    resource_type: 'video',
  },
})

// Storage อัตโนมัติ (รูปหรือวิดีโอก็ได้)
const autoStorage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    const isVideo = file.mimetype.startsWith('video/')
    return {
      folder: isVideo ? 'socialio/videos' : 'socialio/images',
      resource_type: isVideo ? 'video' : 'image',
    }
  },
})

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/mov', 'video/avi']
  if (allowed.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('ไฟล์ไม่รองรับ กรุณาอัปโหลดรูปภาพหรือวิดีโอเท่านั้น'), false)
  }
}

// Upload ไฟล์เดียว
export const uploadSingle = (fieldName) => {
  const upload = multer({ storage: imageStorage, fileFilter }).single(fieldName)
  return (req, res, next) => {
    upload(req, res, (err) => {
      if (err) {
        console.error('Upload error:', err)
        return next(err)
      }
      next()
    })
  }
}

// Upload หลายไฟล์
export const uploadMultiple = (fieldName, maxCount = 5) => {
  const upload = multer({ storage: autoStorage, fileFilter }).array(fieldName, maxCount)
  return (req, res, next) => {
    upload(req, res, (err) => {
      if (err) {
        console.error('Upload error:', err)
        return next(err)
      }
      next()
    })
  }
}