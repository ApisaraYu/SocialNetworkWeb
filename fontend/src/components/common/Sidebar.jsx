import { useNavigate, useLocation } from 'react-router-dom'

const Sidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const menus = [
    { label: 'หน้าหลัก', path: '/timeline', icon: '🏠' },
    { label: 'โปรไฟล์', path: '/profile', icon: '👤' },
    { label: 'แชท', path: '/chat', icon: '💬' },
    { label: 'กลุ่ม', path: '/groups', icon: '👥' },
  ]

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  return (
    <div className="flex flex-col gap-3 w-60">

      {/* User Card */}
      <div
        className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition"
        onClick={() => navigate('/profile')}
      >
        <div className="w-10 h-10 rounded-full bg-[#7C6FF7] flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden">
          {user?.avatar?.url ? (
            <img src={user.avatar.url} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            user.username?.[0]?.toUpperCase() || 'U'
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">
            {user.username || 'Username'}
          </p>
          <p className="text-xs text-gray-400">ดูโปรไฟล์</p>
        </div>
      </div>

      {/* Menu */}
      <div className="bg-white rounded-2xl border border-gray-100 p-2 flex flex-col gap-1">
        {menus.map((menu) => (
          <button
            key={menu.path}
            onClick={() => navigate(menu.path)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition w-full text-left cursor-pointer
              ${location.pathname === menu.path
                ? 'bg-[#EEEDFE] text-[#7C6FF7] font-semibold'
                : 'text-gray-600 hover:bg-gray-50'
              }`}
          >
            <span className="text-base">{menu.icon}</span>
            {menu.label}
          </button>
        ))}
      </div>

    </div>
  )
}

export default Sidebar