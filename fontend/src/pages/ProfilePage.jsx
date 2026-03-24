import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/common/Layout'
import api from '../services/api'

const ProfilePage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [friends, setFriends] = useState([])
  const [loading, setLoading] = useState(true)
  const [friendStatus, setFriendStatus] = useState('none')
  const [showFriends, setShowFriends] = useState(false)
  const [openComments, setOpenComments] = useState({}) // เก็บว่าโพสต์ไหนเปิด comment อยู่
  const [comments, setComments] = useState({}) // เก็บ comment ของแต่ละโพสต์
  const [commentText, setCommentText] = useState({}) // เก็บข้อความที่กำลังพิมพ์

  const token = localStorage.getItem('accessToken')
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

  // ถ้าไม่มี id ใน URL ให้ใช้ id ของตัวเอง
  const userId = id || currentUser._id
  const isMe = userId === currentUser._id

  // ดึงข้อมูล profile
  const fetchProfile = async () => {
  try {
    const res = await api.get(`/users/${userId}`)
    setProfile(res.data.data)
  } catch (err) {
    console.error(err)
  }
}

  // ดึงโพสต์ของ user
  const fetchPosts = async () => {
  try {
    const res = await api.get(`/posts/user/${userId}`)
    setPosts(res.data.data.posts)
  } catch (err) {
    console.error(err)
  } finally {
    setLoading(false)
  }
}

  // ดึงรายชื่อเพื่อน
  const fetchFriends = async () => {
  try {
    const res = await api.get(`/users/${userId}/friends`)
    setFriends(res.data.data || [])
  } catch (err) {
    console.error(err)
  }
}

  // เช็คสถานะเพื่อน
  const fetchFriendStatus = async () => {
  try {
    const res = await api.get(`/users/${userId}/friend-status`)
    setFriendStatus(res.data.data.status)
  } catch (err) {
    console.error(err)
  }
}

  useEffect(() => {
    fetchProfile()
    fetchPosts()
    fetchFriends()
    if (!isMe) fetchFriendStatus() // เช็คสถานะเพื่อนถ้าไม่ใช่ตัวเอง
  }, [userId])

  // ส่งคำขอเพื่อน
  const handleFriendRequest = async () => {
  try {
    await api.post(`/users/${userId}/friend-request`)
    setFriendStatus('pending')
  } catch (err) {
    console.error(err)
  }
}

  // ลบเพื่อน
  const handleRemoveFriend = async () => {
  try {
    await api.delete(`/users/${userId}/friend`)
    setFriendStatus('none')
    fetchFriends()
  } catch (err) {
    console.error(err)
  }
}

  const handleLike = async (postId) => {
  try {
    await api.post(`/likes/Post/${postId}`)
    fetchPosts()
  } catch (err) {
    console.error(err)
  }
}

const fetchComments = async (postId) => {
  try {
    const res = await api.get(`/posts/${postId}/comments`)
    setComments((prev) => ({ ...prev, [postId]: res.data.data.comments }))
  } catch (err) {
    console.error(err)
  }
}

const toggleComments = (postId) => {
  const isOpen = openComments[postId]
  setOpenComments((prev) => ({ ...prev, [postId]: !isOpen }))
  if (!isOpen) fetchComments(postId)
}

const handleComment = async (postId) => {
  const text = commentText[postId]?.trim()
  if (!text) return
  try {
    await api.post(`/posts/${postId}/comments`, { content: text })
    setCommentText((prev) => ({ ...prev, [postId]: '' }))
    fetchComments(postId)
    fetchPosts()
  } catch (err) {
    console.error(err)
  }
}

const handleChat = async () => {
  try {
    await api.post('/chats', { userId })
    navigate('/chat')
  } catch (err) {
    console.error(err)
  }
}

  if (loading) {
    return (
      <Layout>
        <div className="text-center text-gray-400 py-20">กำลังโหลด...</div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="flex flex-col gap-4">

        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

          {/* Cover Photo */}
          <div className="w-full h-44 bg-gradient-to-r from-[#7C6FF7] to-[#a89cf7] relative">
            {profile?.coverPhoto?.url && (
              <img src={profile.coverPhoto.url} alt="cover" className="w-full h-full object-cover" />
            )}
            {isMe && (
              <button
                onClick={() => navigate('/edit-profile')}
                className="absolute bottom-3 right-3 bg-black/40 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-black/60 transition cursor-pointer"
              >
                แก้ไขรูปหน้าปก
              </button>
            )}
          </div>

          {/* Profile Info */}
          <div className="px-5 pb-5">

            {/* Avatar */}
            <div className="relative inline-block -mt-10 mb-3">
              <div className="w-20 h-20 rounded-full bg-[#7C6FF7] border-4 border-white flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                {profile?.avatar?.url ? (
                  <img src={profile.avatar.url} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  profile?.username?.[0]?.toUpperCase() || 'U'
                )}
              </div>
            </div>

            {/* Name & Bio */}
            <h2 className="text-lg font-semibold text-gray-800 mb-1">{profile?.username}</h2>
            {profile?.bio && (
              <p className="text-sm text-gray-500 mb-3 leading-relaxed">{profile.bio}</p>
            )}

            {/* Stats */}
            <div className="flex gap-5 mb-4">
              <div className="text-center">
                <p className="text-base font-semibold text-gray-800">{posts.length}</p>
                <p className="text-xs text-gray-400">โพสต์</p>
              </div>
              {/* กดเพื่อเปิด modal รายชื่อเพื่อน */}
              <div
                onClick={() => setShowFriends(true)}
                className="text-center cursor-pointer hover:opacity-70 transition"
              >
                <p className="text-base font-semibold text-gray-800">{friends.length}</p>
                <p className="text-xs text-gray-400">เพื่อน</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {isMe ? (
                <button
                  onClick={() => navigate('/edit-profile')}
                  className="flex-1 py-2 bg-[#7C6FF7] text-white text-sm font-semibold rounded-xl hover:bg-[#6a5ee0] transition cursor-pointer"
                >
                  แก้ไขโปรไฟล์
                </button>
              ) : (
                <>
                  {/* ปุ่มเพิ่มเพื่อน/ลบเพื่อน */}
                  {friendStatus === 'friends' ? (
                    <button
                      onClick={handleRemoveFriend}
                      className="flex-1 py-2 bg-gray-100 text-gray-600 text-sm font-semibold rounded-xl hover:bg-red-50 hover:text-red-500 transition cursor-pointer"
                    >
                      เลิกเป็นเพื่อน
                    </button>
                  ) : friendStatus === 'pending' ? (
                    <button
                      disabled
                      className="flex-1 py-2 bg-gray-100 text-gray-400 text-sm font-semibold rounded-xl cursor-not-allowed"
                    >
                      ส่งคำขอแล้ว
                    </button>
                  ) : (
                    <button
                      onClick={handleFriendRequest}
                      className="flex-1 py-2 bg-[#7C6FF7] text-white text-sm font-semibold rounded-xl hover:bg-[#6a5ee0] transition cursor-pointer"
                    >
                      เพิ่มเพื่อน
                    </button>
                  )}
                  {/* ปุ่มแชท */}
                  <button
                    onClick={handleChat}
                    className="flex-1 py-2 bg-gray-100 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-200 transition cursor-pointer"
                  >
                    แชท
                  </button>
                </>
              )}
            </div>

          </div>
        </div>

        {/* Posts */}
        <h3 className="text-sm font-semibold text-gray-600">โพสต์ทั้งหมด</h3>

        {posts.length === 0 ? (
          <div className="text-center text-gray-400 py-10">ยังไม่มีโพสต์</div>
        ) : (
          posts.map((post) => (
            <div key={post._id} className="bg-white rounded-2xl border border-gray-100 p-4">

              {/* Post Header */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  onClick={() => navigate(`/profile/${post.author?._id}`)}
                  className="w-10 h-10 rounded-full bg-[#7C6FF7] flex items-center justify-center text-white font-bold flex-shrink-0 cursor-pointer hover:opacity-80 transition overflow-hidden"
                >
                  {post.author?.avatar?.url ? (
                    <img src={post.author.avatar.url} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    post.author?.username?.[0]?.toUpperCase() || 'U'
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">{profile?.username}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(post.createdAt).toLocaleDateString('th-TH', {
                      year: 'numeric', month: 'long', day: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              {/* Post Content */}
              {post.content && (
                <p className="text-sm text-gray-700 leading-relaxed mb-3">{post.content}</p>
              )}
              
              {/* Post Media */}
              {post.media?.length > 0 && (
                post.media[0].type === 'video' ? (
                  <video
                    src={post.media[0].url}
                    controls
                    className="w-full max-h-80 rounded-xl mb-3 cursor-pointer"
                  />
                ) : (
                  <img
                    src={post.media[0].url}
                    alt="post"
                    className="w-full max-h-80 object-cover rounded-xl mb-3 cursor-pointer hover:opacity-95 transition"
                  />
                )
              )}

              {/* Post Stats */}
              <div className="flex gap-4 pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleLike(post._id)}
                  className={`flex items-center gap-1 text-sm transition cursor-pointer
                    ${post.isLiked
                      ? 'text-[#7C6FF7] font-semibold'
                      : 'text-gray-500 hover:text-[#7C6FF7]'
                    }`}
                >
                  👍 {post.likesCount || 0} ถูกใจ
                </button>
                <button
                  onClick={() => toggleComments(post._id)}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#7C6FF7] transition cursor-pointer">
                  💬 {post.commentsCount || 0} ความคิดเห็น
                </button>
              </div>

              {/* Comment Section */}
              {openComments[post._id] && (
                <div className="mt-3 pt-3 border-t border-gray-100">

                  {/* Comment List */}
                  <div className="flex flex-col gap-3 mb-3">
                    {comments[post._id]?.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center">ยังไม่มีความคิดเห็น</p>
                    ) : (
                      comments[post._id]?.map((comment) => (
                        <div key={comment._id} className="flex items-start gap-2">
                          <div
                            onClick={() => navigate(`/profile/${comment.author?._id}`)}
                            className="w-8 h-8 rounded-full bg-[#7C6FF7] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 cursor-pointer hover:opacity-80 transition overflow-hidden"
                          >
                            {comment.author?.avatar?.url ? (
                              <img src={comment.author.avatar.url} alt="avatar" className="w-full h-full object-cover" />
                            ) : (
                              comment.author?.username?.[0]?.toUpperCase() || 'U'
                            )}
                          </div>
                          <div className="flex-1 bg-gray-100 rounded-2xl px-3 py-2">
                            <p
                              onClick={() => navigate(`/profile/${comment.author?._id}`)}
                              className="text-xs font-semibold text-gray-800 cursor-pointer hover:underline mb-0.5"
                            >
                              {comment.author?.username}
                            </p>
                            <p className="text-sm text-gray-700">{comment.content}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Comment Input */}
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#7C6FF7] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
                      {currentUser?.avatar?.url ? (
                        <img src={currentUser.avatar.url} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        currentUser.username?.[0]?.toUpperCase() || 'U'
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="เขียนความคิดเห็น..."
                      value={commentText[post._id] || ''}
                      onChange={(e) => setCommentText((prev) => ({ ...prev, [post._id]: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleComment(post._id)}
                      className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm text-gray-600 outline-none focus:ring-2 focus:ring-[#7C6FF7] transition"
                    />
                    <button
                      onClick={() => handleComment(post._id)}
                      className="px-4 py-2 bg-[#7C6FF7] text-white text-sm font-semibold rounded-full hover:bg-[#6a5ee0] transition cursor-pointer"
                    >
                      ส่ง
                    </button>
                  </div>

                </div>
              )}
            </div>
          ))
        )}

      </div>

      {/* Friends Modal */}
      {showFriends && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4"
          onClick={() => setShowFriends(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md max-h-[70vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-800">
                เพื่อน ({friends.length})
              </h3>
              <button
                onClick={() => setShowFriends(false)}
                className="text-gray-400 hover:text-gray-600 transition cursor-pointer text-lg"
              >
                ✕
              </button>
            </div>

            {/* Friends List */}
            <div className="overflow-y-auto max-h-[55vh]">
              {friends.length === 0 ? (
                <p className="text-center text-gray-400 py-10">ยังไม่มีเพื่อน</p>
              ) : (
                friends.map((friend) => (
                  <div
                    key={friend._id}
                    onClick={() => {
                      navigate(`/profile/${friend._id}`)
                      setShowFriends(false)
                    }}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 cursor-pointer transition"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#7C6FF7] flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden">
                      {friend.avatar?.url ? (
                        <img src={friend.avatar.url} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        friend.username?.[0]?.toUpperCase() || 'U'
                      )}
                    </div>
                    <p className="text-sm font-semibold text-gray-800">{friend.username}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </Layout>
  )
}

export default ProfilePage