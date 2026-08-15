import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator, FlatList, KeyboardAvoidingView, Platform,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native'
import { Image } from 'expo-image'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { useNavigation } from '@react-navigation/native'
import * as ImagePicker from 'expo-image-picker'
import Toast from 'react-native-toast-message'
import { useAuth } from '../context/auth-context'
import { chatService } from '../services/chatService'
import { uploadImage } from '../services/uploadService'
import { resolveMediaUrl } from '../services/config'
import { brand } from '../theme/colors'
import { fonts } from '../theme/fonts'

const BUBBLE_MAX_W = 280

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

function formatDay(iso) {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function isSameDay(a, b) {
  if (!a || !b) return false
  const da = new Date(a), db = new Date(b)
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate()
}

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
// Màn chat dành cho khách hàng — tương ứng ChatWidget.jsx bên web.
// Khách hàng chỉ có 1 hội thoại duy nhất với shop (không có danh sách).
// ────────────────────────────────────────────────────────────────────
export default function CustomerChatScreen() {
  const { isGuest } = useAuth()
  const navigation = useNavigation()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [pendingImage, setPendingImage] = useState(null) // { uri, fileName, mimeType, url, uploading }
  const [reconnecting, setReconnecting] = useState(false)
  const flatListRef = useRef(null)

  // ── Kết nối + load tin nhắn (Chỉ chạy khi ĐÃ ĐĂNG NHẬP) ──
  useEffect(() => {
    if (isGuest) return
    let cancelled = false

    const handleReceive = (msg) => {
      setMessages((prev) => [...prev, msg])
    }

    chatService.getMyConversation()
      .then((data) => { if (!cancelled) setMessages(data?.messages || []) })
      .catch((err) => Toast.show({ type: 'error', text1: err.message || 'Không tải được cuộc trò chuyện' }))
      .finally(() => { if (!cancelled) setLoading(false) })

    chatService.on('ReceiveMessage', handleReceive)
    chatService.connect().catch(() => Toast.show({ type: 'error', text1: 'Mất kết nối trò chuyện trực tiếp' }))
    chatService.onReconnecting(() => setReconnecting(true))
    chatService.onReconnected(() => setReconnecting(false))
    chatService.onClose(() => setReconnecting(true))

    return () => {
      cancelled = true
      chatService.off('ReceiveMessage', handleReceive)
    }
  }, [isGuest])

  // ── Auto scroll khi có tin nhắn mới ──
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => flatListRef.current?.scrollToEnd?.({ animated: true }), 100)
    }
  }, [messages])

  // ── Gợi ý đăng nhập nếu là Guest ──
  if (isGuest) {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <LinearGradient colors={['#C1440E', '#9B360B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.header}>
          <View style={s.headerAvatar}>
            <Text style={s.headerAvatarText}>🏪</Text>
          </View>
          <View style={s.headerInfo}>
            <Text style={s.headerTitle}>Hỗ trợ trực tuyến</Text>
            <Text style={s.headerSub}>Lý Sáu Shop • Luôn sẵn sàng hỗ trợ</Text>
          </View>
        </LinearGradient>
        <View style={s.guestWrap}>
          <Text style={s.guestIcon}>💬</Text>
          <Text style={s.guestTitle}>Đăng nhập để Chat</Text>
          <Text style={s.guestSub}>
            Vui lòng đăng nhập tài khoản khách hàng để nhắn tin và nhận tư vấn trực tiếp từ cửa hàng.
          </Text>
          <TouchableOpacity style={s.loginBtn} onPress={() => navigation.navigate('Login')} activeOpacity={0.8}>
            <Text style={s.loginBtnText}>Đăng nhập ngay</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  // ── Gửi tin nhắn ──
  const handleSend = async () => {
    const text = input.trim()
    const img = pendingImage
    if ((!text && !img) || sending || img?.uploading) return
    setSending(true)
    setInput('')
    setPendingImage(null)
    try {
      await chatService.sendMessage(text || null, img?.url || null)
    } catch (err) {
      setInput(text)
      if (img) setPendingImage(img)
      Toast.show({ type: 'error', text1: err.message || 'Gửi tin nhắn thất bại' })
    }
    setSending(false)
  }

  // ── Chọn ảnh ──
  const handlePickImage = async () => {
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

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      {/* ── Header ── */}
      <LinearGradient colors={['#C1440E', '#9B360B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.header}>
        <View style={s.headerAvatar}>
          <Text style={s.headerAvatarText}>🏪</Text>
        </View>
        <View style={s.headerInfo}>
          <Text style={s.headerTitle}>Hỗ trợ trực tuyến</Text>
          <Text style={s.headerSub}>Lý Sáu Shop • Luôn sẵn sàng hỗ trợ</Text>
        </View>
      </LinearGradient>

      {reconnecting && (
        <View style={s.reconnectBanner}>
          <ActivityIndicator size="small" color="#B45309" />
          <Text style={s.reconnectBannerText}>Đang kết nối lại...</Text>
        </View>
      )}

      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
        {loading ? (
          <View style={s.loaderWrap}>
            <ActivityIndicator size="large" color={brand.primary} />
            <Text style={s.loaderText}>Đang tải tin nhắn...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, index) => String(item.id || index)}
            contentContainerStyle={s.msgList}
            initialNumToRender={15}
            maxToRenderPerBatch={10}
            windowSize={7}
            renderItem={({ item, index }) => {
              const isMe = !item.isFromAdmin
              const prev = messages[index - 1]
              const showDate = !prev || !isSameDay(prev.createdAt, item.createdAt)
              return (
                <View>
                  {showDate && <DateSeparator date={item.createdAt} />}
                  <View style={[s.bubbleWrap, isMe ? s.bubbleWrapMe : s.bubbleWrapThem]}>
                    <View style={[s.bubble, isMe ? s.bubbleMe : s.bubbleThem]}>
                      {!!item.imageUrl && (
                        <Image
                          source={{ uri: resolveMediaUrl(item.imageUrl) }}
                          style={s.msgImage}
                          contentFit="cover"
                          cachePolicy="disk"
                        />
                      )}
                      {!!item.content && (
                        <Text style={isMe ? s.bubbleTextMe : s.bubbleTextThem}>{item.content}</Text>
                      )}
                      <Text style={isMe ? s.bubbleTimeMe : s.bubbleTimeThem}>
                        {formatTime(item.createdAt)}
                      </Text>
                    </View>
                  </View>
                </View>
              )
            }}
            ListEmptyComponent={
              <View style={s.emptyWrap}>
                <Text style={s.emptyIcon}>👋</Text>
                <Text style={s.emptyTitle}>Xin chào!</Text>
                <Text style={s.emptyText}>
                  Hãy gửi câu hỏi hoặc nhu cầu mua vật liệu của bạn, cửa hàng sẽ phản hồi ngay!
                </Text>
              </View>
            }
          />
        )}

        {/* ── Pending image preview ── */}
        <PendingImageBar image={pendingImage} onRemove={removePendingImage} />

        {/* ── Input row ── */}
        <View style={s.inputRow}>
          <TouchableOpacity style={s.attachBtn} onPress={handlePickImage} activeOpacity={0.7} hitSlop={6} accessibilityLabel="Đính kèm ảnh">
            <Text style={s.attachIcon}>📎</Text>
          </TouchableOpacity>
          <TextInput
            style={s.input}
            value={input}
            onChangeText={setInput}
            placeholder="Nhập tin nhắn..."
            placeholderTextColor={brand.textMuted}
            multiline
          />
          <TouchableOpacity
            style={[s.sendBtn, (sending || (!input.trim() && !pendingImage) || pendingImage?.uploading) && s.sendBtnDisabled]}
            onPress={handleSend}
            disabled={sending || (!input.trim() && !pendingImage) || pendingImage?.uploading}
            hitSlop={6}
            accessibilityLabel="Gửi tin nhắn"
          >
            <LinearGradient
              colors={(sending || (!input.trim() && !pendingImage)) ? ['#c5cdd8', '#b0b8c4'] : ['#C1440E', '#9B360B']}
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

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: brand.bg },
  flex: { flex: 1 },

  reconnectBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#FEF3C7', paddingVertical: 6,
  },
  reconnectBannerText: { fontFamily: fonts.bodySemiBold, fontSize: 11.5, color: '#B45309' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  headerAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerAvatarText: { fontSize: 20 },
  headerInfo: { flex: 1 },
  headerTitle: { color: '#fff', fontFamily: fonts.displayBold, fontSize: 16 },
  headerSub: { color: 'rgba(255,255,255,0.8)', fontFamily: fonts.body, fontSize: 11.5, marginTop: 1 },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loaderText: { color: brand.textMuted, fontFamily: fonts.body, fontSize: 13, marginTop: 10 },

  // ── Guest view ──
  guestWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  guestIcon: { fontSize: 54, marginBottom: 14 },
  guestTitle: { fontFamily: fonts.displayBold, fontSize: 22, color: brand.text, marginBottom: 8 },
  guestSub: { fontFamily: fonts.body, fontSize: 14, color: brand.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  loginBtn: { backgroundColor: brand.primary, paddingHorizontal: 28, paddingVertical: 13, borderRadius: 12 },
  loginBtnText: { color: '#fff', fontFamily: fonts.displayBold, fontSize: 15 },

  msgList: { paddingHorizontal: 12, paddingVertical: 14 },
  bubbleWrap: { marginVertical: 3, flexDirection: 'row' },
  bubbleWrapMe: { justifyContent: 'flex-end' },
  bubbleWrapThem: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: BUBBLE_MAX_W, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3,
  },
  bubbleMe: { backgroundColor: brand.primary, borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: '#fff', borderWidth: 1, borderColor: brand.cardBorder, borderBottomLeftRadius: 4 },
  msgImage: { width: 220, height: 150, borderRadius: 10, marginBottom: 6 },
  bubbleTextMe: { color: '#fff', fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  bubbleTextThem: { color: brand.text, fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  bubbleTimeMe: { color: 'rgba(255,255,255,0.65)', fontFamily: fonts.body, fontSize: 10, marginTop: 4, textAlign: 'right' },
  bubbleTimeThem: { color: brand.textFaint, fontFamily: fonts.body, fontSize: 10, marginTop: 4, textAlign: 'right' },

  // ── Date separator ──
  dateSepRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 14, paddingHorizontal: 8 },
  dateSepLine: { flex: 1, height: 1, backgroundColor: brand.cardBorder },
  dateSepPill: {
    backgroundColor: brand.card, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 4, marginHorizontal: 10,
  },
  dateSepText: { fontFamily: fonts.body, fontSize: 11, color: brand.textMuted },

  // ── Empty state ──
  emptyWrap: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 44, marginBottom: 12 },
  emptyTitle: { fontFamily: fonts.displayBold, fontSize: 20, color: brand.text, marginBottom: 6 },
  emptyText: { fontFamily: fonts.body, fontSize: 13.5, color: brand.textMuted, textAlign: 'center', lineHeight: 20 },

  // ── Pending image bar ──
  pendingBar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: brand.cardBorder, backgroundColor: brand.card,
  },
  pendingThumb: { width: 56, height: 56, borderRadius: 10 },
  pendingOverlay: {
    position: 'absolute', left: 12, top: 8, width: 56, height: 56, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center',
  },
  pendingRemoveBtn: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: '#ef4444',
    alignItems: 'center', justifyContent: 'center', marginLeft: 10,
  },
  pendingRemoveText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // ── Input row ──
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 10, paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: brand.cardBorder, backgroundColor: '#fff',
  },
  attachBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: brand.card, alignItems: 'center', justifyContent: 'center',
  },
  attachIcon: { fontSize: 18 },
  input: {
    flex: 1, maxHeight: 100, paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 22, backgroundColor: brand.bg,
    fontSize: 14, color: brand.text, fontFamily: fonts.body,
  },
  sendBtn: { width: 40, height: 40 },
  sendBtnDisabled: { opacity: 0.6 },
  sendBtnGradient: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnText: { color: '#fff', fontSize: 16, marginLeft: 2 },
})
