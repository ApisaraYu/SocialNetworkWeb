import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'

const ForgotPasswordPage = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', securityAnswer: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleConfirm = async () => {
  if (!form.email) return setError('กรุณากรอกอีเมล์')
  if (!form.securityAnswer.trim()) return setError('กรุณาตอบคำถามความปลอดภัย')
  setError('')
  setLoading(true)
  try {
    const res = await api.post('/auth/forgot-password', form)
    navigate('/reset-password', {
      state: { resetToken: res.data.data.resetToken },
    })
  } catch (err) {
    setError(err.response?.data?.message || 'ไม่สามารถเชื่อมต่อกับ server ได้')
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="min-h-screen bg-[#7C6FF7] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg px-10 py-10">

        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-[#7C6FF7] mb-4">ลืมรหัสผ่าน ?</h1>
          <p className="text-[#7C6FF7] text-sm leading-relaxed">
            กรอกอีเมล์และตอบคำถามความปลอดภัย <br />
            ที่คุณตั้งไว้ตอนสมัครสมาชิก
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-100 text-red-600 text-sm rounded-lg px-4 py-2 mb-4 text-center">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-4 mb-6">

          {/* Email */}
          <div>
            <label className="text-sm font-semibold text-[#3D3A8C] mb-1 block">
              อีเมล์
            </label>
            <input
              type="email"
              name="email"
              placeholder="กรอกอีเมลของคุณ"
              value={form.email}
              onChange={handleChange}
              className="w-full bg-gray-100 rounded-lg px-4 py-3 text-gray-600 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#7C6FF7] transition"
            />
          </div>

          {/* Security Question */}
          <div>
            <label className="text-sm font-semibold text-[#3D3A8C] mb-1 block">
              คำถามความปลอดภัย
            </label>
            <div className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-500 text-sm mb-2">
              🍜 คุณชอบอาหารอะไร?
            </div>
            <input
              type="text"
              name="securityAnswer"
              placeholder="กรอกคำตอบของคุณ"
              value={form.securityAnswer}
              onChange={handleChange}
              className="w-full bg-gray-100 rounded-lg px-4 py-3 text-gray-600 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#7C6FF7] transition"
            />
          </div>

        </div>

        {/* Confirm Button */}
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="w-full bg-[#7C6FF7] text-white font-bold text-xl py-4 rounded-xl mb-4 hover:bg-[#6a5ee0] transition disabled:opacity-60"
        >
          {loading ? 'กำลังตรวจสอบ...' : 'Confirm'}
        </button>

        {/* Cancel Button */}
        <button
          onClick={() => navigate('/login')}
          className="w-full bg-gray-200 text-[#7C6FF7] font-bold text-xl py-4 rounded-xl hover:bg-gray-300 transition"
        >
          Cancel
        </button>

      </div>
    </div>
  )
}

export default ForgotPasswordPage