import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/common/Layout'

const FriendRequestsPage = () => {
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const token = localStorage.getItem('accessToken')

  const fetchRequests = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/users/friend-requests', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) setRequests(data.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const handleRespond = async (userId, action) => {
    try {
      const res = await fetch('http://localhost:4000/api/users/friend-request/respond', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fromUserId: userId, action }),
      })
      if (res.ok) fetchRequests()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <Layout>
      <div className="flex flex-col gap-4">

        <h2 className="text-lg font-semibold text-gray-800">คำขอเป็นเพื่อน</h2>

        {loading ? (
          <div className="text-center text-gray-400 py-10">กำลังโหลด...</div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
            ไม่มีคำขอเป็นเพื่อนในขณะนี้
          </div>
        ) : (
          requests.map((req) => (
            <div key={req.from?._id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">

              {/* Avatar */}
              <div
                onClick={() => navigate(`/profile/${req.from?._id}`)}
                className="w-12 h-12 rounded-full bg-[#7C6FF7] flex items-center justify-center text-white font-bold flex-shrink-0 cursor-pointer hover:opacity-80 transition"
              >
                {req.from?.avatar?.url ? (
                  <img src={req.from.avatar.url} alt="avatar" className="w-full h-full object-cover rounded-full" />
                ) : (
                  req.from?.username?.[0]?.toUpperCase() || 'U'
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <p
                  onClick={() => navigate(`/profile/${req.from?._id}`)}
                  className="text-sm font-semibold text-gray-800 cursor-pointer hover:underline"
                >
                  {req.from?.username}
                </p>
                <p className="text-xs text-gray-400">ส่งคำขอเป็นเพื่อน</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleRespond(req.from?._id, 'accept')}
                  className="px-4 py-2 bg-[#7C6FF7] text-white text-sm font-semibold rounded-xl hover:bg-[#6a5ee0] transition cursor-pointer"
                >
                  ตอบรับ
                </button>
                <button
                  onClick={() => handleRespond(req.from?._id, 'reject')}
                  className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-semibold rounded-xl hover:bg-red-50 hover:text-red-500 transition cursor-pointer"
                >
                  ปฏิเสธ
                </button>
              </div>

            </div>
          ))
        )}

      </div>
    </Layout>
  )
}

export default FriendRequestsPage