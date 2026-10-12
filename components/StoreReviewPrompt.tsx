import { useTheme } from "@/context/themeContext"
import { isAdhanPlaying, subscribeAdhanPlaying } from "@/lib/adhanAudio"
import {
  considerStoreReview,
  dismissStoreReviewCard,
  rateFromPrompt,
  recordAppOpen,
  subscribeStoreReviewCard,
} from "@/lib/storeReviewPrompt"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { AppState, Platform, Pressable, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

/** Counts opens, asks after the Adhan closes, and shows the Android card. */
export default function StoreReviewPrompt() {
  const insets = useSafeAreaInsets()
  const { theme } = useTheme()
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    void recordAppOpen()
    const unsubCard = subscribeStoreReviewCard(setVisible)
    let wasPlaying = isAdhanPlaying()
    const unsubAdhan = subscribeAdhanPlaying(playing => {
      if (wasPlaying && !playing) void considerStoreReview("adhan")
      wasPlaying = playing
    })
    const sub = AppState.addEventListener("change", state => {
      if (state === "active") void recordAppOpen()
    })
    return () => {
      unsubCard()
      unsubAdhan()
      sub.remove()
    }
  }, [])

  if (Platform.OS === "ios" || !visible) return null

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom, 12) + 12 }]}>
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.message, { color: theme.text }]}>{t("rateEnjoying")}</Text>
        <View style={styles.actions}>
          <Pressable onPress={() => void rateFromPrompt()} style={styles.rateBtn} accessibilityRole="button">
            <Text style={styles.rateText}>{t("rateUs")}</Text>
          </Pressable>
          <Pressable onPress={dismissStoreReviewCard} style={styles.laterBtn} accessibilityRole="button">
            <Text style={[styles.laterText, { color: theme.textSecondary }]}>{t("rateNotNow")}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 80,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  message: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  rateBtn: {
    backgroundColor: "#C9A84C",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  rateText: {
    color: "#1E3A5F",
    fontSize: 14,
    fontWeight: "800",
  },
  laterBtn: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  laterText: {
    fontSize: 14,
    fontWeight: "600",
  },
})
