// Gold glow + "New" badge around a Premium feature card, until the user opens it once.
import { useFeatureIsNew, type PremiumFeatureId } from "@/lib/premiumNew"
import { useEffect, useRef, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Animated, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"

export default function NewGlow({
  id,
  children,
  style,
  radius = 18,
}: {
  id: PremiumFeatureId
  children: ReactNode
  style?: StyleProp<ViewStyle>
  radius?: number
}) {
  const { t } = useTranslation()
  const { isNew } = useFeatureIsNew(id)
  const pulse = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!isNew) return
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.25, duration: 1100, useNativeDriver: true }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [isNew, pulse])

  return (
    <View style={style}>
      {isNew ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.glow, { borderRadius: radius + 4, opacity: pulse }]}
        />
      ) : null}
      {children}
      {isNew ? (
        <View pointerEvents="none" style={styles.badge}>
          <Text style={styles.badgeText}>{t("pwNew")}</Text>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  glow: {
    ...StyleSheet.absoluteFill,
    margin: -4,
    borderWidth: 2,
    borderColor: GOLD,
    shadowColor: GOLD,
    shadowOpacity: 0.9,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  badge: { position: "absolute", top: -8, right: 12, backgroundColor: GOLD, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  badgeText: { color: NAVY, fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
})
