import { createContext, useContext, useEffect, useState } from 'react'
import api from '../services/api'
import { io } from 'socket.io-client'

const SocketContext = createContext(null)

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [token, setToken] = useState(localStorage.getItem('accessToken'))

  const updateToken = (newToken) => {
    if (newToken) {
      localStorage.setItem('accessToken', newToken)
    } else {
      localStorage.removeItem('accessToken')
    }
    setToken(newToken)
    setUnreadCount(0)
  }

  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect()
        setSocket(null)
      }
      return
    }

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000'

    const s = io(SOCKET_URL, {
      auth: { token },
      withCredentials: true,
    })

    s.on('connect', () => console.log('✅ Socket connected:', s.id))
    s.on('connect_error', (err) => console.error('❌ Socket error:', err.message))

    s.on('new_message', (message) => {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
      const senderId = message.sender?._id?.toString()
      const myId = currentUser._id?.toString()
      if (senderId !== myId) {
        setUnreadCount((prev) => prev + 1)
      }
    })

    setSocket(s)
    return () => s.disconnect()
  }, [token])

  return (
    <SocketContext.Provider value={{ socket, unreadCount, setUnreadCount, updateToken }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)