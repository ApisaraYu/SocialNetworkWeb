import { DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import s3 from '../config/s3.js'

// ลบไฟล์จาก S3
// ใช้ตอนลบโพสต์, ลบรูปโปรไฟล์, ลบข้อความในแชท
const deleteFile = async (key) => {
  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
      })
    )
  } catch (error) {
    console.error('ลบไฟล์จาก S3 ไม่สำเร็จ:', error.message)
    throw error
  }
}

// ลบหลายไฟล์พร้อมกัน
// ใช้ตอนลบโพสต์ที่มีหลายรูป/วิดีโอ
const deleteFiles = async (keys) => {
  try {
    // ลบทุกไฟล์พร้อมกันด้วย Promise.all
    await Promise.all(keys.map((key) => deleteFile(key)))
  } catch (error) {
    console.error('ลบไฟล์หลายไฟล์จาก S3 ไม่สำเร็จ:', error.message)
    throw error
  }
}

// สร้าง Presigned URL สำหรับเข้าถึงไฟล์ชั่วคราว
// เพราะ Bucket เป็น private จึงต้องสร้าง URL ชั่วคราวให้ Frontend ดูไฟล์ได้
// expiresIn = ระยะเวลาที่ URL ใช้งานได้ (วินาที) default 1 ชั่วโมง
const getPresignedUrl = async (key, expiresIn = 3600) => {
  try {
    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
      }),
      { expiresIn }
    )
    return url
  } catch (error) {
    console.error('สร้าง Presigned URL ไม่สำเร็จ:', error.message)
    throw error
  }
}

// แปลง media array ให้มี Presigned URL
// ใช้ตอนดึงโพสต์มาแสดงผล
const getMediaWithUrls = async (mediaArray) => {
  return await Promise.all(
    mediaArray.map(async (media) => ({
      ...media.toObject(),
      url: await getPresignedUrl(media.key),
    }))
  )
}

export { deleteFile, deleteFiles, getPresignedUrl, getMediaWithUrls }