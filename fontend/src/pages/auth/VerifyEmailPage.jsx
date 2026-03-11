import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const VerifyEmailPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email || ''

  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleConfirm = async () => {
    if (!otp) return setError('กรุณากรอกรหัส OTP')
    setError('')
    setLoading(true)
    try {
      const res = await fetch('http://localhost:4000/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'เกิดข้อผิดพลาด')
        return
      }

      // verify สำเร็จ → ไปหน้า login
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
      const res = await fetch('http://localhost:4000/api/auth/resend-otp', {
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
          <h1 className="text-4xl font-bold text-[#7C6FF7]">Email Verify</h1>
          <p className="text-[#7C6FF7] text-sm mt-4 leading-relaxed">
            ขณะนี้ระบบได้ทำการส่งรหัส OTP ไปที่อีเมล์{' '}
            <span className="font-semibold">({email})</span> <br />
            หากคุณไม่ได้รับอีเมล์กรุณากด ส่ง OTP ใหม่อีกครั้ง
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

        {/* OTP Input */}
        <div className="mb-2">
          <input
            type="text"
            placeholder="กรอกรหัส OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
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
          {loading ? 'กำลังยืนยัน...' : 'Confirm'}
        </button>

        {/* Cancel Button */}
        <button
          onClick={() => navigate('/register')}
          className="w-full bg-gray-200 text-[#7C6FF7] font-bold text-xl py-4 rounded-xl hover:bg-gray-300 transition"
        >
          Cancle
        </button>

      </div>
    </div>
  )
}

export default VerifyEmailPage