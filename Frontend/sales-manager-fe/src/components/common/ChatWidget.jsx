import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { chatService } from '../../services/chatService'
import { uploadImage } from '../../services/uploadService'
import { useRequireOnline } from '../../hooks/useRequireOnline'
import { resolveMediaUrl } from '../../services/config'
import { Icon } from './Icon'

/**
 * Hàm formatTime: thực thi chức năng xử lý của module
 */
function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

/**
 * Nút bấm và khung chat nổi hỗ trợ trực tuyến
 */
function ChatWidget({ user }) {
  const requireOnline = useRequireOnline()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [unread, setUnread] = useState(0)
  const [sending, setSending] = useState(false)
  const [pendingImage, setPendingImage] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const bodyRef = useRef(null)
  const fileInputRef = useRef(null)
  const inputRef = useRef(null)
  const openRef = useRef(open)
  useEffect(() => { openRef.current = open }, [open])

  useEffect(() => {
    if (!user || user.role !== 'Customer') return

    let cancelled = false

    const handleReceive = (msg) => {
      setMessages(prev => [...prev, msg])
      if (msg.fromAdmin && !openRef.current) setUnread(u => u + 1)
    }

    chatService.getMyConversation()
      .then(data => { if (!cancelled) setMessages(data.messages) })
      .catch(() => {})

    chatService.on('ReceiveMessage', handleReceive)
    chatService.connect().catch(() => {})

    return () => {
      cancelled = true
      chatService.off('ReceiveMessage', handleReceive)
    }
  }, [])

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [messages, open])

  useEffect(() => {
    if (!sending) inputRef.current?.focus()
  }, [sending])

  const toggleOpen = () => {
    setOpen(o => {
      const next = !o
      if (next) {
        setUnread(0)
        chatService.markRead().catch(() => {})
      }
      return next
    })
  }

  const handleSend = async (e) => {
    e.preventDefault()
    const text = input.trim()
    const img = pendingImage
    if ((!text && !img) || sending || img?.uploading) return
    if (!requireOnline('Gửi tin nhắn')) return
    setSending(true)
    setInput('')
    setPendingImage(null)
    try {
      await chatService.sendMessage(text, img?.url || null)
    } catch {
      setInput(text)
      setPendingImage(img)
    }
    setSending(false)
  }

  const stageImageFile = async (file) => {
    if (!file || !file.type?.startsWith('image/')) return
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

  if (!user || user.role !== 'Customer') return null

  return (
    <div className="chat-widget">
      {open && (
        <div
          className={`chat-panel ${dragOver ? 'drag-over' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <div className="chat-panel-header">
            <span><Icon name="chat" /> Hỗ trợ trực tuyến</span>
            <button className="chat-panel-close" onClick={toggleOpen} aria-label="Đóng">✕</button>
          </div>
          <div className="chat-panel-body" ref={bodyRef}>
            {dragOver && <div className="chat-drop-hint"><Icon name="camera" /> Thả ảnh để gửi</div>}
            {messages.length === 0 && (
              <p className="chat-empty">Gửi tin nhắn cho shop, chúng tôi sẽ phản hồi sớm nhất!</p>
            )}
            {messages.map(m => (
              <div key={m.id} className={`chat-bubble-row ${m.fromAdmin ? 'from-admin' : 'from-me'}`}>
                <div className="chat-bubble">
                  {m.imageUrl && (
                    <a href={m.imageUrl} target="_blank" rel="noreferrer">
                      <img src={resolveMediaUrl(m.imageUrl)} alt="Ảnh gửi" className="chat-bubble-image" loading="lazy" decoding="async" />
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
              <button type="button" onClick={removePendingImage} title="Bỏ ảnh" aria-label="Bỏ ảnh">✕</button>
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
              <Icon name="paperclip" />
            </button>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onPaste={handlePaste}
              placeholder="Nhập tin nhắn... (dán hoặc kéo thả ảnh)"
              disabled={sending}
            />
            <button type="submit" disabled={sending || (!input.trim() && !pendingImage) || pendingImage?.uploading}>➤</button>
          </form>
        </div>
      )}
      {!open && (
        <button className="chat-fab" onClick={toggleOpen}>
          <Icon name="chat" size={24} />
          {unread > 0 && <span className="chat-fab-badge">{unread}</span>}
        </button>
      )}
    </div>
  )
}

export default ChatWidget
