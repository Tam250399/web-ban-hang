import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { chatService } from '../../services/chatService'
import { uploadImage } from '../../services/uploadService'
import { resolveMediaUrl } from '../../services/config'
import { Icon } from '../common/Icon'

/**
 * Hàm formatTime: thực thi chức năng xử lý của module
 */
function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

/**
 * Hàm formatDay: thực thi chức năng xử lý của module
 */
function formatDay(iso) {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}

/**
 * Phân hệ hỗ trợ khách hàng qua tin nhắn trực tuyến SignalR thời gian thực
 */
function ChatManager({ conversations, setConversations, activeId, setActiveId }) {
  const [search, setSearch] = useState('')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [pendingImage, setPendingImage] = useState(null)
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
    if (!loadingMsgs && bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [messages, loadingMsgs])

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
    } catch {  }
    setLoadingMsgs(false)
  }

  useEffect(() => {
    return () => { if (activeIdRef.current) chatService.leaveConversation(activeIdRef.current).catch(() => {}) }
  }, [])

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
    <div className="space-y-3 h-[calc(100vh-140px)] flex flex-col">
      <h3 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight shrink-0">
        Chat với khách hàng
      </h3>

      <div className="flex-1 min-h-0 bg-white rounded-2xl border border-stone-200/80 shadow-2xs overflow-hidden flex flex-col md:flex-row relative">
        {/* Left conversation list */}
        <div className={`w-full md:w-80 lg:w-96 shrink-0 border-r border-stone-200 flex flex-col bg-stone-50/40 ${activeId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-3 border-b border-stone-200 bg-white">
            <div className="relative">
              <Icon name="search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl outline-none focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 transition"
                placeholder="Tìm theo tên khách hàng..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-stone-100">
            {conversations.length === 0 && (
              <p className="p-6 text-center text-xs text-stone-400">Chưa có hội thoại nào.</p>
            )}
            {conversations.length > 0 && filteredConversations.length === 0 && (
              <p className="p-6 text-center text-xs text-stone-400">Không tìm thấy hội thoại phù hợp.</p>
            )}
            {filteredConversations.map(c => (
              <button
                key={c.id}
                type="button"
                className={`w-full text-left p-3 flex items-center gap-3 transition cursor-pointer hover:bg-stone-100/70 ${
                  activeId === c.id ? 'bg-primary/10 border-l-4 border-l-primary' : ''
                }`}
                onClick={() => openConversation(c.id)}
              >
                <div className="relative w-10 h-10 rounded-full bg-stone-200 text-stone-700 font-bold flex items-center justify-center shrink-0 text-sm">
                  {(c.customerName || '?')[0].toUpperCase()}
                  {c.isOnline && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" title="Đang online" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <strong className="text-xs sm:text-sm font-bold text-stone-900 truncate">{c.customerName}</strong>
                    <span className="text-[10px] text-stone-400 shrink-0">{formatDay(c.lastMessageAt)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span className="text-xs text-stone-500 truncate">{c.lastMessage || 'Chưa có tin nhắn'}</span>
                    {c.unreadCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-primary text-white shrink-0">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right message panel */}
        <div
          className={`flex-1 min-w-0 flex flex-col bg-white ${dragOver ? 'ring-2 ring-primary ring-inset bg-primary/5' : ''} ${
            !activeId ? 'hidden md:flex items-center justify-center' : 'flex'
          }`}
          onDragOver={e => { if (activeId) { e.preventDefault(); setDragOver(true) } }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {!activeId ? (
            <div className="text-center p-8 text-stone-400 text-xs sm:text-sm">
              <Icon name="messageSquare" size={36} className="mx-auto mb-2 opacity-40 text-stone-400" />
              Chọn một hội thoại để bắt đầu trả lời
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-stone-200 flex items-center gap-3 bg-stone-50/60 shrink-0">
                <button
                  type="button"
                  className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-stone-600 hover:bg-stone-200/60 font-bold"
                  onClick={closeConversation}
                >
                  ←
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-bold text-stone-900">{active?.customerName || 'Khách hàng'}</span>
                  {active?.isOnline && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Online
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-stone-100/40 relative" ref={bodyRef}>
                {dragOver && (
                  <div className="absolute inset-0 bg-primary/10 backdrop-blur-2xs z-20 flex items-center justify-center text-primary font-bold text-sm gap-2">
                    <Icon name="camera" size={20} /> Thả ảnh để gửi
                  </div>
                )}
                {loadingMsgs && <p className="text-center py-4 text-xs text-stone-400">Đang tải...</p>}
                {!loadingMsgs && messages.map(m => (
                  <div key={m.id} className={`flex ${m.fromAdmin ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-3.5 py-2 text-xs sm:text-sm shadow-2xs space-y-1 ${
                      m.fromAdmin
                        ? 'bg-primary text-white rounded-br-xs'
                        : 'bg-white text-stone-800 border border-stone-200/80 rounded-bl-xs'
                    }`}>
                      {m.imageUrl && (
                        <a href={m.imageUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl">
                          <img
                            src={resolveMediaUrl(m.imageUrl)}
                            alt="Ảnh gửi"
                            className="max-h-64 object-cover rounded-xl"
                            loading="lazy"
                            decoding="async"
                          />
                        </a>
                      )}
                      {m.content && <p className="whitespace-pre-wrap break-words">{m.content}</p>}
                      <span className={`text-[10px] block text-right ${m.fromAdmin ? 'text-white/75' : 'text-stone-400'}`}>
                        {formatTime(m.sentAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {pendingImage && (
                <div className="px-4 py-2 bg-stone-50 border-t border-stone-200 flex items-center gap-3 shrink-0">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-stone-300">
                    <img src={pendingImage.previewUrl} alt="Ảnh sẽ gửi" className="w-full h-full object-cover" />
                    {pendingImage.uploading && (
                      <div className="absolute inset-0 bg-stone-900/60 text-white flex items-center justify-center text-[10px] font-bold">
                        Đang tải...
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={removePendingImage}
                    className="w-6 h-6 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-700 flex items-center justify-center text-xs font-bold transition cursor-pointer"
                    title="Bỏ ảnh"
                    aria-label="Bỏ ảnh"
                  >
                    ✕
                  </button>
                </div>
              )}

              <form className="p-3 border-t border-stone-200 bg-white flex items-center gap-2 shrink-0" onSubmit={handleSend}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handlePickImage}
                  className="sr-only"
                />
                <button
                  type="button"
                  className="w-9 h-9 rounded-xl border border-stone-200 hover:border-primary text-stone-500 hover:text-primary flex items-center justify-center transition cursor-pointer shrink-0"
                  onClick={() => fileInputRef.current?.click()}
                  title="Gửi ảnh"
                >
                  <Icon name="paperclip" size={16} />
                </button>
                <input
                  ref={inputRef}
                  className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl outline-none focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 transition"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onPaste={handlePaste}
                  placeholder="Nhập trả lời... (dán hoặc kéo thả ảnh)"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={sending || (!input.trim() && !pendingImage) || pendingImage?.uploading}
                  className="w-9 h-9 rounded-xl bg-primary hover:bg-primary-hover text-white flex items-center justify-center transition shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
                >
                  <Icon name="send" size={14} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatManager
