import { useNavigate } from 'react-router-dom'

const NotFoundPage = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-8xl font-extrabold text-[#7C6FF7] mb-4">404</h1>
        <h2 className="text-2xl font-bold text-gray-700 mb-2">ไม่พบหน้านี้</h2>
        <p className="text-gray-400 mb-8">หน้าที่คุณค้นหาไม่มีอยู่หรืออาจถูกลบไปแล้ว</p>
        <button
          onClick={() => navigate('/')}
          className="px-8 py-3 bg-[#7C6FF7] text-white font-semibold rounded-xl hover:bg-[#6a5ee0] transition cursor-pointer"
        >
          กลับหน้าหลัก
        </button>
      </div>
    </div>
  )
}

export default NotFoundPage