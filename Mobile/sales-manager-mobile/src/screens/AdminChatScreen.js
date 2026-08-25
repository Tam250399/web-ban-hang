import { memo, useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator, Dimensions, FlatList,
  KeyboardAvoidingView, PanResponder, Platform, Pressable, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native'
import { Image } from 'expo-image'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import * as ImagePicker from 'expo-image-picker'
import Toast from 'react-native-toast-message'
import { chatService } from '../services/chatService'
import { useRequireOnline } from '../hooks/useRequireOnline'
import { uploadImage } from '../services/uploadService'
import { resolveMediaUrl } from '../services/config'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { admin } from '../theme/colors'
import { fonts } from '../theme/fonts'
import { formatTime, formatDay, isSameDay } from '../utils/format'
import { Icon } from '../components/ui/Icon'

const { width: SCREEN_W } = Dimensions.get('window')
const AVATAR_COLORS = ['#366bd3', '#0f9d58', '#db4437', '#f4b400', '#ab47bc', '#00acc1', '#ff7043']

function getAvatarColor(name) {
  let hash = 0
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

// ─── Avatar component ──────────────────────────────────────────────
function Avatar({ name, size = 40, online = false }) {
  const color = getAvatarColor(name)
  const letter = (name || '?')[0].toUpperCase()
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2 }}>
      <LinearGradient
        colors={[color, shiftColor(color, -30)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.avatarGradient, { width: size, height: size, borderRadius: size / 2 }]}
      >
        <Text style={[s.avatarText, { fontSize: size * 0.4 }]}>{letter}</Text>
      </LinearGradient>
      {online && (
        <View style={[s.onlineDot, { width: size * 0.28, height: size * 0.28, borderRadius: size * 0.14, bottom: 0, right: 0 }]} />
      )}
    </View>
  )
}

function shiftColor(hex, amount) {
  let r = parseInt(hex.slice(1, 3), 16)
  let g = parseInt(hex.slice(3, 5), 16)
  let b = parseInt(hex.slice(5, 7), 16)
  r = Math.max(0, Math.min(255, r + amount))
  g = Math.max(0, Math.min(255, g + amount))
  b = Math.max(0, Math.min(255, b + amount))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

// ─── Message bubble ────────────────────────────────────────────────
// Tách riêng + memo: mỗi ký tự gõ vào ô nhập tin làm cả màn render lại, trước
// đây kéo theo toàn bộ bong bóng (kể cả loại có ảnh) dựng lại cùng.
const MessageBubble = memo(function MessageBubble({ message, showDate, onRetry }) {
  const imgUrl = message.imageUrl ? resolveMediaUrl(message.imageUrl) : null
  return (
    <>
      {showDate && <DateSeparator date={message.sentAt} />}
      <View style={[s.bubbleRow, message.fromAdmin ? s.bubbleRowMe : s.bubbleRowThem]}>
        <View style={[
          s.bubble,
          message.fromAdmin ? s.bubbleMe : s.bubbleThem,
          imgUrl && !message.content && s.bubbleImageOnly,
          message.pending && s.bubblePending,
        ]}>
          {!!imgUrl && (
            <Image
              source={{ uri: imgUrl }}
              style={s.bubbleImage}
              contentFit="cover"
              cachePolicy="disk"
            />
          )}
          {!!message.content && (
            <Text style={message.fromAdmin ? s.bubbleTextMe : s.bubbleTextThem}>{message.content}</Text>
          )}
          <Text style={message.fromAdmin ? s.bubbleTimeMe : s.bubbleTimeThem}>
            {message.pending ? 'Đang gửi...' : message.failed ? 'Gửi lỗi' : formatTime(message.sentAt)}
          </Text>
        </View>
        {message.failed && (
          <TouchableOpacity onPress={() => onRetry?.(message)} hitSlop={8} style={s.retryBtn}>
            <Text style={s.retryText}>Gửi lại</Text>
          </TouchableOpacity>
        )}
      </View>
    </>
  )
})

// ─── Date separator ────────────────────────────────────────────────
function DateSeparator({ date }) {
  return (
    <View style={s.dateSepRow}>
      <View style={s.dateSepLine} />
      <View style={s.dateSepPill}>
        <Text style={s.dateSepText}>{formatDay(date)}</Text>
      </View>
      <View style={s.dateSepLine} />
    </View>
  )
}

// ─── Pending image preview ─────────────────────────────────────────
function PendingImageBar({ image, onRemove }) {
  if (!image) return null
  return (
    <View style={s.pendingBar}>
      <Image source={{ uri: image.uri }} style={s.pendingThumb} contentFit="cover" />
      {image.uploading && (
        <View style={s.pendingOverlay}>
          <ActivityIndicator size="small" color="#fff" />
        </View>
      )}
      <TouchableOpacity style={s.pendingRemoveBtn} onPress={onRemove} hitSlop={8} accessibilityLabel="Bỏ ảnh đính kèm">
        <Text style={s.pendingRemoveText}>✕</Text>
      </TouchableOpacity>
    </View>
  )
}

// ────────────────────────────────────────────────────────────────────
// Chat với khách hàng dành cho Admin — tương ứng ChatManager.jsx bên web.
// ────────────────────────────────────────────────────────────────────
export default function AdminChatScreen({ route }) {
  const [conversations, setConversations] = useState([])
  const [loadingList, setLoadingList] = useState(true)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 250)
  const [activeId, setActiveId] = useState(null)
  const [messages, setMessages] = useState([])
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [input, setInput] = useState('')
  const [pendingImage, setPendingImage] = useState(null) // { uri, fileName, mimeType, url, uploading }
  const [reconnecting, setReconnecting] = useState(false)
  const requireOnline = useRequireOnline()
  const activeIdRef = useRef(null)
  const flatListRef = useRef(null)
  useEffect(() => { activeIdRef.current = activeId }, [activeId])

  // ── Load conversations ──
  const loadConversations = useCallback(() => {
    chatService.getConversations()
      .then(setConversations)
      .catch((err) => Toast.show({ type: 'error', text1: err.message || 'Không tải được danh sách trò chuyện' }))
      .finally(() => setLoadingList(false))
  }, [])

  useEffect(() => {
    chatService.connect().catch(() => Toast.show({ type: 'error', text1: 'Mất kết nối trò chuyện trực tiếp' }))
    loadConversations()

    const handleReceive = (msg) => {
      const isActive = msg.conversationId === activeIdRef.current
      if (isActive) {
        setMessages((prev) => {
          // Tin do chính admin vừa gửi được server phát lại — thay bản tạm bằng
          // bản thật thay vì hiện thành hai dòng trùng nhau.
          if (msg.fromAdmin) {
            const idx = prev.findIndex(
              (m) => m.pending && m.content === (msg.content ?? null) && m.imageUrl === (msg.imageUrl ?? null)
            )
            if (idx !== -1) {
              const next = [...prev]
              next[idx] = msg
              return next
            }
          }
          return [...prev, msg]
        })
      }
      // Trước đây mỗi tin nhắn đến đều gọi lại loadConversations() — một lượt
      // chat sôi nổi là bằng đó request tải lại toàn bộ danh sách. Bản thân tin
      // nhắn đã đủ dữ liệu để cập nhật tại chỗ dòng hội thoại tương ứng.
      setConversations((prev) => {
        const index = prev.findIndex((c) => c.id === msg.conversationId)
        if (index === -1) {
          // Hội thoại chưa có trong danh sách (khách mới nhắn lần đầu) — lúc này
          // mới cần hỏi lại server để lấy đủ thông tin khách hàng.
          loadConversations()
          return prev
        }
        const current = prev[index]
        const updated = {
          ...current,
          lastMessage: msg.content || (msg.imageUrl ? '[Hình ảnh]' : current.lastMessage),
          lastMessageAt: msg.sentAt,
          unreadCount: isActive || msg.fromAdmin ? current.unreadCount : (current.unreadCount || 0) + 1,
        }
        // Đưa hội thoại vừa có tin mới lên đầu danh sách.
        return [updated, ...prev.slice(0, index), ...prev.slice(index + 1)]
      })
    }

    chatService.on('ReceiveMessage', handleReceive)
    let wasDisconnected = false
    const unsubscribeState = chatService.onConnectionChange((connected) => {
      setReconnecting(!connected)
      // Trong lúc mất kết nối có thể đã lỡ tin nhắn nên phải đồng bộ lại — nhưng
      // chỉ khi thực sự vừa rớt rồi nối lại, không phải lần kết nối đầu tiên
      // (loadConversations() ở trên đã chạy rồi).
      if (connected && wasDisconnected) loadConversations()
      wasDisconnected = !connected
    })

    return () => {
      chatService.off('ReceiveMessage', handleReceive)
      unsubscribeState()
      if (activeIdRef.current) chatService.leaveConversation(activeIdRef.current).catch(() => {})
    }
  }, [loadConversations])

  const openConversation = async (id) => {
    if (activeId) chatService.leaveConversation(activeId).catch(() => {})
    setActiveId(id)
    setMessages([])
    setPendingImage(null)
    setLoadingMsgs(true)
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)))
    try {
      const data = await chatService.getConversationMessages(id)
      setMessages(data)
      await chatService.joinConversation(id)
    } catch {
      // noop
    }
    setLoadingMsgs(false)
  }

  // ── Auto scroll khi có tin nhắn mới ──
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => flatListRef.current?.scrollToEnd?.({ animated: true }), 100)
    }
  }, [messages])

  // Tự động mở cuộc hội thoại nếu nhận param conversationId từ thông báo
  useEffect(() => {
    if (route?.params?.conversationId) {
      openConversation(route.params.conversationId)
    }
  }, [route?.params?.conversationId])

  // Optimistic: bong bóng hiện ngay khi bấm gửi, không phải chờ trọn một vòng
  // WebSocket mới thấy tin của chính mình.
  const deliver = useCallback(async (conversationId, tempId, content, imageUrl) => {
    try {
      await chatService.replyToConversation(conversationId, content, imageUrl)
    } catch (err) {
      setMessages((prev) => prev.map((m) =>
        m.id === tempId ? { ...m, pending: false, failed: true } : m
      ))
      Toast.show({ type: 'error', text1: err.message || 'Gửi tin nhắn thất bại' })
    }
  }, [])

  const handleRetry = useCallback((message) => {
    if (!requireOnline('Gửi lại tin nhắn')) return
    setMessages((prev) => prev.map((m) =>
      m.id === message.id ? { ...m, failed: false, pending: true } : m
    ))
    deliver(message.conversationId, message.id, message.content, message.imageUrl)
  }, [requireOnline, deliver])

  const renderMessage = useCallback(({ item, index }) => {
    const prev = index > 0 ? messages[index - 1] : null
    const showDate = !prev || !isSameDay(prev.sentAt, item.sentAt)
    return <MessageBubble message={item} showDate={showDate} onRetry={handleRetry} />
  }, [messages, handleRetry])

  const closeConversation = useCallback(() => {
    if (activeId) chatService.leaveConversation(activeId).catch(() => {})
    setActiveId(null)
    setPendingImage(null)
  }, [activeId])

  // ── Cử chỉ vuốt trong màn nhắn tin: vuốt sang phải -> quay lại danh sách, vuốt sang trái -> bị chặn ──
  const threadPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Chỉ bắt khi vuốt ngang rõ rệt: dx > 15 và lớn hơn chuyển động dọc
        return gestureState.dx > 15 && gestureState.dx > Math.abs(gestureState.dy) * 1.3
      },
      onPanResponderRelease: (_, gestureState) => {
        // Vuốt sang phải từ 45px trở lên -> đóng hội thoại quay về danh sách
        if (gestureState.dx > 45) {
          closeConversation()
        }
      },
    })
  ).current

  // ── Gửi tin nhắn ──
  const handleSend = () => {
    const text = input.trim()
    const img = pendingImage
    if ((!text && !img) || !activeId || img?.uploading) return
    if (!requireOnline('Gửi tin nhắn')) return

    const content = text || null
    const imageUrl = img?.url || null
    const tempId = `tmp-${Date.now()}`

    setInput('')
    setPendingImage(null)
    setMessages((prev) => [...prev, {
      id: tempId,
      conversationId: activeId,
      content,
      imageUrl,
      sentAt: new Date().toISOString(),
      fromAdmin: true,
      pending: true,
    }])

    deliver(activeId, tempId, content, imageUrl)
  }

  // ── Chọn ảnh ──
  const handlePickImage = async () => {
    if (!activeId) return
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      })
      if (result.canceled || !result.assets?.[0]) return
      const asset = result.assets[0]
      setPendingImage({ uri: asset.uri, fileName: asset.fileName, mimeType: asset.mimeType, url: null, uploading: true })
      try {
        const url = await uploadImage(asset)
        setPendingImage((prev) => prev?.uri === asset.uri ? { ...prev, url, uploading: false } : prev)
      } catch (err) {
        Toast.show({ type: 'error', text1: err.message || 'Tải ảnh thất bại' })
        setPendingImage((prev) => prev?.uri === asset.uri ? null : prev)
      }
    } catch {
      // permission denied or other error
    }
  }

  const removePendingImage = () => setPendingImage(null)

  const active = conversations.find((c) => c.id === activeId)
  const filtered = conversations.filter((c) => c.customerName?.toLowerCase().includes(debouncedSearch.trim().toLowerCase()))

  // ════════════════════════════════════════════════════════════════════
  //  THREAD VIEW (đang mở hội thoại)
  // ════════════════════════════════════════════════════════════════════
  if (activeId) {
    return (
      <SafeAreaView style={s.root} edges={['top']} {...threadPanResponder.panHandlers}>
        {/* ── Header ── */}
        <View style={s.threadHeader}>
          <TouchableOpacity onPress={closeConversation} style={s.backBtn} activeOpacity={0.6} hitSlop={8} accessibilityLabel="Quay lại">
            <Text style={s.backIcon}>‹</Text>
          </TouchableOpacity>
          <Avatar name={active?.customerName} size={36} online={active?.isOnline} />
          <View style={s.threadHeaderInfo}>
            <Text style={s.threadHeaderName} numberOfLines={1}>{active?.customerName || 'Khách hàng'}</Text>
            {active?.isOnline && <Text style={s.onlineLabel}>Đang hoạt động</Text>}
          </View>
        </View>

        {reconnecting && (
          <View style={s.reconnectBanner}>
            <ActivityIndicator size="small" color="#B45309" />
            <Text style={s.reconnectBannerText}>Đang kết nối lại...</Text>
          </View>
        )}

        {/* Màn này nằm trong Tab Navigator dạng PagerView (material-top-tabs) —
            windowSoftInputMode=adjustResize của Android không tự resize được bên
            trong PagerView như với màn hình Stack thường, nên phải tự đẩy layout
            lên bằng behavior="height" thay vì để trống. */}
        <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
          {loadingMsgs ? (
            <View style={s.loaderWrap}>
              <ActivityIndicator size="large" color={admin.primary} />
              <Text style={s.loaderText}>Đang tải tin nhắn...</Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(m) => String(m.id)}
              contentContainerStyle={s.messageList}
              showsVerticalScrollIndicator={false}
              initialNumToRender={15}
              maxToRenderPerBatch={10}
              windowSize={7}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd?.({ animated: false })}
              renderItem={renderMessage}
              ListEmptyComponent={
                <View style={s.emptyMsgWrap}>
                  <View style={s.emptyMsgIcon}>
                    <Icon name="chat" size={36} color={admin.textMuted} />
                  </View>
                  <Text style={s.emptyMsgText}>Chưa có tin nhắn nào</Text>
                </View>
              }
            />
          )}

          {/* ── Pending image preview ── */}
          <PendingImageBar image={pendingImage} onRemove={removePendingImage} />

          {/* ── Input bar ── */}
          <View style={s.inputRow}>
            <TouchableOpacity style={s.attachBtn} onPress={handlePickImage} activeOpacity={0.6} hitSlop={6} accessibilityLabel="Đính kèm ảnh">
              <Icon name="paperclip" size={18} color={admin.textMuted} />
            </TouchableOpacity>
            <TextInput
              style={s.input}
              value={input}
              onChangeText={setInput}
              placeholder="Nhập tin nhắn..."
              placeholderTextColor="#9ca3af"
              multiline
              maxLength={2000}
            />
            <TouchableOpacity
              style={[
                s.sendBtn,
                ((!input.trim() && !pendingImage) || pendingImage?.uploading) && s.sendBtnDisabled,
              ]}
              onPress={handleSend}
              disabled={(!input.trim() && !pendingImage) || pendingImage?.uploading}
              activeOpacity={0.7}
              hitSlop={6}
              accessibilityLabel="Gửi tin nhắn"
            >
              <LinearGradient
                colors={(!input.trim() && !pendingImage) ? ['#c5cdd8', '#b0b8c4'] : ['#4a7fe5', '#2d5fbe']}
                style={s.sendBtnGradient}
              >
                <Text style={s.sendBtnText}>➤</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    )
  }

  // ════════════════════════════════════════════════════════════════════
  //  CONVERSATION LIST VIEW
  // ════════════════════════════════════════════════════════════════════
  return (
    <SafeAreaView style={s.root} edges={['top']}>
      {/* ── Page header ── */}
      <View style={s.listHeader}>
        <Text style={s.heading}>Chat</Text>
        <Text style={s.headingSub}>Hỗ trợ khách hàng</Text>
      </View>

      {reconnecting && (
        <View style={s.reconnectBanner}>
          <ActivityIndicator size="small" color="#B45309" />
          <Text style={s.reconnectBannerText}>Đang kết nối lại...</Text>
        </View>
      )}

      {/* ── Search bar ── */}
      <View style={s.searchWrap}>
        <View style={s.searchIcon}>
          <Icon name="search" size={15} color={admin.textMuted} />
        </View>
        <TextInput
          style={s.search}
          placeholder="Tìm theo tên khách hàng..."
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loadingList ? (
        <View style={s.loaderWrap}>
          <ActivityIndicator size="large" color={admin.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(c) => String(c.id)}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [s.convRow, pressed && s.convRowPressed]}
              onPress={() => openConversation(item.id)}
            >
              <Avatar name={item.customerName} size={46} online={item.isOnline} />
              <View style={s.convInfo}>
                <View style={s.convTop}>
                  <Text style={s.convName} numberOfLines={1}>{item.customerName}</Text>
                  <Text style={s.convDate}>{item.lastMessageAt ? formatDay(item.lastMessageAt) : ''}</Text>
                </View>
                <View style={s.convBottom}>
                  <Text style={[s.convPreview, item.unreadCount > 0 && s.convPreviewUnread]} numberOfLines={1}>
                    {item.lastMessage || 'Chưa có tin nhắn'}
                  </Text>
                  {item.unreadCount > 0 && (
                    <View style={s.unreadBadge}>
                      <Text style={s.unreadBadgeText}>{item.unreadCount > 99 ? '99+' : item.unreadCount}</Text>
                    </View>
                  )}
                </View>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <View style={s.emptyIcon}>
                <Icon name="inbox" size={40} color={admin.textMuted} />
              </View>
              <Text style={s.emptyText}>Chưa có hội thoại nào</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  )
}

// ════════════════════════════════════════════════════════════════════
//  STYLES
// ════════════════════════════════════════════════════════════════════
const BUBBLE_MAX = SCREEN_W * 0.72

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f0f2f5' },
  flex: { flex: 1 },

  reconnectBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#FEF3C7', paddingVertical: 6,
  },
  reconnectBannerText: { fontFamily: fonts.adminBodySemiBold, fontSize: 13, color: '#B45309' },

  // ── LIST HEADER ──
  listHeader: {
    paddingHorizontal: 20, paddingTop: 18, paddingBottom: 4,
  },
  heading: {
    fontFamily: fonts.adminDisplayBold, fontSize: 22, color: admin.text, letterSpacing: -0.3,
  },
  headingSub: {
    fontFamily: fonts.adminBody, fontSize: 13.5, color: admin.textMuted, marginTop: 2,
  },

  // ── SEARCH ──
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginTop: 12, marginBottom: 6,
    backgroundColor: '#fff', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 10 : 0,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: { marginRight: 8 },
  search: {
    flex: 1, fontSize: 14.5, color: admin.text, fontFamily: fonts.adminBody,
    paddingVertical: Platform.OS === 'ios' ? 0 : 9,
  },

  // ── CONVERSATION LIST ──
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20 },
  convRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6,
    elevation: 2,
  },
  convRowPressed: { backgroundColor: '#f5f7fa', transform: [{ scale: 0.985 }] },
  convInfo: { flex: 1, minWidth: 0 },
  convTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convName: { flex: 1, fontFamily: fonts.adminBodySemiBold, fontSize: 15, color: admin.text, marginRight: 8 },
  convDate: { fontFamily: fonts.adminBody, fontSize: 12.5, color: admin.textMuted },
  convBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  convPreview: { flex: 1, fontFamily: fonts.adminBody, fontSize: 13.5, color: admin.textMuted, marginRight: 8 },
  convPreviewUnread: { color: admin.text, fontFamily: fonts.adminBodySemiBold },
  unreadBadge: {
    minWidth: 22, height: 22, borderRadius: 11,
    backgroundColor: admin.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  unreadBadgeText: { color: '#fff', fontFamily: fonts.adminBodyBold, fontSize: 12 },

  // ── EMPTY LIST ──
  emptyWrap: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { marginBottom: 12 },
  emptyText: { fontFamily: fonts.adminBody, fontSize: 15, color: admin.textMuted },

  // ── AVATAR ──
  avatarGradient: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontFamily: fonts.adminDisplayBold },
  onlineDot: {
    position: 'absolute', backgroundColor: '#22c55e',
    borderWidth: 2, borderColor: '#fff',
  },

  // ── THREAD HEADER ──
  threadHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6,
    elevation: 3,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: '#f0f2f5' },
  backIcon: { fontSize: 22, color: admin.text, fontWeight: '600', marginTop: -2 },
  threadHeaderInfo: { flex: 1, minWidth: 0 },
  threadHeaderName: { fontFamily: fonts.adminBodySemiBold, fontSize: 16, color: admin.text },
  onlineLabel: { fontFamily: fonts.adminBody, fontSize: 12.5, color: '#22c55e', marginTop: 1 },

  // ── MESSAGES ──
  messageList: { paddingHorizontal: 12, paddingVertical: 12 },
  bubbleRow: { flexDirection: 'row', marginBottom: 6 },
  bubbleRowMe: { justifyContent: 'flex-end' },
  bubbleRowThem: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: BUBBLE_MAX, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3,
    elevation: 1,
  },
  bubbleMe: {
    backgroundColor: '#366bd3', borderBottomRightRadius: 6,
  },
  bubbleThem: {
    backgroundColor: '#fff', borderBottomLeftRadius: 6,
  },
  bubbleImageOnly: { paddingHorizontal: 4, paddingTop: 4, paddingBottom: 6 },
  bubbleImage: {
    width: BUBBLE_MAX - 28, height: (BUBBLE_MAX - 28) * 0.65,
    borderRadius: 14, marginBottom: 4,
  },
  bubbleTextMe: { color: '#fff', fontFamily: fonts.adminBody, fontSize: 15, lineHeight: 20 },
  bubbleTextThem: { color: admin.text, fontFamily: fonts.adminBody, fontSize: 15, lineHeight: 20 },
  bubblePending: { opacity: 0.65 },
  retryBtn: { marginTop: 4, alignSelf: 'flex-end' },
  retryText: { color: '#DC2626', fontFamily: fonts.adminBodyBold, fontSize: 13.5 },
  bubbleTimeMe: { color: 'rgba(255,255,255,0.65)', fontFamily: fonts.adminBody, fontSize: 12, marginTop: 4, textAlign: 'right' },
  bubbleTimeThem: { color: admin.textMuted, fontFamily: fonts.adminBody, fontSize: 12, marginTop: 4, textAlign: 'right' },

  // ── Date separator ──
  dateSepRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 14, paddingHorizontal: 8 },
  dateSepLine: { flex: 1, height: 1, backgroundColor: '#dde1e6' },
  dateSepPill: {
    backgroundColor: '#e8ebef', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 4, marginHorizontal: 10,
  },
  dateSepText: { fontFamily: fonts.adminBody, fontSize: 12.5, color: admin.textMuted },

  // ── Empty messages ──
  emptyMsgWrap: { alignItems: 'center', marginTop: 60 },
  emptyMsgIcon: { marginBottom: 10 },
  emptyMsgText: { fontFamily: fonts.adminBody, fontSize: 14, color: admin.textMuted },

  // ── Loading ──
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 40 },
  loaderText: { fontFamily: fonts.adminBody, fontSize: 14, color: admin.textMuted, marginTop: 12 },

  // ── Pending image bar ──
  pendingBar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: '#e5e7eb', backgroundColor: '#fafbfc',
  },
  pendingThumb: { width: 56, height: 56, borderRadius: 10 },
  pendingOverlay: {
    ...StyleSheet.absoluteFillObject, width: 56, height: 56, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center',
  },
  pendingRemoveBtn: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: '#ef4444',
    alignItems: 'center', justifyContent: 'center', marginLeft: 10,
  },
  pendingRemoveText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // ── INPUT ROW ──
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 10, paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: '#e5e7eb', backgroundColor: '#fff',
  },
  attachBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#f0f2f5', alignItems: 'center', justifyContent: 'center',
  },
  input: {
    flex: 1, maxHeight: 100, paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 22, backgroundColor: '#f0f2f5',
    fontSize: 15, color: admin.text, fontFamily: fonts.adminBody,
  },
  sendBtn: { width: 40, height: 40 },
  sendBtnDisabled: { opacity: 0.6 },
  sendBtnGradient: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnText: { color: '#fff', fontSize: 17, marginLeft: 2 },
})
