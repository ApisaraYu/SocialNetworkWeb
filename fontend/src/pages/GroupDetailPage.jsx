import { useState, useEffect } from 'react'
import api from '../services/api'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/common/Layout'

const GroupDetailPage = () => {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const [group, setGroup] = useState(null)
  const [isMemberFromApi, setIsMemberFromApi] = useState(false)
  const [pendingRequests, setPendingRequests] = useState([])
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [joinRequested, setJoinRequested] = useState(false)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [content, setContent] = useState('')
  const [openComments, setOpenComments] = useState({})
  const [comments, setComments] = useState({})
  const [commentText, setCommentText] = useState({})
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', description: '', privacy: 'public' })
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const token = localStorage.getItem('accessToken')
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

  // ดึงข้อมูลกลุ่ม
  const fetchGroup = async () => {
  try {
    const res = await api.get(`/api/groups/${groupId}`)
    setGroup(res.data.data)
  } catch (err) {
    console.error(err)
  }
}

const fetchPosts = async () => {
  try {
    const res = await api.get(`/api/groups/${groupId}/posts`)
    setPosts(res.data.data.posts || [])
    setIsMemberFromApi(res.data.data.isMember)
  } catch (err) {
    console.error(err)
  } finally {
    setLoading(false)
  }
}

const fetchPendingRequests = async () => {
  try {
    const res = await api.get(`/api/groups/${groupId}`)
    setPendingRequests(res.data.data.joinRequests || [])
  } catch (err) {
    console.error(err)
  }
}

  const isMember = group?.members?.some((m) => m.user?._id === currentUser._id)
  const isAdmin = group?.members?.some((m) => m.user?._id === currentUser._id && m.role === 'admin')
  const isCreator = group?.creator?._id === currentUser._id

  useEffect(() => {
    fetchGroup()
    fetchPosts()
  }, [groupId])

  useEffect(() => {
  if (isAdmin) {
        fetchPendingRequests()
    }
  }, [isAdmin])

  

  // เข้าร่วมกลุ่ม
  const handleJoin = async () => {
  try {
    await api.post(`/api/groups/${groupId}/join`)
    if (group.privacy === 'private') {
      setJoinRequested(true)
    } else {
      fetchGroup()
      fetchPosts()
    }
  } catch (err) {
    console.error(err)
  }
}

const handleApprove = async (userId, action) => {
  try {
    await api.put(`/api/groups/${groupId}/join-request`, { userId, action })
    fetchGroup()
    fetchPendingRequests()
  } catch (err) {
    console.error(err)
  }
}

const handleLeave = async () => {
  try {
    await api.delete(`/api/groups/${groupId}/leave`)
    setShowLeaveModal(false)
    navigate('/groups')
  } catch (err) {
    console.error(err)
  }
}

 const handleDelete = async () => {
  try {
    await api.delete(`/api/groups/${groupId}`)
    setShowDeleteModal(false)
    navigate('/groups')
  } catch (err) {
    console.error(err)
  }
}

const handleEdit = async () => {
  if (!editForm.name) return
  try {
    await api.put(`/api/groups/${groupId}`, editForm)
    setShowEditModal(false)
    fetchGroup()
  } catch (err) {
    console.error(err)
  }
}

const handleAvatarChange = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  try {
    const formData = new FormData()
    formData.append('avatar', file)
    await api.put(`/api/groups/${groupId}/avatar`, formData)
    fetchGroup()
  } catch (err) {
    console.error(err)
  }
}

const handleCoverChange = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  try {
    const formData = new FormData()
    formData.append('coverPhoto', file)
    await api.put(`/api/groups/${groupId}/cover`, formData)
    fetchGroup()
  } catch (err) {
    console.error(err)
  }
}

  // สร้างโพสต์
  const handlePost = async () => {
  if (!content && !file) return
  setPosting(true)
  try {
    const formData = new FormData()
    if (content) formData.append('content', content)
    if (file) formData.append('media', file)
    await api.post(`/api/groups/${groupId}/posts`, formData)
    setContent('')
    setFile(null)
    setPreview(null)
    fetchPosts()
  } catch (err) {
    console.error(err)
  } finally {
    setPosting(false)
  }
}

const handleLike = async (postId) => {
  try {
    const res = await api.post(`/api/likes/GroupPost/${postId}`)
    setPosts((prev) =>
      prev.map((p) =>
        p._id === postId
          ? {
              ...p,
              isLiked: res.data.data.liked,
              likesCount: res.data.data.liked
                ? (p.likesCount || 0) + 1
                : Math.max(0, (p.likesCount || 0) - 1),
            }
          : p
      )
    )
  } catch (err) {
    console.error(err)
  }
}

const fetchComments = async (postId) => {
  try {
    const res = await api.get(`/api/groups/${groupId}/posts/${postId}/comments`)
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
    await api.post(`/api/groups/${groupId}/posts/${postId}/comments`, { content: text })
    setCommentText((prev) => ({ ...prev, [postId]: '' }))
    fetchComments(postId)
    setPosts((prev) =>
      prev.map((p) =>
        p._id === postId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p
      )
    )
  } catch (err) {
    console.error(err)
  }
}

  // ลบโพสต์
 const handleDeletePost = async (postId) => {
  try {
    await api.delete(`/api/groups/${groupId}/posts/${postId}`)
    fetchPosts()
  } catch (err) {
    console.error(err)
  }
}

  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    if (selected) {
      setFile(selected)
      setPreview(URL.createObjectURL(selected))
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="text-center text-gray-400 py-20">กำลังโหลด...</div>
      </Layout>
    )
  }

  if (!group) {
    return (
      <Layout>
        <div className="text-center text-gray-400 py-20">ไม่พบกลุ่ม</div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="flex flex-col gap-4">

        {/* Group Header */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

          {/* Cover */}
            <div className="w-full h-44 bg-gradient-to-r from-[#7C6FF7] to-[#a89cf7] relative">
            {group.coverPhoto?.url && (
                <img src={group.coverPhoto.url} alt="cover" className="w-full h-full object-cover" />
            )}
            {/* ปุ่มเปลี่ยนรูปหน้าปก เฉพาะ creator */}
            {isCreator && (
                <label className="absolute bottom-3 right-3 bg-black/40 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-black/60 transition cursor-pointer">
                เปลี่ยนรูปหน้าปก
                <input type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
                </label>
            )}
            {/* Avatar */}
            <div className="absolute -bottom-7 left-5">
                <div className="relative">
                <div className="w-16 h-16 rounded-full bg-[#7C6FF7] border-4 border-white flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                    {group.avatar?.url ? (
                    <img src={group.avatar.url} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                    group.name?.[0]?.toUpperCase() || 'G'
                    )}
                </div>
                {/* ปุ่มเปลี่ยน avatar เฉพาะ creator */}
                {isCreator && (
                    <label className="absolute bottom-0 right-0 w-6 h-6 bg-[#7C6FF7] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#6a5ee0] transition border-2 border-white">
                    <span className="text-white text-xs">✎</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    </label>
                )}
                </div>
            </div>
            </div>

          {/* Info */}
          <div className="px-5 pt-10 pb-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">{group.name}</h2>
            <p className="text-sm text-gray-400 mb-1">
              {group.privacy === 'public' ? 'สาธารณะ' : 'ส่วนตัว'} · {group.membersCount} สมาชิก · {group.postsCount} โพสต์
            </p>
            {group.description && (
              <p className="text-sm text-gray-500 mb-3">{group.description}</p>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
            {isMember ? (
                <>
                {!isCreator && (
                    <button
                    onClick={() => setShowLeaveModal(true)}
                    className="px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-xl hover:bg-red-600 transition cursor-pointer"
                    >
                    ออกจากกลุ่ม
                    </button>
                )}
                {isCreator && (
                    <>
                    {/* ปุ่มอนุมัติสมาชิก เฉพาะกลุ่ม private */}
                    {group.privacy === 'private' && pendingRequests.length > 0 && (
                        <button
                        onClick={() => setShowApproveModal(true)}
                        className="relative px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600 transition cursor-pointer"
                        >
                        คำขอเข้าร่วม
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                            {pendingRequests.length}
                        </span>
                        </button>
                    )}
                    <button
                        onClick={() => {
                        setEditForm({
                            name: group.name,
                            description: group.description || '',
                            privacy: group.privacy,
                        })
                        setShowEditModal(true)
                        }}
                        className="px-4 py-2 bg-[#7C6FF7] text-white text-sm font-semibold rounded-xl hover:bg-[#6a5ee0] transition cursor-pointer"
                    >
                        แก้ไขกลุ่ม
                    </button>
                    <button
                        onClick={() => setShowDeleteModal(true)}
                        className="px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-xl hover:bg-red-600 transition cursor-pointer"
                    >
                        ลบกลุ่ม
                    </button>
                    </>
                )}
                </>
            ) : joinRequested ? (
                <button
                disabled
                className="px-4 py-2 bg-gray-100 text-gray-400 text-sm font-semibold rounded-xl cursor-not-allowed"
                >
                รอ admin อนุมัติ...
                </button>
            ) : (
                <button
                onClick={handleJoin}
                className="px-4 py-2 bg-[#7C6FF7] text-white text-sm font-semibold rounded-xl hover:bg-[#6a5ee0] transition cursor-pointer"
                >
                {group.privacy === 'private' ? 'ขอเข้าร่วมกลุ่ม' : 'เข้าร่วมกลุ่ม'}
                </button>
            )}
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="flex gap-4 items-start">

          {/* Posts */}
          <div className="flex-1 flex flex-col gap-4">

            {/* Create Post */}
            {isMember && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-[#7C6FF7] flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden">
                    {currentUser?.avatar?.url ? (
                    <img src={currentUser.avatar.url} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                    currentUser.username?.[0]?.toUpperCase() || 'U'
                    )}
                </div>
                <input
                    type="text"
                    placeholder="เขียนโพสต์ในกลุ่ม..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm text-gray-600 outline-none focus:ring-2 focus:ring-[#7C6FF7] transition"
                />
                </div>

                {preview && (
                <div className="relative mb-3">
                    <img src={preview} alt="preview" className="w-full max-h-60 object-cover rounded-xl" />
                    <button
                    onClick={() => { setFile(null); setPreview(null) }}
                    className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs cursor-pointer"
                    >
                    ✕
                    </button>
                </div>
                )}

                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 text-sm text-gray-500 cursor-pointer hover:bg-gray-200 transition">
                    📷 รูปภาพ/วิดีโอ
                    <input type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
                </label>
                <button
                    onClick={handlePost}
                    disabled={posting || (!content && !file)}
                    className="ml-auto px-5 py-2 bg-[#7C6FF7] text-white text-sm font-semibold rounded-xl hover:bg-[#6a5ee0] transition disabled:opacity-50 cursor-pointer"
                >
                    {posting ? 'กำลังโพสต์...' : 'โพสต์'}
                </button>
                </div>
            </div>
            )}

            {/* Posts List */}
            {!isMemberFromApi && group.privacy === 'private' ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                <p className="text-gray-400 text-sm mb-2">🔒 กลุ่มนี้เป็นแบบส่วนตัว</p>
                <p className="text-gray-400 text-xs">เข้าร่วมกลุ่มเพื่อดูโพสต์ทั้งหมด</p>
            </div>
            ) : posts.length === 0 ? (
            <div className="text-center text-gray-400 py-10">ยังไม่มีโพสต์ในกลุ่ม</div>
            ) : (
              posts.map((post) => (
                <div key={post._id} className="bg-white rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      onClick={() => navigate(`/profile/${post.author?._id}`)}
                      className="w-9 h-9 rounded-full bg-[#7C6FF7] flex items-center justify-center text-white font-bold flex-shrink-0 cursor-pointer hover:opacity-80 transition overflow-hidden"
                    >
                      {post.author?.avatar?.url ? (
                        <img src={post.author.avatar.url} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        post.author?.username?.[0]?.toUpperCase() || 'U'
                      )}
                    </div>
                    <div className="flex-1">
                      <p
                        onClick={() => navigate(`/profile/${post.author?._id}`)}
                        className="text-sm font-semibold text-gray-800 cursor-pointer hover:underline"
                      >
                        {post.author?.username}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(post.createdAt).toLocaleDateString('th-TH', {
                          year: 'numeric', month: 'long', day: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                    {(post.author?._id === currentUser._id || isAdmin) && (
                      <button
                        onClick={() => handleDeletePost(post._id)}
                        className="text-gray-400 hover:text-red-500 transition text-sm cursor-pointer"
                      >
                        ลบ
                      </button>
                    )}
                  </div>

                  {post.content && (
                    <p className="text-sm text-gray-700 leading-relaxed mb-3">{post.content}</p>
                  )}

                  {post.media?.length > 0 && (
                    post.media[0].type === 'video' ? (
                      <video src={post.media[0].url} controls className="w-full max-h-80 rounded-xl mb-3" />
                    ) : (
                      <img src={post.media[0].url} alt="post" className="w-full max-h-80 object-cover rounded-xl mb-3 cursor-pointer" />
                    )
                  )}

                  {/* Post stats */}
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
                        {isMember && (
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
                        )}
                    </div>
                    )}
                </div>
              ))
            )}
          </div>

          {/* Sidebar */}
          <div className="w-64 flex-shrink-0 flex flex-col gap-4">

            {/* Members */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">
                สมาชิก ({group.membersCount})
              </h3>
              <div className="flex flex-col gap-2">
                {group.members?.slice(0, 5).map((m) => (
                  <div
                    key={m.user?._id}
                    onClick={() => navigate(`/profile/${m.user?._id}`)}
                    className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#7C6FF7] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
                      {m.user?.avatar?.url ? (
                        <img src={m.user.avatar.url} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        m.user?.username?.[0]?.toUpperCase() || 'U'
                      )}
                    </div>
                    <p className="text-sm text-gray-700 flex-1">{m.user?.username}</p>
                    {m.role === 'admin' && (
                      <span className="text-xs text-[#7C6FF7] bg-[#EEEDFE] px-2 py-0.5 rounded-full">admin</span>
                    )}
                  </div>
                ))}
              </div>
              {group.members?.length > 5 && (
                <button
                  onClick={() => setShowMembers(true)}
                  className="w-full mt-3 py-2 bg-gray-100 text-gray-600 text-xs font-semibold rounded-xl hover:bg-gray-200 transition cursor-pointer"
                >
                  ดูสมาชิกทั้งหมด
                </button>
              )}
            </div>

            {/* About */}
            {group.description && (
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-2">เกี่ยวกับกลุ่ม</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{group.description}</p>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Leave Group Modal */}
      {showLeaveModal && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4"
          onClick={() => setShowLeaveModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-gray-800 mb-2">ออกจากกลุ่ม?</h3>
            <p className="text-sm text-gray-500 mb-5 leading-relaxed">
              แน่ใจนะว่าคุณต้องการออกจากกลุ่ม "{group.name}" คุณจะไม่สามารถเห็นโพสต์ในกลุ่มได้อีก
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowLeaveModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-200 transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleLeave}
                className="px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-xl hover:bg-red-600 transition cursor-pointer"
              >
                ออกจากกลุ่ม
              </button>
            </div>
          </div>
        </div>
      )}

        {/* Approve Modal */}
        {showApproveModal && (
        <div
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4"
            onClick={() => setShowApproveModal(false)}
        >
            <div
            className="bg-white rounded-2xl w-full max-w-md max-h-[70vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h3 className="text-base font-semibold text-gray-800">
                คำขอเข้าร่วมกลุ่ม ({pendingRequests.length})
                </h3>
                <button
                onClick={() => setShowApproveModal(false)}
                className="text-gray-400 hover:text-gray-600 transition cursor-pointer text-lg"
                >
                ✕
                </button>
            </div>

            <div className="overflow-y-auto max-h-[55vh]">
                {pendingRequests.length === 0 ? (
                <p className="text-center text-gray-400 py-10">ไม่มีคำขอเข้าร่วม</p>
                ) : (
                pendingRequests.map((req) => (
                    <div key={req.user?._id} className="flex items-center gap-3 px-5 py-3 border-b border-gray-50">
                    <div
                        onClick={() => navigate(`/profile/${req.user?._id}`)}
                        className="w-10 h-10 rounded-full bg-[#7C6FF7] flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden cursor-pointer"
                    >
                        {req.user?.avatar?.url ? (
                        <img src={req.user.avatar.url} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                        req.user?.username?.[0]?.toUpperCase() || 'U'
                        )}
                    </div>
                    <p
                        onClick={() => navigate(`/profile/${req.user?._id}`)}
                        className="text-sm font-semibold text-gray-800 flex-1 cursor-pointer hover:underline"
                    >
                        {req.user?.username}
                    </p>
                    <div className="flex gap-2">
                        <button
                        onClick={() => handleApprove(req.user?._id, 'accept')}
                        className="px-3 py-1.5 bg-[#7C6FF7] text-white text-xs font-semibold rounded-lg hover:bg-[#6a5ee0] transition cursor-pointer"
                        >
                        อนุมัติ
                        </button>
                        <button
                        onClick={() => handleApprove(req.user?._id, 'reject')}
                        className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-lg hover:bg-red-50 hover:text-red-500 transition cursor-pointer"
                        >
                        ปฏิเสธ
                        </button>
                    </div>
                    </div>
                ))
                )}
            </div>
            </div>
        </div>
        )}

      {/* Delete Group Modal */}
        {showDeleteModal && (
        <div
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4"
            onClick={() => setShowDeleteModal(false)}
        >
            <div
            className="bg-white rounded-2xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
            >
            <h3 className="text-base font-semibold text-gray-800 mb-2">ลบกลุ่ม?</h3>
            <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                แน่ใจนะว่าคุณต้องการลบกลุ่ม "{group.name}" การกระทำนี้ไม่สามารถย้อนกลับได้ และโพสต์ทั้งหมดในกลุ่มจะถูกลบด้วย
            </p>
            <div className="flex gap-3 justify-end">
                <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-200 transition cursor-pointer"
                >
                ยกเลิก
                </button>
                <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-xl hover:bg-red-600 transition cursor-pointer"
                >
                ลบกลุ่ม
                </button>
            </div>
            </div>
        </div>
        )}

        {/* Edit Group Modal */}
        {showEditModal && (
        <div
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4"
            onClick={() => setShowEditModal(false)}
        >
            <div
            className="bg-white rounded-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
            >
            <h3 className="text-base font-semibold text-gray-800 mb-4">แก้ไขกลุ่ม</h3>

            <div className="flex flex-col gap-3">
                <div>
                <label className="text-sm font-semibold text-gray-600 mb-1 block">ชื่อกลุ่ม</label>
                <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7C6FF7] transition"
                />
                </div>
                <div>
                <label className="text-sm font-semibold text-gray-600 mb-1 block">คำอธิบาย</label>
                <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={3}
                    placeholder="คำอธิบายกลุ่ม..."
                    className="w-full bg-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7C6FF7] transition resize-none"
                />
                </div>
                <div>
                <label className="text-sm font-semibold text-gray-600 mb-1 block">ความเป็นส่วนตัว</label>
                <select
                    value={editForm.privacy}
                    onChange={(e) => setEditForm({ ...editForm, privacy: e.target.value })}
                    className="w-full bg-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7C6FF7] transition cursor-pointer"
                >
                    <option value="public">สาธารณะ</option>
                    <option value="private">ส่วนตัว</option>
                </select>
                </div>
            </div>

            <div className="flex gap-3 mt-5">
                <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-200 transition cursor-pointer"
                >
                ยกเลิก
                </button>
                <button
                onClick={handleEdit}
                className="flex-1 py-2.5 bg-[#7C6FF7] text-white text-sm font-semibold rounded-xl hover:bg-[#6a5ee0] transition cursor-pointer"
                >
                บันทึก
                </button>
            </div>
            </div>
        </div>
        )}

      {/* Members Modal */}
      {showMembers && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4"
          onClick={() => setShowMembers(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md max-h-[70vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-800">สมาชิก ({group.membersCount})</h3>
              <button
                onClick={() => setShowMembers(false)}
                className="text-gray-400 hover:text-gray-600 transition cursor-pointer text-lg"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto max-h-[55vh]">
              {group.members?.map((m) => (
                <div
                  key={m.user?._id}
                  onClick={() => {
                    navigate(`/profile/${m.user?._id}`)
                    setShowMembers(false)
                  }}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 cursor-pointer transition"
                >
                  <div className="w-10 h-10 rounded-full bg-[#7C6FF7] flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden">
                    {m.user?.avatar?.url ? (
                      <img src={m.user.avatar.url} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      m.user?.username?.[0]?.toUpperCase() || 'U'
                    )}
                  </div>
                  <p className="text-sm font-semibold text-gray-800 flex-1">{m.user?.username}</p>
                  {m.role === 'admin' && (
                    <span className="text-xs text-[#7C6FF7] bg-[#EEEDFE] px-2 py-0.5 rounded-full">admin</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </Layout>
  )
}

export default GroupDetailPage