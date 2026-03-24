import { useState } from 'react'
import api from '../../services/api'
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
  const resetToken = location.state?.resetToken || ''

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // ป้องกันเข้าหน้านี้โดยตรงโดยไม่มี token
  if (!resetToken) {
    return (
      <div className="min-h-screen bg-[#7C6FF7] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg px-10 py-10 text-center">
          <p className="text-red-500 mb-4">ไม่พบข้อมูลการรีเซ็ตรหัสผ่าน</p>
          <button
            onClick={() => navigate('/forgot-password')}
            className="bg-[#7C6FF7] text-white font-bold py-3 px-6 rounded-xl hover:bg-[#6a5ee0] transition"
          >
            กลับไปหน้าลืมรหัสผ่าน
          </button>
        </div>
      </div>
    )
  }

  const handleConfirm = async () => {
    if (!newPassword) return setError('กรุณากรอกรหัสผ่านใหม่')
    if (newPassword !== confirmPassword) return setError('รหัสผ่านไม่ตรงกัน')
    const passwordError = validatePassword(newPassword)
    if (passwordError) return setError(passwordError)

    setError('')
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { resetToken, newPassword })

      if (!res.ok) {
        setError(data.message || 'เกิดข้อผิดพลาด')
        return
      }

      navigate('/login')
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
          <h1 className="text-4xl font-bold text-[#7C6FF7] mb-4">รีเซ็ตรหัสผ่าน</h1>
          <p className="text-[#7C6FF7] text-sm leading-relaxed">
            กรอกรหัสผ่านใหม่ของคุณ
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-100 text-red-600 text-sm rounded-lg px-4 py-2 mb-4 text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="flex flex-col gap-4 mb-6">

          {/* New Password */}
          <div>
            <label className="text-sm font-semibold text-[#3D3A8C] mb-1 block">
              รหัสผ่านใหม่
            </label>
            <input
              type="password"
              placeholder="กรอกรหัสผ่านใหม่"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-gray-100 rounded-lg px-4 py-3 text-gray-600 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#7C6FF7] transition"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-sm font-semibold text-[#3D3A8C] mb-1 block">
              ยืนยันรหัสผ่านใหม่
            </label>
            <input
              type="password"
              placeholder="กรอกรหัสผ่านอีกครั้ง"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
          {loading ? 'กำลังรีเซ็ต...' : 'Confirm'}
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

export default ResetPasswordPage