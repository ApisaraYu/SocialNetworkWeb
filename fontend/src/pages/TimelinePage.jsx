import api from '../services/api'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/common/Layout'

const TimelinePage = () => {
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [posting, setPosting] = useState(false)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [openComments, setOpenComments] = useState({}) // เก็บว่าโพสต์ไหนเปิด comment อยู่
  const [comments, setComments] = useState({}) // เก็บ comment ของแต่ละโพสต์
  const [commentText, setCommentText] = useState({}) // เก็บข้อความที่กำลังพิมพ์

  const fetchPosts = async () => {
  setLoading(true)
  try {
    const res = await api.get('/posts/timeline')
    setPosts(res.data.data.posts)
  } catch (err) {
    console.error(err)
  } finally {
    setLoading(false)
  }
}

  useEffect(() => {
    fetchPosts()
  }, [])

  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    if (selected) {
      setFile(selected)
      setPreview(URL.createObjectURL(selected))
    }
  }

  const handlePost = async () => {
  if (!content && !file) return
  setPosting(true)
  try {
    const formData = new FormData()
    if (content) formData.append('content', content)
    if (file) formData.append('media', file)

    await api.post('/posts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

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

  const handleDelete = async (postId) => {
  try {
    await api.delete(`/posts/${postId}`)
    fetchPosts()
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

const user = JSON.parse(localStorage.getItem('user') || '{}')

  return (
    <Layout>
      <div className="flex flex-col gap-4">

        {/* Create Post */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div
              onClick={() => navigate('/profile')}
              className="w-10 h-10 rounded-full bg-[#7C6FF7] flex items-center justify-center text-white font-bold flex-shrink-0 cursor-pointer hover:opacity-80 transition overflow-hidden"
            >
              {user?.avatar?.url ? (
                <img src={user.avatar.url} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                user.username?.[0]?.toUpperCase() || 'U'
              )}
            </div>
            <input
              type="text"
              placeholder="คุณคิดอะไรอยู่..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm text-gray-600 outline-none focus:ring-2 focus:ring-[#7C6FF7] transition cursor-text"
            />
          </div>

          {/* Preview รูป */}
          {preview && (
            <div className="relative mb-3">
              <img
                src={preview}
                alt="preview"
                className="w-full max-h-60 object-cover rounded-xl"
              />
              <button
                onClick={() => { setFile(null); setPreview(null) }}
                className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs cursor-pointer hover:bg-black/70 transition"
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
              className="ml-auto px-5 py-2 bg-[#7C6FF7] text-white text-sm font-semibold rounded-xl hover:bg-[#6a5ee0] transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {posting ? 'กำลังโพสต์...' : 'โพสต์'}
            </button>
          </div>
        </div>

        {/* Posts */}
        {loading ? (
          <div className="text-center text-gray-400 py-10">กำลังโหลด...</div>
        ) : posts.length === 0 ? (
          <div className="text-center text-gray-400 py-10">ยังไม่มีโพสต์ในขณะนี้</div>
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
                  <p 
                    onClick={() => navigate(`/profile/${post.author?._id}`)}
                    className="text-sm font-semibold text-gray-800 cursor-pointer hover:underline">
                    {post.author?.username}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(post.createdAt).toLocaleDateString('th-TH', {
                      year: 'numeric', month: 'long', day: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
                {post.author?._id === user._id && (
                  <button
                    onClick={() => handleDelete(post._id)}
                    className="text-gray-400 hover:text-red-500 transition text-sm cursor-pointer"
                  >
                    ลบ
                  </button>
                )}
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
                      {user?.avatar?.url ? (
                        <img src={user.avatar.url} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        user.username?.[0]?.toUpperCase() || 'U'
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
    </Layout>
  )
}

export default TimelinePage