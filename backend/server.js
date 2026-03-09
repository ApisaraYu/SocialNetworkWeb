// โหลดค่าตัวแปรจากไฟล์ .env เข้ามาใช้งานใน process.env
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
// Helmet - เพิ่ม HTTP Security Headers อัตโนมัติ เช่น ป้องกัน XSS, Clickjacking
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
// dns - กำหนด DNS Server ตรงๆ แก้ปัญหา MongoDB connect ไม่ได้ในบาง environment
import dns from 'dns/promises'
// ฟังก์ชัน connect MongoDB จากไฟล์ config/mongodb.js
import conn from './config/mongodb.js'
// Router สำหรับจัดการ Authentication
import authRouter from './routes/authroutes.js'
// กำหนด DNS Server เป็น Google (8.8.8.8) และ Cloudflare (1.1.1.1)
// เพื่อให้ resolve hostname ของ MongoDB Atlas ได้ถูกต้อง
import http from 'http'
import { initSocket } from './src/config/socket.js'
import errorHandler from './src/middleware/error.middleware.js'
dns.setServers(['8.8.8.8', '1.1.1.1'])

const app = express()

const server = http.createServer(app)
initSocket(server)

// ใช้ PORT จาก .env ถ้าไม่มีให้ใช้ 4000 เป็นค่าเริ่มต้น
const PORT = process.env.PORT || 4000

// เชื่อมต่อ MongoDB
conn()

// เพิ่ม Security Headers ให้ทุก response อัตโนมัติ
app.use(helmet())

// แปลง request body จาก JSON string เป็น JavaScript object
// ทำให้เข้าถึงข้อมูลได้ผ่าน req.body
app.use(express.json())

// อ่านค่า cookies จาก request
// ทำให้เข้าถึง cookies ได้ผ่าน req.cookies
app.use(cookieParser())

// อนุญาตให้ Frontend ที่ระบุใน CLIENT_URL เรียก API ได้
// credentials: true = อนุญาตให้ส่ง cookies มาด้วย
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}))

app.get('/', (req, res) => res.json('API is working.'))

// Routes สำหรับระบบ Authentication
app.use('/api/auth', authRouter)

app.use(errorHandler)

// เริ่มรับ request ที่ PORT ที่กำหนด
server.listen(PORT, () => console.log(`Server Started on PORT: ${PORT}`))