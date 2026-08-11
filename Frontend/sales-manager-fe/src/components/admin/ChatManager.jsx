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
  const [search, setSearch] = useState('')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [pendingImage, setPendingImage] = useState(null) // { previewUrl, url, uploading }
  const [dragOver, setDragOver] = useState(false)
  const bodyRef = useRef(null)
  const fileInputRef = useRef(null)
  const inputRef = useRef(null)
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

  // Phụ thuộc cả loadingMsgs vì bong bóng tin nhắn chỉ thực sự render ra DOM sau
  // khi loadingMsgs chuyển false (loadingMsgs=false đến ở một lượt render khác,
  // trễ hơn lúc messages được set) — nếu chỉ phụ thuộc [messages] thì lúc effect
  // chạy, danh sách tin nhắn vẫn còn ẩn sau "Đang tải...", scrollHeight đo được
  // rất nhỏ và không có lần chạy lại nào để cuộn xuống đúng vị trí.
  useEffect(() => {
    if (!loadingMsgs && bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [messages, loadingMsgs])

  // Focus lại ô nhập sau khi gửi: gọi .focus() ngay sau setSending(false) không ăn
  // vì lúc đó React chưa kịp render lại để bỏ thuộc tính disabled trên input.
  useEffect(() => {
    if (!sending) inputRef.current?.focus()
  }, [sending])

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
  const filteredConversations = conversations.filter(c =>
    c.customerName?.toLowerCase().includes(search.trim().toLowerCase())
  )

  return (
    <div className="chat-page">
      <h3 className="tab-title">Chat với khách hàng</h3>
      <div className={`chat-admin-layout ${activeId ? 'panel-open' : ''}`}>
        <div className="chat-conv-list">
          <div style={{ padding: 10, borderBottom: '1px solid var(--border)' }}>
            <input
              className="search-input"
              style={{ padding: '9px 12px', fontSize: '0.85rem' }}
              placeholder="Tìm theo tên khách hàng..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {conversations.length === 0 && (
            <p className="chat-empty" style={{ padding: 20 }}>Chưa có hội thoại nào.</p>
          )}
          {conversations.length > 0 && filteredConversations.length === 0 && (
            <p className="chat-empty" style={{ padding: 20 }}>Không tìm thấy hội thoại phù hợp.</p>
          )}
          {filteredConversations.map(c => (
            <button
              key={c.id}
              className={`chat-conv-item ${activeId === c.id ? 'active' : ''}`}
              onClick={() => openConversation(c.id)}
            >
              <div className="chat-conv-avatar">
                {(c.customerName || '?')[0].toUpperCase()}
                {c.isOnline && <span className="chat-online-dot" title="Đang online" />}
              </div>
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
                <span>
                  {active?.customerName || 'Khách hàng'}
                  {active?.isOnline && <span className="chat-online-dot" title="Đang online" />}
                </span>
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
                  ref={inputRef}
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
