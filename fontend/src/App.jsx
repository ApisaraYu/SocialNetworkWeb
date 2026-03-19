import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import VerifyEmailPage from './pages/auth/VerifyEmailPage'
import TimelinePage from './pages/TimelinePage'
import ForgotPasswordPage from './pages/auth/ForgetPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import ProfilePage from './pages/ProfilePage'
import FriendRequestsPage from './pages/FriendRequestsPage'
import EditProfilePage from './pages/EditProfilePage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/timeline" element={<TimelinePage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/profile/:id" element={<ProfilePage />} />
      <Route path="/friend-requests" element={<FriendRequestsPage />} />
      <Route path="/edit-profile" element={<EditProfilePage />} />
    </Routes>
  )
}

export default App