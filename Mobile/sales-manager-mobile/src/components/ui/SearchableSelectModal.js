import { useMemo, useState } from 'react'
import { FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { admin } from '../../theme/colors'
import { fonts } from '../../theme/fonts'

// Modal chọn 1 giá trị có tìm kiếm — tương đương SearchableSelect.jsx bên web,
// dùng cho picker khách hàng/sản phẩm trong các form kho.
export default function SearchableSelectModal({
  visible,
  onClose,
  onSelect,
  options,
  title = 'Chọn',
  searchPlaceholder = 'Tìm kiếm...',
}) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, query])

  const handleSelect = (option) => {
    setQuery('')
    onSelect(option)
    onClose()
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      {/* Modal gốc của RN dựng cây view native riêng nên SafeAreaView bên trong
          không tự lấy được inset đúng — phải bọc thêm SafeAreaProvider mới ở đây. */}
      <SafeAreaProvider>
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.search}
          placeholder={searchPlaceholder}
          placeholderTextColor={admin.textMuted}
          value={query}
          onChangeText={setQuery}
          autoFocus
        />

        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.value)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.row} onPress={() => handleSelect(item)}>
              <Text style={styles.rowText}>{item.label}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.empty}>Không tìm thấy kết quả</Text>}
        />
      </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: admin.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: admin.divider,
  },
  title: { fontFamily: fonts.adminDisplayBold, fontSize: 16, color: admin.text },
  closeBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: '#ef4444', fontSize: 14, fontWeight: '700' },
  search: {
    margin: 16, marginBottom: 8, paddingHorizontal: 14, paddingVertical: 11,
    borderWidth: 1, borderColor: admin.border, borderRadius: 10,
    backgroundColor: admin.card, fontSize: 14, color: admin.text, fontFamily: fonts.adminBody,
  },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  row: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: admin.divider },
  rowText: { fontFamily: fonts.adminBody, fontSize: 14, color: admin.text },
  empty: { textAlign: 'center', marginTop: 40, color: admin.textMuted, fontFamily: fonts.adminBody, fontSize: 13 },
})
