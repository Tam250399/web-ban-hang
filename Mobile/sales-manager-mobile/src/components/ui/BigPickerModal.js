import { useMemo, useState } from 'react'
import {
  FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fonts } from '../../theme/fonts'

// Bộ chọn toàn màn hình, chữ to - nút to, dành cho người lớn tuổi.
// Mỗi dòng cao tối thiểu 72px, tên hiển thị 18px, thông tin phụ 14px.
// data: [{ value, label, sublabel, note, picked }]
export default function BigPickerModal({
  visible,
  title = 'Chọn',
  hint = '',
  searchPlaceholder = 'Gõ để tìm nhanh...',
  data = [],
  onSelect,
  onClose,
  emptyText = 'Không tìm thấy kết quả nào',
}) {
  const insets = useSafeAreaInsets()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return data
    return data.filter(
      (o) =>
        o.label?.toLowerCase().includes(q) ||
        o.sublabel?.toLowerCase().includes(q) ||
        String(o.value).toLowerCase().includes(q)
    )
  }, [data, query])

  const handleClose = () => {
    setQuery('')
    onClose?.()
  }

  const handleSelect = (item) => {
    setQuery('')
    onSelect?.(item)
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={[styles.root, { paddingTop: insets.top }]}>
        {/* ── Thanh tiêu đề ── */}
        <View style={styles.header}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>{title}</Text>
            {!!hint && <Text style={styles.hint}>{hint}</Text>}
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={handleClose} activeOpacity={0.7}>
            <Text style={styles.closeBtnText}>✕  Đóng</Text>
          </TouchableOpacity>
        </View>

        {/* ── Ô tìm kiếm ── */}
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={searchPlaceholder}
            placeholderTextColor="#94A3B8"
            value={query}
            onChangeText={setQuery}
            clearButtonMode="while-editing"
            autoCorrect={false}
          />
          {!!query && (
            <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn} activeOpacity={0.7}>
              <Text style={styles.clearBtnText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Danh sách ── */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.value)}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 24 }]}
          initialNumToRender={12}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.row} onPress={() => handleSelect(item)} activeOpacity={0.6}>
              <View style={styles.rowTextWrap}>
                <Text style={styles.rowLabel} numberOfLines={2}>{item.label}</Text>
                {!!item.sublabel && <Text style={styles.rowSub} numberOfLines={1}>{item.sublabel}</Text>}
                {!!item.note && <Text style={styles.rowNote} numberOfLines={1}>{item.note}</Text>}
              </View>
              {item.picked ? (
                <View style={styles.pickedBadge}>
                  <Text style={styles.pickedBadgeText}>Đã chọn</Text>
                </View>
              ) : (
                <Text style={styles.rowChevron}>›</Text>
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>🔎</Text>
              <Text style={styles.emptyText}>{emptyText}</Text>
            </View>
          }
        />
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTextWrap: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.adminDisplayBold, fontSize: 21, color: '#0F172A' },
  hint: { fontFamily: fonts.adminBody, fontSize: 15, color: '#64748B' },
  closeBtn: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { fontFamily: fonts.adminBodyBold, fontSize: 17, color: '#DC2626' },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 14,
    paddingHorizontal: 14,
    height: 58,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
  },
  searchIcon: { fontSize: 18 },
  searchInput: {
    flex: 1,
    fontSize: 18,
    color: '#0F172A',
    fontFamily: fonts.adminBodyMedium,
    paddingVertical: 0,
  },
  clearBtn: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: '#E2E8F0',
    alignItems: 'center', justifyContent: 'center',
  },
  clearBtnText: { fontSize: 15, color: '#475569', fontFamily: fonts.adminBodyBold },

  listContent: { paddingHorizontal: 16, paddingTop: 12, gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 76,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  rowTextWrap: { flex: 1, gap: 3 },
  rowLabel: { fontFamily: fonts.adminBodyBold, fontSize: 18, color: '#0F172A', lineHeight: 24 },
  rowSub: { fontFamily: fonts.adminBodyMedium, fontSize: 16, color: '#475569' },
  rowNote: { fontFamily: fonts.adminBody, fontSize: 15, color: '#64748B' },
  rowChevron: { fontSize: 30, color: '#94A3B8', fontFamily: fonts.adminBodyBold, marginTop: -4 },
  pickedBadge: {
    backgroundColor: '#DCFCE7', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
  },
  pickedBadgeText: { fontFamily: fonts.adminBodyBold, fontSize: 15, color: '#15803D' },

  emptyWrap: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontFamily: fonts.adminBodyMedium, fontSize: 18, color: '#64748B', textAlign: 'center' },
})
