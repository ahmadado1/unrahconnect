// Small "No internet" pill at the top of every screen while the phone is offline.
// Slides in, pulses a little dot, and slides away when the connection comes back.
import { useOnline } from "@/lib/useOnline"
import { Ionicons } from "@expo/vector-icons"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Animated, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"

export default function OfflineBanner() {
  const online = useOnline()
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const slide = useRef(new Animated.Value(0)).current
  const pulse = useRef(new Animated.Value(1)).current
  const [shown, setShown] = useState(false)

  useEffect(() => {
    if (!online) setShown(true)
    Animated.timing(slide, { toValue: online ? 0 : 1, duration: 260, useNativeDriver: true }).start(({ finished }) => {
      if (finished && online) setShown(false)
    })
  }, [online, slide])

  useEffect(() => {
    if (online) return
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.25, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [online, pulse])

  if (!shown) return null
  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [-80, 0] })

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.wrap, { top: insets.top + 6, opacity: slide, transform: [{ translateY }] }]}
      accessibilityLiveRegion="polite"
    >
      <View style={styles.pill}>
        <Animated.View style={[styles.dot, { opacity: pulse }]} />
        <Ionicons name="cloud-offline-outline" size={14} color={GOLD} />
        <Text style={styles.text}>
          {t("offlineBanner", { defaultValue: "No internet · showing saved content" })}
        </Text>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 0, right: 0, alignItems: "center", zIndex: 999, elevation: 20 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: NAVY,
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.6)",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#E5534B" },
  text: { color: "#fff", fontSize: 12.5, fontWeight: "700" },
})
