import { useState } from 'react'
import API_URL from '../../services/api'
import { useNavigate } from 'react-router-dom'

const validatePassword = (password) => {
  if (password.length < 8) return 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'
  if (!/[A-Z]/.test(password)) return 'รหัสผ่านต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว'
  if (!/[a-z]/.test(password)) return 'รหัสผ่านต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัว'
  if (!/[0-9]/.test(password)) return 'รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว'
  return null
}
const RegisterPage = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async () => {
    setError('')
    const passwordError = validatePassword(form.password)
    if (passwordError) return setError(passwordError)
    setLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'เกิดข้อผิดพลาด')
        return
      }

      // สมัครสำเร็จ → ไปหน้า verify email
      navigate('/verify-email', { state: { email: form.email } })
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
          <h1 className="text-4xl font-bold text-[#7C6FF7]">Sign Up</h1>
          <p className="text-[#7C6FF7] text-lg mt-1">สมัครสมาชิก</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-100 text-red-600 text-sm rounded-lg px-4 py-2 mb-4 text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="flex flex-col gap-5">

          {/* Username */}
          <div>
            <label className="text-sm font-semibold text-[#3D3A8C] mb-1 block">
              กรอกชื่อผู้ใช้
            </label>
            <input
              type="text"
              name="username"
              placeholder="ชื่อผู้ใช้"
              value={form.username}
              onChange={handleChange}
              className="w-full bg-gray-100 rounded-lg px-4 py-3 text-gray-600 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#7C6FF7] transition"
            />
          </div>

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
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-[#7C6FF7] text-white font-bold text-xl py-4 rounded-xl mt-2 hover:bg-[#6a5ee0] transition disabled:opacity-60 cursor-pointer"
          >
            {loading ? 'กำลังสมัคร...' : 'Sign Up'}
          </button>

          {/* Login Link */}
          <p className="text-center text-sm text-gray-400">
            มีบัญชีอยู่แล้ว?{' '}
            <span
              onClick={() => navigate('/login')}
              className="text-[#7C6FF7] font-semibold cursor-pointer hover:underline"
            >
              เข้าสู่ระบบ
            </span>
          </p>

        </div>
      </div>
    </div>
  )
}

export default RegisterPage