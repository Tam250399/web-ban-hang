import { useEffect, useRef, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Image } from 'expo-image'
import PagerView from 'react-native-pager-view'
import { resolveMediaUrl } from '../../services/config'
import { fonts } from '../../theme/fonts'

const AUTO_PLAY_MS = 5000
const BLURHASH = 'L5H2EC=PM+yV0g-mq.wG9c010J}I'

/**
 * Component BannerCarousel
 */
export default function BannerCarousel({ banners }) {
  const [index, setIndex] = useState(0)
  const pagerRef = useRef(null)

  useEffect(() => {
    if (banners.length <= 1) return
    const timer = setInterval(() => {
      const next = (index + 1) % banners.length
      pagerRef.current?.setPage(next)
    }, AUTO_PLAY_MS)
    return () => clearInterval(timer)
  }, [index, banners.length])

  if (!banners.length) return null

  return (
    <View style={styles.root}>
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        onPageSelected={(e) => setIndex(e.nativeEvent.position)}
      >
        {banners.map((slide, i) => (
          <View key={slide.id ?? i} style={styles.slide}>
            <Image
              source={{
                uri: resolveMediaUrl(slide.imageUrl),
                headers: { Accept: 'image/webp,image/*;q=0.8' },
              }}
              style={styles.image}
              contentFit="cover"
              placeholder={{ blurhash: BLURHASH }}
              transition={200}
              cachePolicy="memory-disk"
              priority={i === 0 ? 'high' : 'low'}
            />
            {(!!slide.title || !!slide.description) && (
              <View style={styles.caption}>
                {!!slide.title && <Text style={styles.captionTitle} numberOfLines={1}>{slide.title}</Text>}
                {!!slide.description && <Text style={styles.captionDesc} numberOfLines={2}>{slide.description}</Text>}
              </View>
            )}
          </View>
        ))}
      </PagerView>

      {banners.length > 1 && (
        <View style={styles.dots}>
          {banners.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => pagerRef.current?.setPage(i)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Xem ảnh ${i + 1} trên ${banners.length}`}
              accessibilityState={{ selected: i === index }}
            >
              <View style={[styles.dot, i === index && styles.dotActive]} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { width: '100%', height: 220 },
  pager: { flex: 1 },
  slide: { flex: 1 },
  image: { width: '100%', height: '100%' },
  caption: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: 18, paddingTop: 24, paddingBottom: 16,
    backgroundColor: 'rgba(15,23,42,0.55)',
  },
  captionTitle: { color: '#FFFFFF', fontFamily: fonts.displayExtraBold, fontSize: 18 },
  captionDesc: { color: '#E2E8F0', fontFamily: fonts.body, fontSize: 13.5, marginTop: 2 },
  dots: {
    position: 'absolute', bottom: 10, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { backgroundColor: '#FFFFFF', width: 18 },
})
