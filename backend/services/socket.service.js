import { getIO } from '../config/socket.js'

// เก็บ userId → socketId ไว้สำหรับส่งข้อความหา user โดยตรง
// Map<userId, socketId>
const onlineUsers = new Map()

const initSocketEvents = () => {
  const io = getIO()

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`)

    // ============ Online/Offline ============

    // User เชื่อมต่อ → เพิ่มเข้า onlineUsers
    socket.on('user_online', (userId) => {
      onlineUsers.set(userId, socket.id)
      // แจ้งให้ทุกคนรู้ว่า user นี้ online แล้ว
      io.emit('user_status', { userId, status: 'online' })
    })

    // ============ Chat ============

    // เข้าร่วมห้องแชท
    socket.on('join_conversation', (conversationId) => {
      socket.join(conversationId)
    })

    // ออกจากห้องแชท
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(conversationId)
    })

    // ส่งข้อความ
    socket.on('send_message', (messageData) => {
      // ส่งข้อความไปหาทุกคนในห้องแชทนั้น
      io.to(messageData.conversationId).emit('new_message', messageData)
    })

    // กำลังพิมพ์
    socket.on('typing', ({ conversationId, userId, username }) => {
      // แจ้งคนอื่นในห้องว่า user นี้กำลังพิมพ์
      socket.to(conversationId).emit('user_typing', { userId, username })
    })

    // หยุดพิมพ์
    socket.on('stop_typing', ({ conversationId, userId }) => {
      socket.to(conversationId).emit('user_stop_typing', { userId })
    })

    // ============ Notification ============

    // แจ้งเตือน like/comment ให้เจ้าของโพสต์
    socket.on('send_notification', ({ receiverId, notification }) => {
      const receiverSocketId = onlineUsers.get(receiverId)
      // ถ้า user นั้น online อยู่ ส่งแจ้งเตือนได้เลย
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('new_notification', notification)
      }
    })

    // ============ Disconnect ============

    // User ตัดการเชื่อมต่อ → เอาออกจาก onlineUsers
    socket.on('disconnect', () => {
      // หา userId จาก socketId ที่ disconnect
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId)
          // แจ้งให้ทุกคนรู้ว่า user นี้ offline แล้ว
          io.emit('user_status', { userId, status: 'offline' })
          break
        }
      }
      console.log(`Socket disconnected: ${socket.id}`)
    })
  })
}

// ดึงรายชื่อ user ที่ online อยู่ทั้งหมด
const getOnlineUsers = () => {
  return Array.from(onlineUsers.keys())
}

export { initSocketEvents, getOnlineUsers }