import React from 'react'
import logo from './assets/SOCIALIO_logo.png'
import { BrowserRouter, Routes, Route } from 'react-router-dom'  // 👈 เพิ่มตรงนี้
import Home from './pages/Home'
import Login from './pages/Login'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-100">

        {/* Navbar — บรรทัด 8-13 */}
        <div className="bg-white fixed top-0 left-0 right-0 z-50 shadow-sm px-4">
          <div className="text-3xl font-extrabold font-sans text-cyan-700 flex items-center gap-2">
            <img className="object-cover h-20" src={logo}/>Socialio
          </div>
        </div>

        {/* Routes — บรรทัด 16-21 */}
        <div className="pt-24">
          <Routes>  {/* 👈 เพิ่มตรงนี้ */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </div>

      </div>
    </BrowserRouter>
  )
}

export default App