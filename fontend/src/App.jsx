import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'  // 👈 เพิ่มตรงนี้
import LandingPage from './pages/LandingPage'
import RegisterPage from './pages/auth/RegisterPage'
import LoginPage from './pages/auth/LoginPage'

import Home from './pages/Home'

function App() {
  return (
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/verify-email" element={<div>Verify Email (coming soon)</div>} />
            <Route path="/forgot-password" element={<div>Forgot Password (coming soon)</div>} />
          </Routes>
  )
}

export default App