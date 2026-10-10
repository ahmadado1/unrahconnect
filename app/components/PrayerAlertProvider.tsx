import { isAdhanPlaying, stopAdhan, subscribeAdhanPlaying } from "@/lib/adhanAudio"
import { fetchAndCachePrayerTimes } from "@/lib/prayerTimes"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { AppState, Pressable, StyleSheet, Text, View, type AppStateStatus } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

function AdhanPlayingBar() {
  const insets = useSafeAreaInsets()
  const { t } = useTranslation()
  const [playing, setPlaying] = useState(isAdhanPlaying())

  useEffect(() => subscribeAdhanPlaying(setPlaying), [])

  if (!playing) return null

  return (
    <View style={[styles.bar, { top: insets.top + 8 }]}>
      <Text style={styles.label}>{t("playAdhanNowTitle", { defaultValue: "Adhan playing" })}</Text>
      <Pressable onPress={() => void stopAdhan()} style={styles.stop} hitSlop={8}>
        <Text style={styles.stopText}>{t("stopAdhan", { defaultValue: "Stop" })}</Text>
      </Pressable>
    </View>
  )
}

/**
 * Keeps prayer times fresh when the app opens or the user moves, which
 * reschedules the prayer notifications. The bar is the only Adhan UI.
 */
export default function PrayerAlertProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let cancelled = false

    const refresh = () => {
      void fetchAndCachePrayerTimes().then(() => {
        if (cancelled) return
      })
    }

    refresh()
    const refreshTimer = setInterval(() => {
      void fetchAndCachePrayerTimes({ force: true })
    }, 6 * 60 * 60 * 1000)

    const onAppState = (state: AppStateStatus) => {
      if (state === "active") refresh()
    }
    const sub = AppState.addEventListener("change", onAppState)

    let midnight: ReturnType<typeof setTimeout> | null = null
    const scheduleMidnight = () => {
      const now = new Date()
      const msUntilMidnight =
        new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime()
      midnight = setTimeout(() => {
        void fetchAndCachePrayerTimes({ force: true })
        scheduleMidnight()
      }, msUntilMidnight + 500)
    }
    scheduleMidnight()

    return () => {
      cancelled = true
      clearInterval(refreshTimer)
      if (midnight) clearTimeout(midnight)
      sub.remove()
    }
  }, [])

  return (
    <>
      {children}
      <AdhanPlayingBar />
    </>
  )
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1E3A5F",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  label: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  stop: {
    backgroundColor: "#C9A84C",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  stopText: {
    color: "#1E3A5F",
    fontSize: 13,
    fontWeight: "800",
  },
})
