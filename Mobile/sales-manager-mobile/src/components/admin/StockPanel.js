import { useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import StockImportPanel from './StockImportPanel'
import StockExportPanel from './StockExportPanel'
import { admin } from '../../theme/colors'
import { fonts } from '../../theme/fonts'

const STOCK_SUB_TABS = [
  { id: 'import', label: '📥 Nhập kho' },
  { id: 'export', label: '📤 Xuất kho' },
]

export default function StockPanel() {
  const [stockSub, setStockSub] = useState('export')

  return (
    <View style={styles.root}>
      <Text style={styles.heading}>Quản lý nhập / xuất kho</Text>

      <View style={styles.subTabs}>
        {STOCK_SUB_TABS.map((tab) => {
          const active = tab.id === stockSub
          return (
            <TouchableOpacity key={tab.id} style={styles.subTab} onPress={() => setStockSub(tab.id)}>
              <Text style={[styles.subTabText, active && styles.subTabTextActive]}>{tab.label}</Text>
              {active && <View style={styles.subTabUnderline} />}
            </TouchableOpacity>
          )
        })}
      </View>

      <View style={styles.content}>
        {stockSub === 'import' ? <StockImportPanel /> : <StockExportPanel />}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  heading: { fontFamily: fonts.adminDisplayBold, fontSize: 16, color: admin.text, paddingHorizontal: 16, paddingTop: 16 },
  subTabs: { flexDirection: 'row', gap: 16, borderBottomWidth: 1, borderBottomColor: admin.divider, paddingHorizontal: 16, marginTop: 12 },
  subTab: { paddingBottom: 10 },
  subTabText: { fontFamily: fonts.adminBody, fontSize: 13, color: admin.textMuted },
  subTabTextActive: { fontFamily: fonts.adminBodySemiBold, color: admin.text },
  subTabUnderline: { height: 2, backgroundColor: admin.primary, marginTop: 10, borderRadius: 1 },
  content: { flex: 1 },
})
