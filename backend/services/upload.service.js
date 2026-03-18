import cloudinary from '../config/cloudinary.js'

// ลบไฟล์เดียว
export const deleteFile = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId)
  } catch (error) {
    console.error('ลบไฟล์ไม่สำเร็จ:', error)
  }
}

// ลบหลายไฟล์
export const deleteFiles = async (publicIds) => {
  try {
    await Promise.all(publicIds.map((id) => cloudinary.uploader.destroy(id)))
  } catch (error) {
    console.error('ลบไฟล์ไม่สำเร็จ:', error)
  }
}

// Cloudinary URL เป็น public อยู่แล้ว ไม่ต้องทำ Presigned URL
export const getPresignedUrl = (url) => url