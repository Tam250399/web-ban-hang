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
    <div className="fixed bottom-5 right-5 z-40">
      {open && (
        <div
          className={`w-[calc(100vw-2.5rem)] sm:w-96 h-[500px] max-h-[calc(100vh-6rem)] bg-white rounded-2xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200 ${
            dragOver ? 'ring-2 ring-primary ring-offset-2' : ''
          }`}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-primary to-primary-hover text-white flex items-center justify-between shadow-xs shrink-0">
            <span className="font-semibold text-sm flex items-center gap-2">
              <Icon name="chat" size={18} /> Hỗ trợ trực tuyến
            </span>
            <button
              className="w-7 h-7 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-colors"
              onClick={toggleOpen}
              aria-label="Đóng"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-stone-50/50" ref={bodyRef}>
            {dragOver && (
              <div className="p-3 bg-primary/10 border-2 border-dashed border-primary text-primary rounded-xl text-center text-xs font-semibold flex items-center justify-center gap-1.5">
                <Icon name="camera" size={16} /> Thả ảnh để gửi
              </div>
            )}
            {messages.length === 0 && (
              <div className="h-full flex items-center justify-center text-center p-4">
                <p className="text-xs text-stone-400">Gửi tin nhắn cho shop, chúng tôi sẽ phản hồi sớm nhất!</p>
              </div>
            )}
            {messages.map(m => (
              <div key={m.id} className={`flex flex-col ${m.fromAdmin ? 'items-start' : 'items-end'}`}>
                <div
                  className={`max-w-[82%] rounded-2xl p-3 text-xs sm:text-sm shadow-2xs space-y-1.5 ${
                    m.fromAdmin
                      ? 'bg-white text-stone-800 border border-stone-200/80 rounded-bl-xs'
                      : 'bg-primary text-white rounded-br-xs'
                  }`}
                >
                  {m.imageUrl && (
                    <a href={m.imageUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg">
                      <img
                        src={resolveMediaUrl(m.imageUrl)}
                        alt="Ảnh gửi"
                        className="max-h-48 w-full object-cover hover:opacity-95 transition-opacity"
                        loading="lazy"
                        decoding="async"
                      />
                    </a>
                  )}
                  {m.content && <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>}
                  <div className={`text-[10px] ${m.fromAdmin ? 'text-stone-400' : 'text-white/75'} text-right`}>
                    {formatTime(m.sentAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pending Image */}
          {pendingImage && (
            <div className="relative p-2 bg-stone-100 border-t border-stone-200 flex items-center gap-2">
              <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-stone-300 shrink-0">
                <img src={pendingImage.previewUrl} alt="Ảnh sẽ gửi" className="w-full h-full object-cover" />
                {pendingImage.uploading && (
                  <div className="absolute inset-0 bg-black/50 text-white text-[9px] flex items-center justify-center font-medium">
                    Tải...
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={removePendingImage}
                className="w-6 h-6 rounded-full bg-stone-300 hover:bg-stone-400 text-stone-700 flex items-center justify-center text-xs"
                title="Bỏ ảnh"
                aria-label="Bỏ ảnh"
              >
                ✕
              </button>
            </div>
          )}

          {/* Input Form */}
          <form className="p-2.5 border-t border-stone-200 bg-white flex items-center gap-2 shrink-0" onSubmit={handleSend}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handlePickImage}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors shrink-0"
              onClick={() => fileInputRef.current?.click()}
              title="Gửi ảnh"
            >
              <Icon name="paperclip" size={18} />
            </button>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onPaste={handlePaste}
              placeholder="Nhập tin nhắn... (dán/kéo thả ảnh)"
              disabled={sending}
              className="flex-1 px-3 py-2 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            <button
              type="submit"
              disabled={sending || (!input.trim() && !pendingImage) || pendingImage?.uploading}
              className="w-9 h-9 rounded-xl bg-primary hover:bg-primary/90 text-white flex items-center justify-center transition-colors disabled:opacity-40 shrink-0 shadow-xs"
            >
              ➤
            </button>
          </form>
        </div>
      )}

      {/* Floating Action Button */}
      {!open && (
        <button
          className="relative w-14 h-14 rounded-full bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200"
          onClick={toggleOpen}
          aria-label="Mở khung trò chuyện hỗ trợ"
        >
          <Icon name="chat" size={24} />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-white text-[11px] font-bold flex items-center justify-center shadow-xs border-2 border-white animate-bounce">
              {unread}
            </span>
          )}
        </button>
      )}
    </div>
  )
}

export default ChatWidget
