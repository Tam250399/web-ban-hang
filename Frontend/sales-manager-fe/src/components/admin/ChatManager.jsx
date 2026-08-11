import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { chatService } from '../../services/chatService'
import { uploadImage } from '../../services/uploadService'

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

function formatDay(iso) {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}

// Danh sách hội thoại, hội thoại đang mở, và kết nối SignalR được quản lý ở
// AdminDashboard (để chuông thông báo trên header hoạt động dù đang ở tab nào),
// ChatManager chỉ nhận qua props.
function ChatManager({ conversations, setConversations, activeId, setActiveId }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [pendingImage, setPendingImage] = useState(null) // { previewUrl, url, uploading }
  const [dragOver, setDragOver] = useState(false)
  const bodyRef = useRef(null)
  const fileInputRef = useRef(null)
  const activeIdRef = useRef(activeId)
  useEffect(() => { activeIdRef.current = activeId }, [activeId])

  useEffect(() => {
    const handleReceive = (msg) => {
      if (msg.conversationId === activeIdRef.current) {
        setMessages(prev => [...prev, msg])
      }
    }
    chatService.on('ReceiveMessage', handleReceive)

    // Component bị unmount/mount lại mỗi khi chuyển tab ra vào Chat; nếu đã có
    // sẵn hội thoại đang mở (activeId đến từ AdminDashboard) thì nạp lại tin nhắn.
    if (activeIdRef.current) {
      setLoadingMsgs(true)
      chatService.getConversationMessages(activeIdRef.current)
        .then(setMessages)
        .catch(() => {})
        .finally(() => setLoadingMsgs(false))
      chatService.joinConversation(activeIdRef.current).catch(() => {})
    }

    return () => chatService.off('ReceiveMessage', handleReceive)
  }, [])

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [messages])

  const openConversation = async (id) => {
    if (activeId) chatService.leaveConversation(activeId).catch(() => {})
    setActiveId(id)
    setMessages([])
    setPendingImage(prev => { if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl); return null })
    setLoadingMsgs(true)
    setConversations(prev => prev.map(c => c.id === id ? { ...c, unreadCount: 0 } : c))
    try {
      const data = await chatService.getConversationMessages(id)
      setMessages(data)
      await chatService.joinConversation(id)
    } catch { /* noop */ }
    setLoadingMsgs(false)
  }

  useEffect(() => {
    return () => { if (activeIdRef.current) chatService.leaveConversation(activeIdRef.current).catch(() => {}) }
  }, [])

  // Trên mobile, danh sách và khung chat chiếm toàn màn hình thay phiên nhau
  // (kiểu Messenger); nút "← Quay lại" chỉ hiện ở breakpoint mobile qua CSS.
  const closeConversation = () => {
    if (activeId) chatService.leaveConversation(activeId).catch(() => {})
    setActiveId(null)
  }

  const handleSend = async (e) => {
    e.preventDefault()
    const text = input.trim()
    const img = pendingImage
    if ((!text && !img) || sending || !activeId || img?.uploading) return
    setSending(true)
    setInput('')
    setPendingImage(null)
    try {
      await chatService.replyToConversation(activeId, text, img?.url || null)
    } catch {
      setInput(text)
      setPendingImage(img)
    }
    setSending(false)
  }

  // Chọn/dán/kéo-thả ảnh chỉ đính kèm vào ô nhập (upload nền sẵn cho nhanh),
  // chưa gửi ngay — admin phải bấm Gửi mới thực sự đi tới khách hàng.
  const stageImageFile = async (file) => {
    if (!file || !file.type?.startsWith('image/') || !activeId) return
    const previewUrl = URL.createObjectURL(file)
    setPendingImage(prev => {
      if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl)
      return { previewUrl, url: null, uploading: true }
    })
    try {
      const url = await uploadImage(file)
      setPendingImage(prev => (prev?.previewUrl === previewUrl ? { ...prev, url, uploading: false } : prev))
    } catch (err) {
      toast.error(err.message || 'Tải ảnh thất bại.')
      setPendingImage(prev => (prev?.previewUrl === previewUrl ? null : prev))
    }
  }

  const removePendingImage = () => {
    if (pendingImage?.previewUrl) URL.revokeObjectURL(pendingImage.previewUrl)
    setPendingImage(null)
  }

  const handlePickImage = (e) => {
    const file = e.target.files[0]
    if (fileInputRef.current) fileInputRef.current.value = ''
    stageImageFile(file)
  }

  const handlePaste = (e) => {
    const item = Array.from(e.clipboardData?.items || []).find(i => i.type.startsWith('image/'))
    if (!item) return
    e.preventDefault()
    stageImageFile(item.getAsFile())
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = Array.from(e.dataTransfer?.files || []).find(f => f.type.startsWith('image/'))
    if (file) stageImageFile(file)
  }

  const active = conversations.find(c => c.id === activeId)

  return (
    <div className="chat-page">
      <h3 className="tab-title">Chat với khách hàng</h3>
      <div className={`chat-admin-layout ${activeId ? 'panel-open' : ''}`}>
        <div className="chat-conv-list">
          {conversations.length === 0 && (
            <p className="chat-empty" style={{ padding: 20 }}>Chưa có hội thoại nào.</p>
          )}
          {conversations.map(c => (
            <button
              key={c.id}
              className={`chat-conv-item ${activeId === c.id ? 'active' : ''}`}
              onClick={() => openConversation(c.id)}
            >
              <div className="chat-conv-avatar">{(c.customerName || '?')[0].toUpperCase()}</div>
              <div className="chat-conv-info">
                <div className="chat-conv-top">
                  <strong>{c.customerName}</strong>
                  <span>{formatDay(c.lastMessageAt)}</span>
                </div>
                <div className="chat-conv-bottom">
                  <span className="chat-conv-preview">{c.lastMessage || 'Chưa có tin nhắn'}</span>
                  {c.unreadCount > 0 && <span className="chat-unread-badge">{c.unreadCount}</span>}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div
          className={`chat-conv-panel ${dragOver ? 'drag-over' : ''}`}
          onDragOver={e => { if (activeId) { e.preventDefault(); setDragOver(true) } }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {!activeId && <div className="chat-empty-state">Chọn một hội thoại để bắt đầu trả lời</div>}
          {activeId && (
            <>
              <div className="chat-panel-header">
                <button type="button" className="chat-back-btn" onClick={closeConversation}>←</button>
                <span>{active?.customerName || 'Khách hàng'}</span>
              </div>
              <div className="chat-panel-body" ref={bodyRef}>
                {dragOver && <div className="chat-drop-hint">📷 Thả ảnh để gửi</div>}
                {loadingMsgs && <p className="chat-empty">Đang tải...</p>}
                {!loadingMsgs && messages.map(m => (
                  <div key={m.id} className={`chat-bubble-row ${m.fromAdmin ? 'from-me' : 'from-admin'}`}>
                    <div className="chat-bubble">
                      {m.imageUrl && (
                        <a href={m.imageUrl} target="_blank" rel="noreferrer">
                          <img src={m.imageUrl} alt="Ảnh gửi" className="chat-bubble-image" />
                        </a>
                      )}
                      {m.content && <span>{m.content}</span>}
                      <span className="chat-bubble-time">{formatTime(m.sentAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
              {pendingImage && (
                <div className="chat-pending-image">
                  <img src={pendingImage.previewUrl} alt="Ảnh sẽ gửi" />
                  {pendingImage.uploading && <span className="chat-pending-uploading">Đang tải...</span>}
                  <button type="button" onClick={removePendingImage} title="Bỏ ảnh">✕</button>
                </div>
              )}
              <form className="chat-panel-input" onSubmit={handleSend}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handlePickImage}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className="chat-attach-btn"
                  onClick={() => fileInputRef.current?.click()}
                  title="Gửi ảnh"
                >
                  📎
                </button>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onPaste={handlePaste}
                  placeholder="Nhập trả lời... (dán hoặc kéo thả ảnh)"
                  disabled={sending}
                />
                <button type="submit" disabled={sending || (!input.trim() && !pendingImage) || pendingImage?.uploading}>➤</button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatManager
