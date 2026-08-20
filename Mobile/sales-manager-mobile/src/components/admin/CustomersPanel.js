import { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import Toast from 'react-native-toast-message'
import { customerService } from '../../services/customerService'
import CustomerFormModal from './CustomerFormModal'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { admin } from '../../theme/colors'
import { fonts } from '../../theme/fonts'

const PAGE_SIZE = 15

export default function CustomersPanel() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 250)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)

  const load = useCallback((isRefresh) => {
    isRefresh ? setRefreshing(true) : setLoading(true)
    customerService.getAll()
      .then((data) => {
        setCustomers(data || [])
        setVisibleCount(PAGE_SIZE)
      })
      .catch((err) => Toast.show({ type: 'error', text1: err.message || 'Không tải được danh sách khách hàng' }))
      .finally(() => { setLoading(false); setRefreshing(false) })
  }, [])

  useEffect(() => { load(false) }, [load])

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [debouncedSearch])

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    if (!q) return customers
    return customers.filter((c) => c.fullName?.toLowerCase().includes(q) || c.phoneNumber?.includes(q))
  }, [customers, debouncedSearch])

  const displayedCustomers = filtered.slice(0, visibleCount)
  const hasMore = displayedCustomers.length < filtered.length

  const handleEndReached = () => {
    if (!hasMore) return
    setVisibleCount((prev) => prev + PAGE_SIZE)
  }

  const openAdd = () => { setEditingCustomer(null); setModalOpen(true) }
  const openEdit = (customer) => { setEditingCustomer(customer); setModalOpen(true) }
  const closeModal = () => setModalOpen(false)
  const handleSaved = () => { setModalOpen(false); load(false) }

  const handleDelete = (customer) => {
    Alert.alert(
      'Xóa khách hàng',
      `Bạn có chắc muốn xóa khách hàng "${customer.fullName}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa', style: 'destructive', onPress: async () => {
            try {
              await customerService.remove(customer.id)
              Toast.show({ type: 'success', text1: 'Đã xóa khách hàng' })
              load(false)
            } catch (err) {
              Toast.show({ type: 'error', text1: err.message || 'Xóa thất bại' })
            }
          },
        },
      ]
    )
  }

  return (
    <View style={styles.root}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Khách hàng</Text>
        <View style={styles.countBadge}><Text style={styles.countBadgeText}>{filtered.length}</Text></View>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.search}
          placeholder="Tìm theo họ tên hoặc số điện thoại..."
          placeholderTextColor={admin.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Text style={styles.addBtnText}>+ Thêm</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={admin.primary} />
      ) : (
        <FlatList
          data={displayedCustomers}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={() => load(true)}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.name} numberOfLines={1}>{item.fullName}</Text>
                <View style={[styles.badge, item.isBusiness ? styles.badgeBusiness : styles.badgePersonal]}>
                  <Text style={styles.badgeText}>{item.isBusiness ? 'Doanh nghiệp' : 'Cá nhân'}</Text>
                </View>
              </View>
              <Text style={styles.meta}>{item.phoneNumber}</Text>
              {!!item.address && <Text style={styles.meta}>{item.address}</Text>}
              <View style={styles.actions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(item)}>
                  <Text style={styles.actionText}>Sửa</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDelete(item)}>
                  <Text style={styles.deleteText}>Xóa</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListFooterComponent={
            hasMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={admin.primary} />
              </View>
            ) : null
          }
          ListEmptyComponent={<Text style={styles.empty}>Chưa có khách hàng nào</Text>}
        />
      )}

      <CustomerFormModal
        visible={modalOpen}
        customer={editingCustomer}
        onClose={closeModal}
        onSaved={handleSaved}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 16 },
  heading: { fontFamily: fonts.adminDisplayBold, fontSize: 17, color: admin.text },
  countBadge: { backgroundColor: admin.manualBadgeBg, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  countBadgeText: { fontFamily: fonts.adminBodySemiBold, fontSize: 12.5, color: admin.textMuted },
  searchRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 12 },
  search: {
    flex: 1, paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: admin.border, borderRadius: 8, backgroundColor: admin.card,
    fontSize: 13.5, color: admin.text, fontFamily: fonts.adminBody,
  },
  addBtn: { paddingHorizontal: 14, paddingVertical: 9, backgroundColor: admin.primary, borderRadius: 8, justifyContent: 'center' },
  addBtnText: { color: admin.white, fontFamily: fonts.adminBodySemiBold, fontSize: 13.5 },
  loader: { marginTop: 40 },
  list: { padding: 16, gap: 10 },
  card: { backgroundColor: admin.card, borderWidth: 1, borderColor: admin.border, borderRadius: 10, padding: 13 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 },
  name: { flex: 1, fontFamily: fonts.adminBodySemiBold, fontSize: 14.5, color: admin.text },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeBusiness: { backgroundColor: admin.onlineBadgeBg },
  badgePersonal: { backgroundColor: admin.manualBadgeBg },
  badgeText: { fontFamily: fonts.adminBodySemiBold, fontSize: 12, color: admin.textMuted },
  meta: { fontFamily: fonts.adminBody, fontSize: 13, color: admin.textMuted, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 6, marginTop: 10 },
  actionBtn: {
    flex: 1, paddingVertical: 6, borderWidth: 1, borderColor: admin.border,
    backgroundColor: admin.card, borderRadius: 7, alignItems: 'center',
  },
  actionText: { fontFamily: fonts.adminBodySemiBold, fontSize: 12.5, color: admin.text },
  deleteBtn: { borderColor: admin.dangerBorder, backgroundColor: admin.dangerBg },
  deleteText: { fontFamily: fonts.adminBodySemiBold, fontSize: 12.5, color: admin.dangerText },
  empty: { textAlign: 'center', marginTop: 40, color: admin.textMuted, fontFamily: fonts.adminBody, fontSize: 14 },
  footerLoader: { alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
})
