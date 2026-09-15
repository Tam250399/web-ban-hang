import { useEffect, useState } from 'react'
import {
  ActivityIndicator, Modal, Pressable, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { orderService } from '../../services/orderService'
import { chatService } from '../../services/chatService'
import { admin } from '../../theme/colors'
import { fonts } from '../../theme/fonts'
import { formatVnd, formatTime } from '../../utils/format'
import { Icon, ICON_ROW } from '../ui/Icon'

/**
 * Component AdminNotificationModal
 */
export default function AdminNotificationModal({ visible, onClose, navigation }) {
  const [pendingOrders, setPendingOrders] = useState([])
  const [unreadConversations, setUnreadConversations] = useState([])
  const [readOrderIds, setReadOrderIds] = useState(new Set())
  const [readConvIds, setReadConvIds] = useState(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!visible) return
    setLoading(true)
    Promise.all([
      orderService.getAll('Pending').catch(() => []),
      chatService.getConversations().catch(() => []),
    ]).then(([orders, convs]) => {
      setPendingOrders(orders || [])
      setUnreadConversations((convs || []).filter((c) => c.unreadCount > 0))
    }).finally(() => setLoading(false))
  }, [visible])

  if (!visible) return null

  const hasContent = pendingOrders.length > 0 || unreadConversations.length > 0

  const handlePressOrder = (orderId) => {
    setReadOrderIds((prev) => new Set(prev).add(orderId))
    setPendingOrders((prev) => prev.filter((o) => o.id !== orderId))
    onClose()
    navigation.navigate('Admin', { initialTab: 'orders' })
  }

  const handlePressChat = async (convId) => {
    setReadConvIds((prev) => new Set(prev).add(convId))
    try {
      await chatService.joinConversation(convId)
    } catch {}
    setUnreadConversations((prev) => prev.filter((c) => c.id !== convId))
    onClose()
    navigation.navigate('Cart', { conversationId: convId })
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <SafeAreaProvider>
        <Pressable style={styles.overlay} onPress={onClose}>
          <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Icon name="bell" size={20} color={admin.text} />
                <Text style={styles.headerTitle}>Thông báo mới</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7} hitSlop={8} accessibilityLabel="Đóng">
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loaderWrap}>
                <ActivityIndicator size="small" color={admin.primary} />
                <Text style={styles.loaderText}>Đang tải thông báo...</Text>
              </View>
            ) : (
              <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
                {!hasContent ? (
                  <View style={styles.emptyWrap}>
                    <View style={styles.emptyIcon}>
                      <Icon name="checkRing" size={40} color={admin.textMuted} />
                    </View>
                    <Text style={styles.emptyText}>Không có thông báo mới</Text>
                  </View>
                ) : (
                  <>
                    {pendingOrders.length > 0 && (
                      <View style={styles.section}>
                        <View style={ICON_ROW}>
                          <Icon name="cart" size={14} color={admin.textMuted} />
                          <Text style={styles.sectionTitle}>ĐƠN HÀNG MỚI ({pendingOrders.length})</Text>
                        </View>
                        {pendingOrders.slice(0, 5).map((o) => {
                          const isUnread = !readOrderIds.has(o.id)
                          return (
                            <TouchableOpacity
                              key={o.id}
                              style={[styles.itemCard, isUnread && styles.itemCardUnreadOrder]}
                              onPress={() => handlePressOrder(o.id)}
                              activeOpacity={0.7}
                            >
                              <View style={styles.itemHeader}>
                                <View style={styles.titleRow}>
                                  {isUnread && <View style={[styles.unreadDot, styles.unreadDotOrder]} />}
                                  <Text style={[styles.itemName, isUnread && styles.itemNameUnread]} numberOfLines={1}>
                                    Đơn #{o.id} • {o.recipientName || 'Khách hàng'}
                                  </Text>
                                </View>
                                <Text style={[styles.itemTime, isUnread && styles.itemTimeUnread]}>
                                  {formatTime(o.createdAt)}
                                </Text>
                              </View>
                              <Text style={[styles.itemSub, isUnread && styles.itemSubUnread]}>
                                Tổng tiền: <Text style={styles.itemPrice}>{formatVnd(o.total)}đ</Text>
                              </Text>
                            </TouchableOpacity>
                          )
                        })}
                      </View>
                    )}

                    {unreadConversations.length > 0 && (
                      <View style={styles.section}>
                        <View style={ICON_ROW}>
                          <Icon name="chat" size={14} color={admin.textMuted} />
                          <Text style={styles.sectionTitle}>TIN NHẮN MỚI ({unreadConversations.length})</Text>
                        </View>
                        {unreadConversations.slice(0, 5).map((c) => {
                          const isUnread = !readConvIds.has(c.id)
                          return (
                            <TouchableOpacity
                              key={c.id}
                              style={[styles.itemCard, isUnread && styles.itemCardUnreadChat]}
                              onPress={() => handlePressChat(c.id)}
                              activeOpacity={0.7}
                            >
                              <View style={styles.itemHeader}>
                                <View style={styles.titleRow}>
                                  {isUnread && <View style={[styles.unreadDot, styles.unreadDotChat]} />}
                                  <Text style={[styles.itemName, isUnread && styles.itemNameUnread]} numberOfLines={1}>
                                    {c.customerName}
                                  </Text>
                                </View>
                                <Text style={[styles.itemTime, isUnread && styles.itemTimeUnread]}>
                                  {formatTime(c.lastMessageAt)}
                                </Text>
                              </View>
                              <Text style={[styles.itemSub, isUnread && styles.itemSubUnread]} numberOfLines={1}>
                                {c.lastMessage || 'Đã gửi một hình ảnh'}
                              </Text>
                            </TouchableOpacity>
                          )
                        })}
                      </View>
                    )}
                  </>
                )}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </SafeAreaProvider>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 18,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontFamily: fonts.adminDisplayBold, fontSize: 18, color: admin.text },
  closeBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { color: '#ef4444', fontSize: 15, fontWeight: '700' },
  body: { padding: 14 },
  loaderWrap: { padding: 36, alignItems: 'center', justifyContent: 'center' },
  loaderText: { fontFamily: fonts.adminBody, fontSize: 14, color: admin.textMuted, marginTop: 10 },
  emptyWrap: { padding: 36, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { marginBottom: 8 },
  emptyText: { fontFamily: fonts.adminBody, fontSize: 15, color: admin.textMuted },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontFamily: fonts.adminBodyBold,
    fontSize: 13.5,
    color: '#2563eb',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  itemCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 13,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  itemCardUnreadOrder: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  itemCardUnreadChat: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  titleRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, marginRight: 8 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  unreadDotOrder: {
    backgroundColor: '#d97706',
  },
  unreadDotChat: {
    backgroundColor: '#2563eb',
  },
  itemName: { flex: 1, fontFamily: fonts.adminBody, fontSize: 14.5, color: '#475569' },
  itemNameUnread: {
    fontFamily: fonts.adminBodyBold,
    fontSize: 15,
    color: '#0f172a',
  },
  itemTime: { fontFamily: fonts.adminBody, fontSize: 12.5, color: '#94a3b8' },
  itemTimeUnread: { fontFamily: fonts.adminBodySemiBold, color: '#475569' },
  itemSub: { fontFamily: fonts.adminBody, fontSize: 13.5, color: '#64748b' },
  itemSubUnread: { fontFamily: fonts.adminBodyMedium, color: '#334155' },
  itemPrice: { fontFamily: fonts.adminBodyBold, color: '#d97706' },
})
