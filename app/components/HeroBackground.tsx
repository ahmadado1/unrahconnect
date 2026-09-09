import { LinearGradient } from "expo-linear-gradient"
import { useEffect, useRef, useState, type ReactNode } from "react"
import {
  ActivityIndicator,
  Animated,
  Image,
  StyleSheet,
  View,
  type ImageSourcePropType,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from "react-native"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"

type Props = {
  source: ImageSourcePropType
  style?: StyleProp<ViewStyle>
  imageStyle?: StyleProp<ImageStyle>
  children?: ReactNode
  placeholderColor?: string
  resizeMode?: "cover" | "contain" | "stretch"
  onError?: () => void
}

function sourceKey(source: ImageSourcePropType) {
  if (typeof source === "number") return String(source)
  if (Array.isArray(source)) return source.map((item) => item.uri ?? "").join("|")
  if (source && typeof source === "object" && "uri" in source) return source.uri ?? ""
  return "src"
}

/**
 * Hero/media frame that keeps its layout on the first paint.
 * Shows a theme-colored placeholder, then crossfades the image in.
 */
export default function HeroBackground({
  source,
  style,
  imageStyle,
  children,
  placeholderColor = NAVY,
  resizeMode = "cover",
  onError,
}: Props) {
  const key = sourceKey(source)
  const opacity = useRef(new Animated.Value(0)).current
  const loadedRef = useRef(false)
  const activeKeyRef = useRef(key)
  const [showSpinner, setShowSpinner] = useState(false)

  const reveal = () => {
    if (loadedRef.current) return
    loadedRef.current = true
    setShowSpinner(false)
    Animated.timing(opacity, {
      toValue: 1,
      duration: 280,
      useNativeDriver: true,
    }).start()
  }

  useEffect(() => {
    activeKeyRef.current = key
    loadedRef.current = false
    opacity.setValue(0)
    setShowSpinner(false)

    const spinnerTimer = setTimeout(() => {
      if (activeKeyRef.current === key && !loadedRef.current) setShowSpinner(true)
    }, 160)
    const revealTimer = setTimeout(() => {
      if (activeKeyRef.current === key && !loadedRef.current) reveal()
    }, 2200)

    return () => {
      clearTimeout(spinnerTimer)
      clearTimeout(revealTimer)
    }
  }, [key, opacity])

  return (
    <View style={[{ backgroundColor: placeholderColor, overflow: "hidden" }, style]}>
      <LinearGradient
        colors={[placeholderColor, "#152A47", "#3A3420"]}
        locations={[0, 0.62, 1]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject, { opacity }]}
      >
        <Image
          source={source}
          resizeMode={resizeMode}
          onLoadEnd={() => {
            if (activeKeyRef.current === key) reveal()
          }}
          onError={() => {
            if (activeKeyRef.current !== key) return
            onError?.()
            if (!onError) reveal()
          }}
          style={[StyleSheet.absoluteFillObject, imageStyle]}
        />
      </Animated.View>
      {showSpinner ? (
        <ActivityIndicator
          color={GOLD}
          size="small"
          style={styles.spinner}
          pointerEvents="none"
        />
      ) : null}
      {children}
    </View>
  )
}

/** Prefetch local/remote images so the first decode is less likely to hitch. */
export function prefetchHeroSource(source: ImageSourcePropType) {
  const resolved = Image.resolveAssetSource(source)
  if (resolved?.uri) {
    void Image.prefetch(resolved.uri).catch(() => {})
  }
}

const styles = StyleSheet.create({
  spinner: {
    position: "absolute",
    bottom: 14,
    right: 14,
    zIndex: 2,
  },
})
