import { Server } from 'socket.io'

let io

// สร้าง Socket.IO server และผูกกับ HTTP server
const initSocket = (server) => {
  io = new Server(server, {
    // กำหนด CORS ให้ตรงกับ Frontend
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
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