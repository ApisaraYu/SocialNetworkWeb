import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'

let io

// สร้าง Socket.IO server และผูกกับ HTTP server
const initSocket = (server) => {
  io = new Server(server, {
    // กำหนด CORS ให้ตรงกับ Frontend
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  })

  io.use((socket, next) => {
    const token = socket.handshake.auth.token
    if (!token) return next(new Error('Unauthorized'))
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      socket.userId = decoded.id
      next()
    } catch {
      next(new Error('Unauthorized'))
    }
  })

  io.on('connection', (socket) => {
    console.log('User connected:', socket.userId)
    // join room ของตัวเอง เพื่อรับข้อความ
    socket.join(socket.userId)

    socket.on('join_room', (roomId) => {
    socket.join(roomId)
    console.log(`User ${socket.userId} joined room ${roomId}`)
  })

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.userId)
    })
  })
  
  return io
}

// ดึง instance ของ io ไปใช้ในไฟล์อื่น
// เรียกใช้หลังจาก initSocket แล้วเท่านั้น
const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO ยังไม่ได้ถูก initialize')
  }
  return io
}

export { initSocket, getIO }