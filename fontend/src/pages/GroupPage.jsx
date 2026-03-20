import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API_URL from '../services/api'
import Layout from '../components/common/Layout'

const GroupPage = () => {
  const navigate = useNavigate()
  const [myGroups, setMyGroups] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)
  const [createForm, setCreateForm] = useState({ name: '', description: '', privacy: 'public' })
  const [myGroupsLimit, setMyGroupsLimit] = useState(6)

  const token = localStorage.getItem('accessToken')
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

  // ดึงกลุ่มที่เข้าร่วม
  const fetchMyGroups = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/groups/my`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) setMyGroups(data.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // ค้นหากลุ่ม
  const handleSearch = async (e) => {
    const value = e.target.value
    setSearch(value)
    if (!value.trim()) {
      setSearchResults([])
      return
    }
    try {
      const res = await fetch(`${API_URL}/api/groups/search?q=${value}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) setSearchResults(data.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  // สร้างกลุ่ม
  const handleCreate = async () => {
  if (!createForm.name) return
  try {
    // สร้างกลุ่มก่อน
    const res = await fetch(`${API_URL}/api/groups`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createForm),
    })
    const data = await res.json()
    if (!res.ok) return

    const groupId = data.data._id

    // อัปโหลด avatar ถ้ามี
    if (avatarFile) {
      const formData = new FormData()
      formData.append('avatar', avatarFile)
      await fetch(`${API_URL}/api/groups/${groupId}/avatar`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
    }

    // อัปโหลด cover ถ้ามี
    if (coverFile) {
      const formData = new FormData()
      formData.append('coverPhoto', coverFile)
      await fetch(`${API_URL}/api/groups/${groupId}/cover`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
    }

    setShowCreate(false)
    setCreateForm({ name: '', description: '', privacy: 'public' })
    setAvatarFile(null)
    setAvatarPreview(null)
    setCoverFile(null)
    setCoverPreview(null)
    navigate(`/groups/${groupId}`)
    } catch (err) {
        console.error(err)
    }
  }

  useEffect(() => {
    fetchMyGroups()
  }, [])

  const displayedGroups = search ? searchResults : myGroups.slice(0, myGroupsLimit)

  return (
    <Layout>
      <div className="flex flex-col gap-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">กลุ่ม</h2>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-[#7C6FF7] text-white text-sm font-semibold rounded-xl hover:bg-[#6a5ee0] transition cursor-pointer"
          >
            + สร้างกลุ่ม
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="ค้นหากลุ่ม..."
          value={search}
          onChange={handleSearch}
          className="w-full bg-white rounded-xl border border-gray-100 px-4 py-3 text-sm text-gray-600 outline-none focus:ring-2 focus:ring-[#7C6FF7] transition"
        />

        {/* Groups */}
        <div>
          <p className="text-sm font-semibold text-gray-500 mb-3">
            {search ? 'ผลการค้นหา' : 'กลุ่มที่เข้าร่วม'}
          </p>

          {loading ? (
            <div className="text-center text-gray-400 py-10">กำลังโหลด...</div>
          ) : displayedGroups.length === 0 ? (
            <div className="text-center text-gray-400 py-10">
              {search ? 'ไม่พบกลุ่มที่ค้นหา' : 'ยังไม่ได้เข้าร่วมกลุ่มใดเลย'}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4">
                {displayedGroups.map((group) => (
                  <div
                    key={group._id}
                    className="bg-white rounded-2xl border border-gray-100 overflow-hidden cursor-pointer hover:border-[#7C6FF7] transition"
                    onClick={() => navigate(`/groups/${group._id}`)}
                  >
                    {/* Cover */}
                    <div className="relative w-full h-24 bg-[#EEEDFE]">
                      {group.coverPhoto?.url && (
                        <img src={group.coverPhoto.url} alt="cover" className="w-full h-full object-cover" />
                      )}
                      {/* Avatar */}
                      <div className="absolute -bottom-4 left-3 w-10 h-10 rounded-full bg-[#7C6FF7] border-2 border-white flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                        {group.avatar?.url ? (
                          <img src={group.avatar.url} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          group.name?.[0]?.toUpperCase() || 'G'
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="pt-6 px-3 pb-3">
                      <p className="text-sm font-semibold text-gray-800 mb-1 truncate">{group.name}</p>
                      <p className="text-xs text-gray-400 mb-2">
                        {group.privacy === 'public' ? 'สาธารณะ' : 'ส่วนตัว'} · {group.membersCount || 0} สมาชิก
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/groups/${group._id}`)
                        }}
                        className="w-full py-1.5 bg-[#EEEDFE] text-[#7C6FF7] text-xs font-semibold rounded-lg hover:bg-[#7C6FF7] hover:text-white transition cursor-pointer"
                      >
                        เข้าดูกลุ่ม
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More */}
              {!search && myGroups.length > myGroupsLimit && (
                <div className="text-center mt-4">
                  <button
                    onClick={() => setMyGroupsLimit((prev) => prev + 6)}
                    className="px-6 py-2 bg-white border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition cursor-pointer"
                  >
                    ดูเพิ่มเติม ({myGroups.length - myGroupsLimit} กลุ่ม)
                  </button>
                </div>
              )}
            </>
          )}
        </div>

      </div>

        {/* Create Group Modal */}
        {showCreate && (
        <div
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4"
            onClick={() => setShowCreate(false)}
        >
            <div
            className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            >
            <h3 className="text-base font-semibold text-gray-800 mb-4">สร้างกลุ่มใหม่</h3>

            <div className="flex flex-col gap-3">

                {/* Cover Photo */}
                <div>
                <label className="text-sm font-semibold text-gray-600 mb-1 block">รูปหน้าปก</label>
                <div className="relative w-full h-28 bg-[#EEEDFE] rounded-xl overflow-hidden">
                    {coverPreview && (
                    <img src={coverPreview} alt="cover" className="w-full h-full object-cover" />
                    )}
                    <label className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer hover:bg-black/30 transition">
                    <span className="text-white text-sm font-semibold">📷 เลือกรูปหน้าปก</span>
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                        const file = e.target.files[0]
                        if (file) {
                            setCoverFile(file)
                            setCoverPreview(URL.createObjectURL(file))
                        }
                        }}
                    />
                    </label>
                </div>
                </div>

                {/* Avatar */}
                <div>
                <label className="text-sm font-semibold text-gray-600 mb-1 block">รูปโปรไฟล์กลุ่ม</label>
                <div className="flex items-center gap-3">
                    <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-[#7C6FF7] flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                        {avatarPreview ? (
                        <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                        createForm.name?.[0]?.toUpperCase() || 'G'
                        )}
                    </div>
                    <label className="absolute bottom-0 right-0 w-6 h-6 bg-[#7C6FF7] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#6a5ee0] transition border-2 border-white">
                        <span className="text-white text-xs">✎</span>
                        <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files[0]
                            if (file) {
                            setAvatarFile(file)
                            setAvatarPreview(URL.createObjectURL(file))
                            }
                        }}
                        />
                    </label>
                    </div>
                    <p className="text-xs text-gray-400">กดที่รูปเพื่อเปลี่ยนรูปโปรไฟล์กลุ่ม</p>
                </div>
                </div>

                {/* ชื่อกลุ่ม */}
                <div>
                <label className="text-sm font-semibold text-gray-600 mb-1 block">ชื่อกลุ่ม</label>
                <input
                    type="text"
                    placeholder="ชื่อกลุ่ม"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    className="w-full bg-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7C6FF7] transition"
                />
                </div>

                {/* คำอธิบาย */}
                <div>
                <label className="text-sm font-semibold text-gray-600 mb-1 block">คำอธิบาย</label>
                <textarea
                    placeholder="คำอธิบายกลุ่ม..."
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    rows={3}
                    className="w-full bg-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7C6FF7] transition resize-none"
                />
                </div>

                {/* ความเป็นส่วนตัว */}
                <div>
                <label className="text-sm font-semibold text-gray-600 mb-1 block">ความเป็นส่วนตัว</label>
                <select
                    value={createForm.privacy}
                    onChange={(e) => setCreateForm({ ...createForm, privacy: e.target.value })}
                    className="w-full bg-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7C6FF7] transition cursor-pointer"
                >
                    <option value="public">สาธารณะ</option>
                    <option value="private">ส่วนตัว</option>
                </select>
                </div>

            </div>

            <div className="flex gap-3 mt-5">
                <button
                onClick={() => setShowCreate(false)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-200 transition cursor-pointer"
                >
                ยกเลิก
                </button>
                <button
                onClick={handleCreate}
                className="flex-1 py-2.5 bg-[#7C6FF7] text-white text-sm font-semibold rounded-xl hover:bg-[#6a5ee0] transition cursor-pointer"
                >
                สร้างกลุ่ม
                </button>
            </div>
            </div>
        </div>
        )}

    </Layout>
  )
}

export default GroupPage