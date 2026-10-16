import { isAdhanPlaying, playAdhan, stopAdhan, subscribeAdhanPlaying } from "@/lib/adhanAudio"
import { normalizePrayerAlertOptions, registerPrayerAlertHandler } from "@/lib/prayerAlert"
import { PRAYER_NAMES, type PrayerName } from "@/lib/prayerConstants"
import {
  fetchAndCachePrayerTimes,
  getLocalGregorianDateKey,
  readCachedPrayerTimes,
  timeToMinutes,
} from "@/lib/prayerTimes"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useCallback, useEffect, useRef, useState } from "react"
import PrayerPopupModal from "./PrayerPopupModal"
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

// Which prayers already showed the full-screen popup today (so it shows once per prayer).
const SHOWN_KEY = "prayer_popups_shown"
/** Opening the app up to 20 minutes after prayer time still shows that prayer's popup. */
const CATCHUP_MINUTES = 20

async function prayerAlertsOn() {
  if ((await AsyncStorage.getItem("notifications_enabled")) === "false") return false
  return (await AsyncStorage.getItem("prayer_alerts_enabled")) !== "false"
}

async function readShown(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(SHOWN_KEY)
    const saved = raw ? (JSON.parse(raw) as { day: string; names: string[] }) : null
    return new Set(saved && saved.day === getLocalGregorianDateKey() ? saved.names : [])
  } catch {
    return new Set()
  }
}

async function saveShown(names: Set<string>) {
  await AsyncStorage.setItem(SHOWN_KEY, JSON.stringify({ day: getLocalGregorianDateKey(), names: [...names] })).catch(() => {})
}

/**
 * - Keeps prayer times fresh (which reschedules the prayer notifications).
 * - Shows the full-screen prayer popup (mosque background, Pray Now / Mark as Prayed):
 *   when the Adhan notification arrives or is tapped, or when the app is opened
 *   within 20 minutes of a prayer time. Once per prayer per day.
 * - The small "Adhan playing · Stop" bar while the Adhan plays.
 */
export default function PrayerAlertProvider({ children }: { children: React.ReactNode }) {
  const [popup, setPopup] = useState<PrayerName | null>(null)
  const snoozeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Show the popup for one prayer (the Adhan sound itself is started by the notification code).
  const showPopup = useCallback(async (name: PrayerName, force: boolean) => {
    if (!(await prayerAlertsOn())) return
    const shown = await readShown()
    if (shown.has(name) && !force) return
    shown.add(name)
    await saveShown(shown)
    setPopup(name)
  }, [])

  // Notifications call triggerPrayerAlert(...) → this opens the popup.
  useEffect(() => {
    return registerPrayerAlertHandler(async (name, rawOptions) => {
      const options = normalizePrayerAlertOptions(rawOptions)
      await showPopup(name, options.forceShow)
    })
  }, [showPopup])

  // App opened shortly after a prayer time → show that prayer's popup (no sound).
  const catchUp = useCallback(async () => {
    const times = await readCachedPrayerTimes()
    if (!times) return
    const now = new Date()
    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    for (const name of PRAYER_NAMES) {
      const at = timeToMinutes(times[name])
      if (at >= 0 && nowMinutes >= at && nowMinutes <= at + CATCHUP_MINUTES) {
        await showPopup(name, false)
        break
      }
    }
  }, [showPopup])

  useEffect(() => {
    const first = setTimeout(() => void catchUp(), 0)
    const interval = setInterval(() => void catchUp(), 30000)
    const sub = AppState.addEventListener("change", state => {
      if (state === "active") void catchUp()
    })
    return () => {
      clearTimeout(first)
      clearInterval(interval)
      sub.remove()
      if (snoozeTimer.current) clearTimeout(snoozeTimer.current)
    }
  }, [catchUp])

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
      <PrayerPopupModal
        visible={popup !== null}
        prayerName={popup}
        onDismiss={() => setPopup(null)}
        onPrayNow={() => {
          void stopAdhan()
          setPopup(null)
        }}
        onSnooze={() => {
          // Remind again in 5 minutes, with the Adhan.
          const snoozed = popup
          setPopup(null)
          void stopAdhan()
          if (snoozeTimer.current) clearTimeout(snoozeTimer.current)
          if (snoozed) {
            snoozeTimer.current = setTimeout(() => {
              setPopup(snoozed)
              void playAdhan(snoozed, { forceRestart: true, continueIfPlaying: false })
            }, 5 * 60 * 1000)
          }
        }}
      />
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
