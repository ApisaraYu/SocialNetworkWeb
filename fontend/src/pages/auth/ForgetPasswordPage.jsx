import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const ForgotPasswordPage = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleConfirm = async () => {
    if (!email) return setError('กรุณากรอกอีเมล์')
    setError('')
    setLoading(true)
    try {
      const res = await fetch('http://localhost:4000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'เกิดข้อผิดพลาด')
        return
      }

      // ส่ง OTP สำเร็จ → ไปหน้า reset password
      navigate('/reset-password', { state: { email } })
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
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-[#7C6FF7] mb-4">ลืมรหัสผ่าน ?</h1>
          <p className="text-[#7C6FF7] text-sm leading-relaxed">
            คุณลืมรหัสผ่านใช่หรือไม่ <br />
            หากเป็นเช่นนั้นกรุณากรอกอีเมลของคุณที่ทำการ <br />
            สมัครกับเว็บไซต์เราไว้ เพื่อให้เราทำการส่ง OTP <br />
            ไปที่อีเมลของคุณ
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-100 text-red-600 text-sm rounded-lg px-4 py-2 mb-4 text-center">
            {error}
          </div>
        )}

        {/* Email Input */}
        <div className="mb-6">
          <input
            type="email"
            placeholder="กรอกอีเมลของคุณ"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-gray-100 rounded-lg px-4 py-3 text-gray-600 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#7C6FF7] transition"
          />
        </div>

        {/* Confirm Button */}
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="w-full bg-[#7C6FF7] text-white font-bold text-xl py-4 rounded-xl mb-4 hover:bg-[#6a5ee0] transition disabled:opacity-60"
        >
          {loading ? 'กำลังส่ง OTP...' : 'Confirm'}
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

export default ForgotPasswordPage