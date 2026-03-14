import { useNavigate } from 'react-router-dom'

const Navbar = () => {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
    navigate('/')
  }

  return (
    <nav className="bg-[#7C6FF7] px-6 py-3 flex items-center justify-between fixed top-0 left-0 right-0 z-50">
      {/* Logo */}
      <div
        className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
        onClick={() => navigate('/timeline')}
      >
        <img
          src="/images/SOCIALIO_logo(1).png"
          alt="Socialio Logo"
          className="w-8 h-8 rounded-full border-2 border-white object-cover"
        />
        <span className="text-white font-bold text-lg">Socialio</span>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* แจ้งเตือน */}
        <button className="relative w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition cursor-pointer">
          <span className="text-white text-sm">🔔</span>
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">3</span>
        </button>

        {/* แชท */}
        <button
          onClick={() => navigate('/chat')}
          className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition cursor-pointer"
        >
          <span className="text-white text-sm">💬</span>
        </button>

        {/* Avatar */}
        <button
          onClick={() => navigate('/profile')}
          className="w-9 h-9 rounded-full bg-white/30 flex items-center justify-center hover:bg-white/40 transition border-2 border-white cursor-pointer"
        >
          <span className="text-white text-sm font-bold">U</span>
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