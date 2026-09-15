import { StyleSheet, Text, View } from 'react-native'
import Svg, { Circle, Path } from 'react-native-svg'
import { fonts } from '../../theme/fonts'

function SuccessIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 6L9 17l-5-5" />
    </Svg>
  )
}

function ErrorIcon() {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18 6L6 18M6 6l12 12" />
    </Svg>
  )
}

function InfoIcon() {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={12} r={10} />
      <Path d="M12 16v-4M12 8h.01" />
    </Svg>
  )
}

export const toastConfig = {
  success: ({ text1, text2 }) => (
    <View style={styles.toastContainer}>
      <View style={styles.toastInner}>
        <View style={[styles.accentBar, styles.successAccent]} />
        <View style={[styles.iconWrap, styles.successIconWrap]}>
          <SuccessIcon />
        </View>
        <View style={styles.contentWrap}>
          <Text style={styles.titleText} numberOfLines={2}>{text1}</Text>
          {!!text2 && <Text style={styles.subtitleText} numberOfLines={2}>{text2}</Text>}
        </View>
      </View>
    </View>
  ),
  error: ({ text1, text2 }) => (
    <View style={styles.toastContainer}>
      <View style={styles.toastInner}>
        <View style={[styles.accentBar, styles.errorAccent]} />
        <View style={[styles.iconWrap, styles.errorIconWrap]}>
          <ErrorIcon />
        </View>
        <View style={styles.contentWrap}>
          <Text style={[styles.titleText, styles.errorTitleText]} numberOfLines={2}>{text1}</Text>
          {!!text2 && <Text style={styles.subtitleText} numberOfLines={2}>{text2}</Text>}
        </View>
      </View>
    </View>
  ),
  info: ({ text1, text2 }) => (
    <View style={styles.toastContainer}>
      <View style={styles.toastInner}>
        <View style={[styles.accentBar, styles.infoAccent]} />
        <View style={[styles.iconWrap, styles.infoIconWrap]}>
          <InfoIcon />
        </View>
        <View style={styles.contentWrap}>
          <Text style={styles.titleText} numberOfLines={2}>{text1}</Text>
          {!!text2 && <Text style={styles.subtitleText} numberOfLines={2}>{text2}</Text>}
        </View>
      </View>
    </View>
  ),
}

const styles = StyleSheet.create({
  toastContainer: {
    width: '90%',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },
  toastInner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingLeft: 21,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
  },
  successAccent: { backgroundColor: '#10B981' },
  errorAccent: { backgroundColor: '#EF4444' },
  infoAccent: { backgroundColor: '#2563EB' },

  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  successIconWrap: { backgroundColor: '#D1FAE5' },
  errorIconWrap: { backgroundColor: '#FEE2E2' },
  infoIconWrap: { backgroundColor: '#DBEAFE' },

  contentWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  titleText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14.5,
    color: '#0F172A',
    lineHeight: 21,
  },
  errorTitleText: {
    color: '#991B1B',
  },
  subtitleText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 19,
  },
})
