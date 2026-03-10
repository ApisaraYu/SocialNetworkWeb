import { useNavigate } from 'react-router-dom'

const LandingPage = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#FCFCFC]">

      {/* Navbar */}
      <nav className="bg-[#7C6FF7] px-8 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
        <img
            src="/images/SOCIALIO_logo(1).png"
            alt="Socialio Logo"
            className="w-9 h-9 rounded-full border-2 border-white object-cover"
        />
        <span className="text-white font-bold text-xl">Socialio</span>
        </div>

        {/* Nav Buttons */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/login')}
            className="text-white font-semibold hover:opacity-80 transition cursor-pointer"
          >
            Log-in
          </button>
          <button
            onClick={() => navigate('/register')}
            className="bg-white text-[#7C6FF7] font-semibold px-5 py-2 rounded-full hover:opacity-90 transition cursor-pointer"
          >
            Sign up
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-8 py-16 flex items-center justify-between">

        {/* Left Content */}
        <div className="flex-1 max-w-lg">
            <h1 className="text-5xl font-extrabold text-[#3D3A8C] mb-6 leading-snug">
                ยินดีต้อนรับสู่ Socialio!
            </h1>
            <p className="text-[#3D3A8C] font-bold text-xl leading-relaxed mb-8">
                Socialio เว็บไซต์ Social Network <br />
                ที่คุณสามารถโพส และ สื่อสารกับผู้อื่นได้ <br />
                ด้วยระบบแชทและคอมเม้นท์โต้ตอบ!
             </p>
            <button
                onClick={() => navigate('/register')}
                className="bg-[#A89CF7] text-white font-semibold px-8 py-3 rounded-xl hover:bg-[#7C6FF7] transition cursor-pointer"
            >
                เริ่มเลย !
            </button>
        </div>

        {/* Right Image */}
        <div className="flex-1 flex justify-end pr-8">
        <img
            src="/images/hand-holding-phone.png"
            alt="Socialio Hero"
            className="w-full max-w-xl object-contain"
        />
        </div>

      </div>
    </div>
  )
}

export default LandingPage