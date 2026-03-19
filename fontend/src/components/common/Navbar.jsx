import { useState, useEffect } from 'react'
import { useSocket } from '../../context/SocketContext'
import { useNavigate } from 'react-router-dom'

const Navbar = () => {
  const { unreadCount, setUnreadCount } = useSocket()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [showResults, setShowResults] = useState(false)
  const [friendRequestCount, setFriendRequestCount] = useState(0)

  const token = localStorage.getItem('accessToken')
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  // ดึงจำนวนคำขอเพื่อน
  const fetchFriendRequestCount = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/users/friend-requests', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) setFriendRequestCount(data.data?.length || 0)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchFriendRequestCount()
    // ดึงทุก 30 วินาที
    const interval = setInterval(fetchFriendRequestCount, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
    navigate('/')
  }

  const handleSearch = async (e) => {
    const value = e.target.value
    setSearch(value)

    if (!value.trim()) {
      setResults([])
      setShowResults(false)
      return
    }

    try {
      const res = await fetch(`http://localhost:4000/api/users/search?q=${value}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) {
        setResults(data.data || [])
        setShowResults(true)
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <nav className="bg-[#7C6FF7] px-6 py-3 flex items-center justify-between fixed top-0 left-0 right-0 z-50 gap-4">

      {/* Logo */}
      <div
        className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition flex-shrink-0"
        onClick={() => navigate('/timeline')}
      >
        <img
          src="/images/SOCIALIO_logo(1).png"
          alt="Socialio Logo"
          className="w-8 h-8 rounded-full border-2 border-white object-cover"
        />
        <span className="text-white font-bold text-lg">Socialio</span>
      </div>

      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <input
          type="text"
          placeholder="ค้นหาผู้ใช้..."
          value={search}
          onChange={handleSearch}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          className="w-full bg-white/20 text-white placeholder-white/70 rounded-full px-4 py-2 text-sm outline-none focus:bg-white/30 transition"
        />

        {/* Search Results Dropdown */}
        {showResults && results.length > 0 && (
          <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-lg overflow-hidden z-50">
            {results.map((user) => (
              <div
                key={user._id}
                onClick={() => {
                  navigate(`/profile/${user._id}`)
                  setSearch('')
                  setShowResults(false)
                }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition"
              >
                <div className="w-8 h-8 rounded-full bg-[#7C6FF7] flex items-center justify-center text-white text-sm font-bold flex-shrink-0 overflow-hidden">
                  {user.avatar?.url ? (
                    <img src={user.avatar.url} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    user.username?.[0]?.toUpperCase() || 'U'
                  )}
                </div>
                <p className="text-sm font-semibold text-gray-800">{user.username}</p>
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {showResults && results.length === 0 && search.trim() && (
          <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-lg px-4 py-3 z-50">
            <p className="text-sm text-gray-400">ไม่พบผู้ใช้</p>
          </div>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3 flex-shrink-0">

        {/* แจ้งเตือนคำขอเพื่อน */}
        <button
          onClick={() => navigate('/friend-requests')}
          className="relative w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition cursor-pointer"
        >
          <span className="text-white text-sm">🔔</span>
          {friendRequestCount > 0 && (
            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
              {friendRequestCount}
            </span>
          )}
        </button>

        {/* แชท */}
        <button
          onClick={() => {
            navigate('/chat')
            setUnreadCount(0) // clear เมื่อเปิดแชท
          }}
          className="relative w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition cursor-pointer"
        >
          <span className="text-white text-sm">💬</span>
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Avatar */}
        <button
          onClick={() => navigate('/profile')}
          className="w-9 h-9 rounded-full bg-white/30 flex items-center justify-center hover:bg-white/40 transition border-2 border-white overflow-hidden cursor-pointer"
        >
          {user?.avatar?.url ? (
            <img src={user.avatar.url} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-white text-sm font-bold">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </span>
          )}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="text-white/80 text-sm hover:text-white transition cursor-pointer"
        >
          ออกจากระบบ
        </button>

      </div>
    </nav>
  )
}

export default Navbar