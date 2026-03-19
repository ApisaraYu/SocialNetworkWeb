import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/common/Layout'

const EditProfilePage = () => {
  const navigate = useNavigate()
  const token = localStorage.getItem('accessToken')
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

  const [form, setForm] = useState({ username: '', bio: '' })
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [coverFile, setCoverFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  //โหลดข้อมูลปจบ.
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (res.ok) {
          setForm({
            username: data.data.username || '',
            bio: data.data.bio || '',
          })
          setAvatarPreview(data.data.avatar?.url || null)
          setCoverPreview(data.data.coverPhoto?.url || null)
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchMe()
  }, [])

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleCoverChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setCoverFile(file)
      setCoverPreview(URL.createObjectURL(file))
    }
  }

  const handleSave = async () => {
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      // 1. อัปเดต username และ bio
      const res = await fetch('http://localhost:4000/api/users/me', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: form.username, bio: form.bio }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.message || 'เกิดข้อผิดพลาด')
        return
      }

      // 2. อัปโหลด avatar ถ้ามีการเปลี่ยน
      let newAvatarUrl = currentUser.avatar?.url || ''
      if (avatarFile) {
        const formData = new FormData()
        formData.append('avatar', avatarFile)
        const avatarRes = await fetch('http://localhost:4000/api/users/me/avatar', {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        })
        const avatarData = await avatarRes.json()
        if (avatarRes.ok) {
          newAvatarUrl = avatarData.data.avatar?.url || newAvatarUrl
        }
      }

      // 3. อัปโหลด cover ถ้ามีการเปลี่ยน
      if (coverFile) {
        const formData = new FormData()
        formData.append('coverPhoto', coverFile)
        await fetch('http://localhost:4000/api/users/me/cover', {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        })
      }

      // 4. อัปเดต localStorage ให้ครบทุก field
      localStorage.setItem('user', JSON.stringify({
        ...currentUser,
        username: form.username,
        avatar: { url: newAvatarUrl },
      }))

      setSuccess('บันทึกข้อมูลสำเร็จ')
      setTimeout(() => navigate('/profile'), 1500)
    } catch (err) {
      setError('ไม่สามารถเชื่อมต่อกับ server ได้')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-xl mx-auto flex flex-col gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

          {/* Cover Photo */}
          <div className="relative w-full h-40 bg-gradient-to-r from-[#7C6FF7] to-[#a89cf7]">
            {coverPreview && (
              <img src={coverPreview} alt="cover" className="w-full h-full object-cover" />
            )}
            <label className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer hover:bg-black/40 transition">
              <span className="text-white text-sm font-semibold">📷 เปลี่ยนรูปหน้าปก</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
            </label>
          </div>

          <div className="px-6 pb-6">

            {/* Avatar */}
            <div className="relative inline-block -mt-10 mb-5">
              <div className="w-20 h-20 rounded-full bg-[#7C6FF7] border-4 border-white flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  form.username?.[0]?.toUpperCase() || 'U'
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-7 h-7 bg-[#7C6FF7] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#6a5ee0] transition border-2 border-white">
                <span className="text-white text-xs">✎</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
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
            <div className="flex flex-col gap-4">

              {/* Username */}
              <div>
                <label className="text-sm font-semibold text-gray-600 mb-1 block">Username</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full bg-gray-100 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#7C6FF7] transition"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="text-sm font-semibold text-gray-600 mb-1 block">Bio</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  rows={3}
                  placeholder="เขียนอะไรเกี่ยวกับตัวเอง..."
                  className="w-full bg-gray-100 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#7C6FF7] transition resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => navigate('/profile')}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-200 transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 py-3 bg-[#7C6FF7] text-white text-sm font-semibold rounded-xl hover:bg-[#6a5ee0] transition disabled:opacity-60 cursor-pointer"
                >
                  {loading ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default EditProfilePage