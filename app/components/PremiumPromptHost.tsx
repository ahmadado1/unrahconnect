// The Premium card that pops up when a free user taps something that is Premium.
//   <PremiumPromptHost />          in the root layout (uses its own Modal)
//   <PremiumPromptHost overlay />  inside another Modal (draws on top of it, no second Modal)
import TouchableOpacity from "@/app/components/AppPressable"
import { openPremiumScreen, registerPremiumPromptHost } from "@/lib/premiumPrompt"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Animated, Modal, Pressable, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"

// What Premium gives, shown as a short list on the card (texts already translated).
const FEATURE_KEYS = ["pw_f2", "pw_f3", "pw_f7", "pw_f8", "pw_f6"] as const

export default function PremiumPromptHost({ overlay = false }: { overlay?: boolean }) {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const [visible, setVisible] = useState(false)
  const beforeOpenRef = useRef<(() => void) | undefined>(undefined)
  const [anim] = useState(() => new Animated.Value(0))

  // Register so showPremiumPrompt() can open this card.
  useEffect(
    () =>
      registerPremiumPromptHost(beforeOpen => {
        beforeOpenRef.current = beforeOpen
        setVisible(true)
      }),
    []
  )

  // Little pop-in animation.
  useEffect(() => {
    if (!visible) return
    anim.setValue(0)
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, friction: 7, tension: 70 }).start()
  }, [visible, anim])

  const close = () => setVisible(false)
  const goPremium = () => {
    const beforeOpen = beforeOpenRef.current
    setVisible(false)
    // Give this card time to close, then (optionally) close the sheet behind it, then open Premium.
    setTimeout(() => openPremiumScreen(beforeOpen), 150)
  }

  if (!visible) return null

  const card = (
    <View style={[StyleSheet.absoluteFill, styles.center, { paddingBottom: insets.bottom }]}>
      {/* Dark background: tap to close */}
      <Pressable style={[StyleSheet.absoluteFill, styles.backdrop]} onPress={close} accessibilityLabel={t("pw_notNow")} />

      <Animated.View
        style={[
          styles.wrap,
          { opacity: anim, transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }] },
        ]}
      >
        <LinearGradient colors={[NAVY, "#2C5282"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
          {/* Close (X) */}
          <TouchableOpacity style={styles.x} onPress={close} accessibilityLabel={t("pw_notNow")}>
            <Ionicons name="close" size={20} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>

          {/* Star badge + title */}
          <View style={styles.star}>
            <Ionicons name="star" size={30} color={NAVY} />
          </View>
          <Text style={styles.kicker}>{t("premiumFeature")}</Text>
          <Text style={styles.title}>{t("pw_title")}</Text>
          <Text style={styles.sub}>{t("pw_sub")}</Text>

          {/* What you get */}
          <View style={styles.list}>
            {FEATURE_KEYS.map(key => (
              <View key={key} style={styles.row}>
                <Ionicons name="checkmark-circle" size={18} color={GOLD} />
                <Text style={styles.rowText}>{t(key)}</Text>
              </View>
            ))}
          </View>

          {/* Buttons */}
          <TouchableOpacity style={styles.btn} onPress={goPremium} accessibilityRole="button">
            <Text style={styles.btnText}>{t("pw_seePremium")}</Text>
            <Ionicons name="chevron-forward" size={16} color={NAVY} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.later} onPress={close}>
            <Text style={styles.laterText}>{t("pw_notNow")}</Text>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
    </View>
  )

  // Inside another Modal: draw on top of it (a second Modal may not show on iOS).
  if (overlay) return <View style={[StyleSheet.absoluteFill, { zIndex: 1000, elevation: 1000 }]}>{card}</View>

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={close}>
      {card}
    </Modal>
  )
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center", padding: 22 },
  backdrop: { backgroundColor: "rgba(10,20,35,0.6)" },
  wrap: { width: "100%", maxWidth: 400, borderRadius: 24, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 12 },
  card: { padding: 22, paddingTop: 26, alignItems: "center", borderWidth: 1, borderColor: "rgba(201,168,76,0.55)", borderRadius: 24 },
  x: { position: "absolute", top: 10, end: 10, padding: 6 },
  star: { width: 62, height: 62, borderRadius: 31, backgroundColor: GOLD, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  kicker: { color: GOLD, fontSize: 12, fontWeight: "800", letterSpacing: 0.5, textTransform: "uppercase" },
  title: { color: "#fff", fontSize: 21, fontWeight: "800", marginTop: 4, textAlign: "center" },
  sub: { color: "#E8D5A3", fontSize: 14, lineHeight: 20, marginTop: 6, textAlign: "center" },
  list: { alignSelf: "stretch", gap: 9, marginTop: 16, marginBottom: 18 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 9 },
  rowText: { flex: 1, color: "#fff", fontSize: 14, lineHeight: 19 },
  btn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, alignSelf: "stretch", backgroundColor: GOLD, borderRadius: 999, paddingVertical: 14 },
  btnText: { color: NAVY, fontSize: 16, fontWeight: "800" },
  later: { paddingVertical: 12, paddingHorizontal: 20, marginTop: 2 },
  laterText: { color: "rgba(255,255,255,0.75)", fontSize: 14, fontWeight: "600" },
})
