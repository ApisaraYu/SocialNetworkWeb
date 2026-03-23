import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { useSocket } from '../../context/SocketContext'

const LoginPage = () => {
  const navigate = useNavigate()
  const { updateToken } = useSocket()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async () => {
    console.log('กด login แล้ว')
    setError('')
    setLoading(true)
    try {
      console.log('กำลัง fetch...')
      const res = await api.post('/api/auth/login', form)

      // เก็บ access token ไว้ใน localStorage
      localStorage.setItem('user', JSON.stringify(data.user))
      updateToken(data.accessToken)

      // ไปหน้า Timeline
      navigate('/timeline')
    } catch (err) {
      setError('ไม่สามารถเชื่อมต่อกับ server ได้')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#7C6FF7] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg px-10 py-10">

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#7C6FF7]">Log-in</h1>
          <p className="text-[#7C6FF7] text-lg mt-1">เข้าสู่ระบบ</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-100 text-red-600 text-sm rounded-lg px-4 py-2 mb-4 text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="flex flex-col gap-5">

          {/* Email */}
          <div>
            <label className="text-sm font-semibold text-[#3D3A8C] mb-1 block">
              กรอกอีเมล์
            </label>
            <input
              type="email"
              name="email"
              placeholder="อีเมล์"
              value={form.email}
              onChange={handleChange}
              className="w-full bg-gray-100 rounded-lg px-4 py-3 text-gray-600 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#7C6FF7] transition"
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-sm font-semibold text-[#3D3A8C] mb-1 block">
              กรอกรหัสผ่าน
            </label>
            <input
              type="password"
              name="password"
              placeholder="รหัสผ่าน"
              value={form.password}
              onChange={handleChange}
              className="w-full bg-gray-100 rounded-lg px-4 py-3 text-gray-600 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#7C6FF7] transition"
            />
            <p
              onClick={() => navigate('/forgot-password')}
              className="text-[#7C6FF7] text-sm mt-2 cursor-pointer hover:underline"
            >
              ลืมรหัสผ่าน ?
            </p>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-[#7C6FF7] text-white font-bold text-xl py-4 rounded-xl mt-2 hover:bg-[#6a5ee0] transition disabled:opacity-60 cursor-pointer"
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'Log-in'}
          </button>

          {/* Register Link */}
          <p className="text-center text-sm text-gray-400">
            ยังไม่มีบัญชี?{' '}
            <span
              onClick={() => navigate('/register')}
              className="text-[#7C6FF7] font-semibold cursor-pointer hover:underline"
            >
              สมัครสมาชิก
            </span>
          </p>

        </div>
      </div>
    </div>
  )
}

export default LoginPage