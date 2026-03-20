import { useState } from 'react'
import API_URL from '../../services/api'
import { useNavigate, useLocation } from 'react-router-dom'

const validatePassword = (password) => {
  if (password.length < 8) return 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'
  if (!/[A-Z]/.test(password)) return 'รหัสผ่านต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว'
  if (!/[a-z]/.test(password)) return 'รหัสผ่านต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัว'
  if (!/[0-9]/.test(password)) return 'รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว'
  return null
}
const ResetPasswordPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email || ''

  const [form, setForm] = useState({ otp: '', newPassword: '' })
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleConfirm = async () => {
    if (!form.otp) return setError('กรุณากรอกรหัส OTP')
    if (!form.newPassword) return setError('กรุณากรอกรหัสผ่านใหม่')
    const passwordError = validatePassword(form.newPassword)
    if (passwordError) return setError(passwordError)
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: form.otp, newPassword: form.newPassword }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'เกิดข้อผิดพลาด')
        return
      }

      // รีเซ็ตสำเร็จ → ไปหน้า login
      navigate('/login')
    } catch (err) {
      setError('ไม่สามารถเชื่อมต่อกับ server ได้')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setSuccess('')
    setResending(true)
    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'เกิดข้อผิดพลาด')
        return
      }

      setSuccess('ส่ง OTP ใหม่แล้ว กรุณาเช็คอีเมล์')
    } catch (err) {
      setError('ไม่สามารถเชื่อมต่อกับ server ได้')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#7C6FF7] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg px-10 py-10">

        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-[#7C6FF7] mb-4">รีเซ็ตรหัสผ่าน</h1>
          <p className="text-[#7C6FF7] text-sm leading-relaxed">
            ขณะนี้เราได้ส่งรหัส OTP ไปที่อีเมล์ ({email}) แล้ว <br />
            หากคุณไม่ได้รับอีเมล์กรุณากดส่ง OTP ใหม่อีกครั้ง
          </p>
        </div>

        {/* Error / Success */}
        {error && (
          <div className="bg-red-100 text-red-600 text-sm rounded-lg px-4 py-2 mb-4 text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 text-green-600 text-sm rounded-lg px-4 py-2 mb-4 text-center">
            {success}
          </div>
        )}

        {/* Form */}
        <div className="flex flex-col gap-4 mb-2">

          {/* OTP */}
          <input
            type="text"
            name="otp"
            placeholder="กรอก OTP"
            value={form.otp}
            onChange={handleChange}
            className="w-full bg-gray-100 rounded-lg px-4 py-3 text-gray-600 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#7C6FF7] transition"
          />

          {/* New Password */}
          <input
            type="password"
            name="newPassword"
            placeholder="กรอกรหัสผ่านใหม่"
            value={form.newPassword}
            onChange={handleChange}
            className="w-full bg-gray-100 rounded-lg px-4 py-3 text-gray-600 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#7C6FF7] transition"
          />

        </div>

        {/* Resend */}
        <p
          onClick={handleResend}
          className="text-[#7C6FF7] text-sm mb-6 cursor-pointer hover:underline"
        >
          {resending ? 'กำลังส่ง...' : 'ส่ง OTP ใหม่อีกครั้ง?'}
        </p>

        {/* Confirm Button */}
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="w-full bg-[#7C6FF7] text-white font-bold text-xl py-4 rounded-xl mb-4 hover:bg-[#6a5ee0] transition disabled:opacity-60"
        >
          {loading ? 'กำลังรีเซ็ต...' : 'Confirm'}
        </button>

        {/* Cancel Button */}
        <button
          onClick={() => navigate('/login')}
          className="w-full bg-gray-200 text-[#7C6FF7] font-bold text-xl py-4 rounded-xl hover:bg-gray-300 transition"
        >
          Cancle
        </button>

      </div>
    </div>
  )
}

export default ResetPasswordPage