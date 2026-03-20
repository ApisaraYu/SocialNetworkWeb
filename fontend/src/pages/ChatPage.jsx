import { useState, useEffect, useRef } from 'react'
import { useSocket } from '../context/SocketContext'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/common/Layout'

const ChatPage = () => {
  const { socket } = useSocket()
  const navigate = useNavigate()
  const [conversations, setConversations] = useState([])
  const [selectedConv, setSelectedConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const token = localStorage.getItem('accessToken')
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

  // ดึงรายการแชท
  const fetchConversations = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/chats', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) setConversations(data.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  // ดึงข้อความในแชท
  const fetchMessages = async (convId) => {
    setLoading(true)
    try {
      const res = await fetch(`http://localhost:4000/api/chats/${convId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) setMessages(data.data.messages || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConversations()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
  if (!socket) return

  socket.on('new_message', (message) => {
    if (message.conversation === selectedConv?._id) {
      setMessages((prev) => [...prev, message])
    }
    fetchConversations()
  })

  return () => socket.off('new_message')
  }, [socket, selectedConv])

  const handleSelectConv = async (conv) => {
    setSelectedConv(conv)
    await fetchMessages(conv._id)
    // mark as read
    if (socket) {
      socket.emit('join_room', conv._id)
    }
    await fetch(`http://localhost:4000/api/chats/${conv._id}/read`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    })
  }

  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    if (selected) {
      setFile(selected)
      setPreview(URL.createObjectURL(selected))
    }
  }

  const handleSend = async () => {
    if (!text.trim() && !file) return
    try {
      const formData = new FormData()
      if (text.trim()) formData.append('content', text)
      if (file) formData.append('media', file)

      const res = await fetch(`http://localhost:4000/api/chats/${selectedConv._id}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (res.ok) {
        setText('')
        setFile(null)
        setPreview(null)
        fetchMessages(selectedConv._id)
        fetchConversations()
      }
    } catch (err) {
      console.error(err)
    }
  }

  // หาคู่สนทนา (ไม่ใช่ตัวเอง)
  const getPartner = (conv) => {
    return conv.participants?.find((p) => p._id !== currentUser._id)
  }

  return (
    <Layout>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex" style={{ height: 'calc(100vh - 100px)' }}>

        {/* Chat List */}
        <div className="w-72 flex-shrink-0 border-r border-gray-100 flex flex-col">
          <div className="px-4 py-4 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-800">ข้อความ</h3>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-10">ยังไม่มีการสนทนา</p>
            ) : (
              conversations.map((conv) => {
                const partner = getPartner(conv)
                return (
                  <div
                    key={conv._id}
                    onClick={() => handleSelectConv(conv)}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-gray-50 transition
                      ${selectedConv?._id === conv._id ? 'bg-[#EEEDFE]' : 'hover:bg-gray-50'}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-[#7C6FF7] flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden">
                      {partner?.avatar?.url ? (
                        <img src={partner.avatar.url} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        partner?.username?.[0]?.toUpperCase() || 'U'
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{partner?.username}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {conv.lastMessage?.content || 'เริ่มการสนทนา'}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Chat Box */}
        {selectedConv ? (
          <div className="flex-1 flex flex-col min-w-0">

            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
              <div
                onClick={() => navigate(`/profile/${getPartner(selectedConv)?._id}`)}
                className="w-9 h-9 rounded-full bg-[#7C6FF7] flex items-center justify-center text-white text-sm font-bold flex-shrink-0 overflow-hidden cursor-pointer hover:opacity-80 transition"
              >
                {getPartner(selectedConv)?.avatar?.url ? (
                  <img src={getPartner(selectedConv).avatar.url} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  getPartner(selectedConv)?.username?.[0]?.toUpperCase() || 'U'
                )}
              </div>
              <div>
                <p
                  onClick={() => navigate(`/profile/${getPartner(selectedConv)?._id}`)}
                  className="text-sm font-semibold text-gray-800 cursor-pointer hover:underline"
                >
                  {getPartner(selectedConv)?.username}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50 flex flex-col gap-3">
              {loading ? (
                <p className="text-center text-gray-400 text-sm">กำลังโหลด...</p>
              ) : messages.length === 0 ? (
                <p className="text-center text-gray-400 text-sm">เริ่มการสนทนากันเลย!</p>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender?._id === currentUser._id
                  const partner = getPartner(selectedConv)
                  return (
                    <div key={msg._id} className={`flex gap-2 items-end ${isMe ? 'justify-end' : ''}`}>

                      {/* Avatar คู่สนทนาเท่านั้น */}
                      {!isMe && (
                        <div className="w-7 h-7 rounded-full bg-[#7C6FF7] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
                          {partner?.avatar?.url ? (
                            <img src={partner.avatar.url} alt="avatar" className="w-full h-full object-cover" />
                          ) : (
                            partner?.username?.[0]?.toUpperCase() || 'U'
                          )}
                        </div>
                      )}

                      <div className={`flex flex-col max-w-xs ${isMe ? 'items-end' : 'items-start'}`}>

                        {/* ข้อความ */}
                        {msg.isDeleted ? (
                          <div className="px-3 py-2 rounded-2xl bg-gray-200 text-gray-400 text-xs italic">
                            ข้อความถูกลบแล้ว
                          </div>
                        ) : (
                          <>
                            {msg.content && (
                              <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed
                                ${isMe
                                  ? 'bg-[#7C6FF7] text-white rounded-br-sm'
                                  : 'bg-white text-gray-800 rounded-bl-sm'
                                }`}
                              >
                                {msg.content}
                              </div>
                            )}

                            {/* Media */}
                            {msg.media?.length > 0 && (
                              msg.media[0].type === 'video' ? (
                                <video
                                  src={msg.media[0].url}
                                  controls
                                  className="max-w-xs rounded-2xl mt-1"
                                />
                              ) : (
                                <img
                                  src={msg.media[0].url}
                                  alt="media"
                                  className="max-w-xs rounded-2xl mt-1 cursor-pointer hover:opacity-90 transition"
                                />
                              )
                            )}
                          </>
                        )}

                        {/* เวลา */}
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(msg.createdAt).toLocaleTimeString('th-TH', {
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Preview ไฟล์ */}
            {preview && (
              <div className="px-4 pt-3 relative">
                <img src={preview} alt="preview" className="h-20 rounded-xl object-cover" />
                <button
                  onClick={() => { setFile(null); setPreview(null) }}
                  className="absolute top-2 right-3 bg-black/50 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Input */}
            <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-2 bg-white">
              <label className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition flex-shrink-0">
                <span className="text-base">📷</span>
                <input type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
              </label>
              <input
                type="text"
                placeholder="พิมพ์ข้อความ..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm text-gray-600 outline-none focus:ring-2 focus:ring-[#7C6FF7] transition"
              />
              <button
                onClick={handleSend}
                disabled={!text.trim() && !file}
                className="w-9 h-9 rounded-full bg-[#7C6FF7] flex items-center justify-center hover:bg-[#6a5ee0] transition disabled:opacity-50 cursor-pointer flex-shrink-0"
              >
                <span className="text-white text-sm">➤</span>
              </button>
            </div>

          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            เลือกการสนทนาเพื่อเริ่มแชท
          </div>
        )}

      </div>
    </Layout>
  )
}

export default ChatPage