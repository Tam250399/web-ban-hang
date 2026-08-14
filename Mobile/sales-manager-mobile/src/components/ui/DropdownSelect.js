import { useMemo, useState } from 'react'
import {
  FlatList, KeyboardAvoidingView, Modal, Platform,
  Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { admin } from '../../theme/colors'
import { fonts } from '../../theme/fonts'

export default function DropdownSelect({
  value,
  label,
  placeholder = '-- Chọn --',
  options = [],
  onSelect,
  title = 'Chọn',
  searchPlaceholder = 'Tìm kiếm...',
  style,
  textStyle,
  disabled = false,
  error = false,
  errorText = '',
}) {
  const insets = useSafeAreaInsets()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const selectedOption = useMemo(() => {
    return options.find((o) => String(o.value) === String(value))
  }, [options, value])

  const displayLabel = label || selectedOption?.label || ''

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.label?.toLowerCase().includes(q) || String(o.value).toLowerCase().includes(q))
  }, [options, query])

  const handleSelect = (option) => {
    setQuery('')
    setOpen(false)
    onSelect?.(option)
  }

  const handleClose = () => {
    setQuery('')
    setOpen(false)
  }

  return (
    <View style={styles.outerWrap}>
      {/* ── Dropdown Trigger Button ── */}
      <TouchableOpacity
        style={[
          styles.trigger,
          open && styles.triggerOpen,
          disabled && styles.triggerDisabled,
          error && styles.triggerError,
          style,
        ]}
        onPress={() => !disabled && setOpen(true)}
        activeOpacity={0.7}
        disabled={disabled}
      >
        <Text
          style={[
            displayLabel ? styles.valueText : styles.placeholderText,
            error && !displayLabel && styles.placeholderError,
            textStyle,
          ]}
          numberOfLines={1}
        >
          {displayLabel || placeholder}
        </Text>
        <Text style={[styles.chevron, open && styles.chevronOpen, error && styles.chevronError]}>▼</Text>
      </TouchableOpacity>

      {/* Thông báo lỗi bên dưới field */}
      {!!errorText && (
        <Text style={styles.fieldErrorText}>⚠️ {errorText}</Text>
      )}

      {/* ── Dropdown Modal (Bottom Sheet Menu) ── */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <Pressable style={styles.overlay} onPress={handleClose}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardWrap}
          >
            <Pressable style={[styles.dropdownContainer, { paddingBottom: Math.max(insets.bottom, 16) }]} onPress={(e) => e.stopPropagation()}>
              {/* Header */}
              <View style={styles.dropdownHeader}>
                <View style={styles.headerIndicator} />
                <View style={styles.headerTitleRow}>
                  <Text style={styles.dropdownTitle}>{title}</Text>
                  <TouchableOpacity onPress={handleClose} style={styles.closeBtn} activeOpacity={0.7}>
                    <Text style={styles.closeBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Ô tìm kiếm */}
              {options.length > 5 && (
                <View style={styles.searchWrap}>
                  <Text style={styles.searchIcon}>🔍</Text>
                  <TextInput
                    style={styles.searchInput}
                    placeholder={searchPlaceholder}
                    placeholderTextColor={admin.textMuted}
                    value={query}
                    onChangeText={setQuery}
                    clearButtonMode="while-editing"
                    autoCorrect={false}
                  />
                </View>
              )}

              {/* Danh sách options */}
              <FlatList
                data={filtered}
                keyExtractor={(item) => String(item.value)}
                contentContainerStyle={styles.listContent}
                keyboardShouldPersistTaps="handled"
                style={styles.list}
                renderItem={({ item }) => {
                  const isSelected = String(item.value) === String(value)
                  return (
                    <TouchableOpacity
                      style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                      onPress={() => handleSelect(item)}
                      activeOpacity={0.65}
                    >
                      <Text style={[styles.optionText, isSelected && styles.optionTextSelected]} numberOfLines={2}>
                        {item.label}
                      </Text>
                      {isSelected && <Text style={styles.checkIcon}>✓</Text>}
                    </TouchableOpacity>
                  )
                }}
                ListEmptyComponent={
                  <View style={styles.emptyWrap}>
                    <Text style={styles.emptyText}>Không tìm thấy kết quả phù hợp</Text>
                  </View>
                }
              />
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  outerWrap: {
    width: '100%',
    gap: 4,
  },
  trigger: {
    height: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: admin.border,
    borderRadius: 8,
    backgroundColor: admin.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  triggerOpen: {
    borderColor: admin.primary,
    backgroundColor: admin.card,
  },
  triggerDisabled: {
    opacity: 0.5,
  },
  triggerError: {
    borderColor: '#EF4444',
    backgroundColor: '#FFF5F5',
  },
  valueText: {
    flex: 1,
    fontFamily: fonts.adminBody,
    fontSize: 13,
    color: admin.text,
  },
  placeholderText: {
    flex: 1,
    fontFamily: fonts.adminBody,
    fontSize: 13,
    color: admin.textMuted,
  },
  placeholderError: {
    color: '#EF4444',
  },
  chevron: {
    fontSize: 10,
    color: admin.textMuted,
    fontFamily: fonts.adminBodyBold,
  },
  chevronOpen: {
    transform: [{ rotate: '180deg' }],
    color: admin.primary,
  },
  chevronError: {
    color: '#EF4444',
  },
  fieldErrorText: {
    fontFamily: fonts.adminBodyBold,
    fontSize: 11,
    color: '#EF4444',
    paddingLeft: 2,
  },

  // Modal / Bottom Sheet
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  keyboardWrap: {
    width: '100%',
    maxHeight: '80%',
  },
  dropdownContainer: {
    backgroundColor: admin.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: 520,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  dropdownHeader: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: admin.divider,
    alignItems: 'center',
  },
  headerIndicator: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    marginBottom: 8,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  dropdownTitle: {
    fontFamily: fonts.adminDisplayBold,
    fontSize: 15,
    color: admin.text,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '700',
  },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: admin.border,
    borderRadius: 8,
    backgroundColor: admin.bg,
    gap: 8,
  },
  searchIcon: {
    fontSize: 13,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: admin.text,
    fontFamily: fonts.adminBody,
    paddingVertical: 0,
  },

  list: {
    maxHeight: 340,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: admin.divider,
  },
  optionRowSelected: {
    backgroundColor: admin.manualBadgeBg,
    borderRadius: 8,
    borderColor: 'transparent',
  },
  optionText: {
    flex: 1,
    fontFamily: fonts.adminBody,
    fontSize: 13.5,
    color: admin.text,
  },
  optionTextSelected: {
    fontFamily: fonts.adminBodyBold,
    color: admin.primary,
  },
  checkIcon: {
    fontSize: 15,
    color: admin.primary,
    fontFamily: fonts.adminBodyBold,
    marginLeft: 8,
  },
  emptyWrap: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: admin.textMuted,
    fontFamily: fonts.adminBody,
    fontSize: 13,
  },
})
