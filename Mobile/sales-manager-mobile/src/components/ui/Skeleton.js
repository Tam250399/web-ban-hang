import { useEffect, useRef } from 'react'
import { Animated, StyleSheet, View } from 'react-native'

/**
 * Component Skeleton
 */
export function Skeleton({ width, height, radius = 8, style }) {
  const opacity = useRef(new Animated.Value(0.35)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.8, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 700, useNativeDriver: true }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [opacity])

  return (
    <Animated.View
      style={[
        styles.block,
        { width, height, borderRadius: radius, opacity },
        style,
      ]}
    />
  )
}

/**
 * Component ProductCardSkeleton
 */
export function ProductCardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton width="100%" height={105} radius={0} />
      <View style={styles.cardBody}>
        <Skeleton width="45%" height={9} />
        <Skeleton width="90%" height={14} style={styles.gap} />
        <Skeleton width="60%" height={14} style={styles.gap} />
        <Skeleton width="100%" height={32} radius={10} style={styles.gapLarge} />
      </View>
    </View>
  )
}

/**
 * Component OrderCardSkeleton
 */
export function OrderCardSkeleton() {
  return (
    <View style={styles.orderCard}>
      <View style={styles.orderTopRow}>
        <Skeleton width="45%" height={14} />
        <Skeleton width={90} height={24} radius={999} />
      </View>
      <Skeleton width="70%" height={13} style={styles.gap} />
      <Skeleton width="55%" height={13} style={styles.gap} />
      <Skeleton width="35%" height={18} style={styles.gapLarge} />
    </View>
  )
}

const styles = StyleSheet.create({
  block: { backgroundColor: '#CBD5E1' },
  gap: { marginTop: 8 },
  gapLarge: { marginTop: 12 },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardBody: { padding: 12 },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  orderTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
})
