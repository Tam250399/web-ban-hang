import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator, FlatList, KeyboardAvoidingView, Platform,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import { chatService } from '../services/chatService'
import { admin } from '../theme/colors'
import { fonts } from '../theme/fonts'

function formatDay(iso) {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

// Chat với khách hàng dành cho Admin — tương ứng ChatManager.jsx bên web.
// Chưa hỗ trợ gửi ảnh (uploadService chưa được thêm vào mobile), chỉ nhắn tin văn bản.
export default function AdminChatScreen() {
  const [conversations, setConversations] = useState([])
  const [loadingList, setLoadingList] = useState(true)
  const [search, setSearch] = useState('')
  const [activeId, setActiveId] = useState(null)
  const [messages, setMessages] = useState([])
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const activeIdRef = useRef(null)
  useEffect(() => { activeIdRef.current = activeId }, [activeId])

  const loadConversations = useCallback(() => {
    chatService.getConversations()
      .then(setConversations)
      .catch(() => {})
      .finally(() => setLoadingList(false))
  }, [])

  useEffect(() => {
    chatService.connect().catch(() => {})
    loadConversations()

    const handleReceive = (msg) => {
      if (msg.conversationId === activeIdRef.current) {
        setMessages((prev) => [...prev, msg])
      }
      loadConversations()
    }
    chatService.on('ReceiveMessage', handleReceive)

    return () => {
      chatService.off('ReceiveMessage', handleReceive)
      if (activeIdRef.current) chatService.leaveConversation(activeIdRef.current).catch(() => {})
    }
  }, [loadConversations])

  const openConversation = async (id) => {
    if (activeId) chatService.leaveConversation(activeId).catch(() => {})
    setActiveId(id)
    setMessages([])
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

  const closeConversation = () => {
    if (activeId) chatService.leaveConversation(activeId).catch(() => {})
    setActiveId(null)
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || sending || !activeId) return
    setSending(true)
    setInput('')
    try {
      await chatService.replyToConversation(activeId, text, null)
    } catch (err) {
      setInput(text)
      Toast.show({ type: 'error', text1: err.message || 'Gửi tin nhắn thất bại' })
    }
    setSending(false)
  }

  const active = conversations.find((c) => c.id === activeId)
  const filtered = conversations.filter((c) => c.customerName?.toLowerCase().includes(search.trim().toLowerCase()))

  if (activeId) {
    return (
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.threadHeader}>
          <TouchableOpacity onPress={closeConversation} style={styles.backBtn}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <View style={styles.threadHeaderInfo}>
            <Text style={styles.threadHeaderName} numberOfLines={1}>{active?.customerName || 'Khách hàng'}</Text>
            {active?.isOnline && <Text style={styles.onlineText}>● Đang online</Text>}
          </View>
        </View>

        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
          {loadingMsgs ? (
            <ActivityIndicator style={styles.loader} color={admin.primary} />
          ) : (
            <FlatList
              data={messages}
              keyExtractor={(m) => String(m.id)}
              contentContainerStyle={styles.messageList}
              renderItem={({ item }) => (
                <View style={[styles.bubbleRow, item.fromAdmin ? styles.bubbleRowMe : styles.bubbleRowThem]}>
                  <View style={[styles.bubble, item.fromAdmin ? styles.bubbleMe : styles.bubbleThem]}>
                    {!!item.content && (
                      <Text style={item.fromAdmin ? styles.bubbleTextMe : styles.bubbleTextThem}>{item.content}</Text>
                    )}
                    <Text style={item.fromAdmin ? styles.bubbleTimeMe : styles.bubbleTimeThem}>{formatTime(item.sentAt)}</Text>
                  </View>
                </View>
              )}
            />
          )}

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Nhập trả lời..."
              placeholderTextColor={admin.textMuted}
              editable={!sending}
              multiline
            />
            <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={sending || !input.trim()}>
              <Text style={styles.sendBtnText}>➤</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Text style={styles.heading}>Chat với khách hàng</Text>
      <TextInput
        style={styles.search}
        placeholder="Tìm theo tên khách hàng..."
        placeholderTextColor={admin.textMuted}
        value={search}
        onChangeText={setSearch}
      />

      {loadingList ? (
        <ActivityIndicator style={styles.loader} color={admin.primary} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(c) => String(c.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.convRow} onPress={() => openConversation(item.id)}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(item.customerName || '?')[0].toUpperCase()}</Text>
                {item.isOnline && <View style={styles.onlineDot} />}
              </View>
              <View style={styles.convInfo}>
                <View style={styles.convTop}>
                  <Text style={styles.convName} numberOfLines={1}>{item.customerName}</Text>
                  <Text style={styles.convDate}>{item.lastMessageAt ? formatDay(item.lastMessageAt) : ''}</Text>
                </View>
                <View style={styles.convBottom}>
                  <Text style={styles.convPreview} numberOfLines={1}>{item.lastMessage || 'Chưa có tin nhắn'}</Text>
                  {item.unreadCount > 0 && (
                    <View style={styles.unreadBadge}><Text style={styles.unreadBadgeText}>{item.unreadCount}</Text></View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.empty}>Chưa có hội thoại nào</Text>}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: admin.bg },
  flex: { flex: 1 },
  heading: { fontFamily: fonts.adminDisplayBold, fontSize: 16, color: admin.text, paddingHorizontal: 16, paddingTop: 16 },
  search: {
    marginHorizontal: 16, marginTop: 12, paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: admin.border, borderRadius: 8, backgroundColor: admin.card,
    fontSize: 12.5, color: admin.text, fontFamily: fonts.adminBody,
  },
  loader: { marginTop: 40 },
  list: { padding: 16, gap: 8 },
  convRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: admin.card, borderWidth: 1, borderColor: admin.border, borderRadius: 10, padding: 11,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: admin.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: admin.white, fontFamily: fonts.adminDisplayBold, fontSize: 15 },
  onlineDot: {
    position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#22c55e', borderWidth: 1.5, borderColor: admin.card,
  },
  convInfo: { flex: 1, minWidth: 0 },
  convTop: { flexDirection: 'row', justifyContent: 'space-between' },
  convName: { flex: 1, fontFamily: fonts.adminBodySemiBold, fontSize: 13, color: admin.text },
  convDate: { fontFamily: fonts.adminBody, fontSize: 10.5, color: admin.textMuted },
  convBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  convPreview: { flex: 1, fontFamily: fonts.adminBody, fontSize: 11.5, color: admin.textMuted },
  unreadBadge: { minWidth: 18, height: 18, borderRadius: 9, backgroundColor: admin.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  unreadBadgeText: { color: admin.white, fontFamily: fonts.adminBodyBold, fontSize: 10 },
  empty: { textAlign: 'center', marginTop: 40, color: admin.textMuted, fontFamily: fonts.adminBody, fontSize: 13 },

  threadHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: admin.divider,
  },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { fontSize: 18, color: admin.text },
  threadHeaderInfo: { flex: 1, minWidth: 0 },
  threadHeaderName: { fontFamily: fonts.adminBodySemiBold, fontSize: 14, color: admin.text },
  onlineText: { fontFamily: fonts.adminBody, fontSize: 10.5, color: '#22c55e' },
  messageList: { padding: 12, gap: 8 },
  bubbleRow: { flexDirection: 'row' },
  bubbleRowMe: { justifyContent: 'flex-end' },
  bubbleRowThem: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '78%', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
  bubbleMe: { backgroundColor: admin.primary, borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: admin.card, borderWidth: 1, borderColor: admin.border, borderBottomLeftRadius: 4 },
  bubbleTextMe: { color: admin.white, fontFamily: fonts.adminBody, fontSize: 13.5 },
  bubbleTextThem: { color: admin.text, fontFamily: fonts.adminBody, fontSize: 13.5 },
  bubbleTimeMe: { color: 'rgba(255,255,255,0.7)', fontFamily: fonts.adminBody, fontSize: 9.5, marginTop: 3, textAlign: 'right' },
  bubbleTimeThem: { color: admin.textMuted, fontFamily: fonts.adminBody, fontSize: 9.5, marginTop: 3, textAlign: 'right' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 10,
    borderTopWidth: 1, borderTopColor: admin.divider, backgroundColor: admin.bg,
  },
  input: {
    flex: 1, maxHeight: 100, paddingHorizontal: 12, paddingVertical: 9,
    borderWidth: 1, borderColor: admin.border, borderRadius: 18, backgroundColor: admin.card,
    fontSize: 13, color: admin.text, fontFamily: fonts.adminBody,
  },
  sendBtn: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: admin.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnText: { color: admin.white, fontSize: 15 },
})
