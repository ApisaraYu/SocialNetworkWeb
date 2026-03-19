import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'

const SocketContext = createContext(null)

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const token = localStorage.getItem('accessToken')

  useEffect(() => {
    if (!token) return

    const s = io('http://localhost:4000', {
      auth: { token },
    })

    s.on('connect', () => console.log('Socket connected'))

    // รับข้อความใหม่
    s.on('new_message', (message) => {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
      // ถ้าไม่ใช่ข้อความของตัวเอง เพิ่ม unread
      if (message.sender?._id !== currentUser._id) {
        setUnreadCount((prev) => prev + 1)
      }
    })

    setSocket(s)

    return () => s.disconnect()
  }, [token])

  return (
    <SocketContext.Provider value={{ socket, unreadCount, setUnreadCount }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)