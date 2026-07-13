import PrayerPopupModal from "./PrayerPopupModal"
import { normalizePrayerAlertOptions, registerPrayerAlertHandler } from "@/lib/prayerAlert"
import { getAdhanFile, PRAYER_NAMES, type PrayerName } from "@/lib/prayerConstants"
import {
  fetchAndCachePrayerTimes,
  readCachedPrayerTimes,
  timeToMinutes,
  type CachedPrayerTimes,
} from "@/lib/prayerTimes"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { setAudioModeAsync, useAudioPlayer } from "expo-audio"
import { useEffect, useRef, useState } from "react"

const SHOWN_POPUPS_KEY = "prayer_popups_shown_date"

function getTodayKey() {
  const now = new Date()
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
}

async function areNotificationsEnabled() {
  const val = await AsyncStorage.getItem("notifications_enabled")
  return val !== "false"
}

export default function PrayerAlertProvider({ children }: { children: React.ReactNode }) {
  const [prayerPopup, setPrayerPopup] = useState<PrayerName | null>(null)
  const [prayerTimes, setPrayerTimes] = useState<CachedPrayerTimes | null>(null)
  const [shownPopups, setShownPopups] = useState<Set<string>>(new Set())
  const [adhanId, setAdhanId] = useState("1")
  const [playingForFajr, setPlayingForFajr] = useState(false)
  const snoozeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const player = useAudioPlayer(getAdhanFile(adhanId, playingForFajr ? "Fajr" : "Dhuhr"))
  const adhanIdRef = useRef(adhanId)
  const playingForFajrRef = useRef(playingForFajr)
  const shownPopupsRef = useRef(shownPopups)
  const showPrayerAlertRef = useRef<
    (prayerName: PrayerName, options?: boolean | import("@/lib/prayerAlert").PrayerAlertOptions) => void
  >(() => {})

  adhanIdRef.current = adhanId
  playingForFajrRef.current = playingForFajr
  shownPopupsRef.current = shownPopups

  const playAdhan = async (
    prayerName: PrayerName,
    opts?: {
      forceRestart?: boolean
      continueIfPlaying?: boolean
      seekSeconds?: number
    }
  ) => {
    try {
      const selected = (await AsyncStorage.getItem("selected_adhan")) || "1"
      const isFajr = prayerName === "Fajr"
      const file = getAdhanFile(selected, prayerName)
      const needsReplace =
        selected !== adhanIdRef.current || isFajr !== playingForFajrRef.current

      if (needsReplace) {
        setAdhanId(selected)
        setPlayingForFajr(isFajr)
        player.replace(file)
      }

      const alreadyPlaying = !!player.playing
      const continueIfPlaying = opts?.continueIfPlaying !== false
      const forceRestart = opts?.forceRestart === true
      const seekSeconds = opts?.seekSeconds

      // In-app adhan already playing — keep position, don't restart or jump.
      if (alreadyPlaying && continueIfPlaying && !forceRestart && !needsReplace) {
        return
      }

      if (typeof seekSeconds === "number" && Number.isFinite(seekSeconds) && seekSeconds > 0) {
        await player.seekTo(seekSeconds)
      } else {
        await player.seekTo(0)
      }

      player.play()
    } catch (e) {
      console.log("Adhan sound error:", e)
    }
  }

  showPrayerAlertRef.current = (prayerName, rawOptions) => {
    const options = normalizePrayerAlertOptions(rawOptions)
    const alreadyShown = shownPopupsRef.current.has(prayerName)

    if (alreadyShown && !options.forceShow) {
      // Prayer already alerted — never restart from 0; only keep audio going if needed.
      if (options.playSound) {
        void playAdhan(prayerName, {
          forceRestart: false,
          continueIfPlaying: true,
          seekSeconds: options.seekSeconds,
        })
      }
      return
    }

    setPrayerPopup(prayerName)
    if (!alreadyShown) {
      setShownPopups(prev => new Set([...prev, prayerName]))
    }

    if (options.playSound) {
      void playAdhan(prayerName, {
        forceRestart: options.forceRestart,
        continueIfPlaying: options.continueIfPlaying,
        seekSeconds: options.seekSeconds,
      })
    }
  }

  const dismissPrayerAlert = () => {
    setPrayerPopup(null)
    try {
      player.pause()
    } catch {}
  }

  useEffect(() => {
    return registerPrayerAlertHandler(async (name, rawOptions) => {
      if (!(await areNotificationsEnabled())) return
      const options = normalizePrayerAlertOptions(rawOptions)
      if (shownPopupsRef.current.has(name) && !options.forceShow) {
        // Don't start a second adhan — only continue if already playing / ensure playing without restart.
        if (options.playSound) {
          showPrayerAlertRef.current(name, {
            ...options,
            forceShow: false,
            continueIfPlaying: true,
            forceRestart: false,
          })
        }
        return
      }
      showPrayerAlertRef.current(name, options)
    })
  }, [])

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
    }).catch(console.log)

    AsyncStorage.getItem("selected_adhan").then(id => {
      if (id && getAdhanFile(id)) {
        setAdhanId(id)
        player.replace(getAdhanFile(id))
      }
    })

    AsyncStorage.getItem(SHOWN_POPUPS_KEY).then(saved => {
      const today = getTodayKey()
      if (saved === today) {
        AsyncStorage.getItem("prayer_popups_shown_list").then(list => {
          if (list) setShownPopups(new Set(JSON.parse(list)))
        })
      }
    })
  }, [])

  useEffect(() => {
    const today = getTodayKey()
    AsyncStorage.setItem(SHOWN_POPUPS_KEY, today)
    AsyncStorage.setItem("prayer_popups_shown_list", JSON.stringify([...shownPopups]))
  }, [shownPopups])

  useEffect(() => {
    let cancelled = false

    const loadTimes = async () => {
      const cached = await readCachedPrayerTimes()
      if (cached && !cancelled) setPrayerTimes(cached)

      const fresh = await fetchAndCachePrayerTimes()
      if (fresh && !cancelled) setPrayerTimes(fresh)
    }

    loadTimes()
    const refreshTimer = setInterval(loadTimes, 6 * 60 * 60 * 1000)

    return () => {
      cancelled = true
      clearInterval(refreshTimer)
    }
  }, [])

  useEffect(() => {
    if (!prayerTimes) return

    const checkPrayer = async () => {
      if (!(await areNotificationsEnabled())) return

      const now = new Date()
      const nowMinutes = now.getHours() * 60 + now.getMinutes()

      for (const name of PRAYER_NAMES) {
        const prayerMin = timeToMinutes(prayerTimes[name])
        if (nowMinutes >= prayerMin && nowMinutes <= prayerMin + 10 && !shownPopupsRef.current.has(name)) {
          showPrayerAlertRef.current(name, true)
          break
        }
      }
    }

    checkPrayer()
    const interval = setInterval(checkPrayer, 15000)
    return () => clearInterval(interval)
  }, [prayerTimes, shownPopups])

  useEffect(() => {
    const now = new Date()
    const msUntilMidnight =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime()
    const timer = setTimeout(() => setShownPopups(new Set()), msUntilMidnight)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    return () => {
      if (snoozeTimer.current) clearTimeout(snoozeTimer.current)
    }
  }, [])

  return (
    <>
      {children}
      <PrayerPopupModal
        visible={prayerPopup !== null}
        prayerName={prayerPopup}
        onDismiss={dismissPrayerAlert}
        onSnooze={() => {
          const snoozed = prayerPopup
          dismissPrayerAlert()
          if (snoozeTimer.current) clearTimeout(snoozeTimer.current)
          if (snoozed) {
            snoozeTimer.current = setTimeout(
              () =>
                showPrayerAlertRef.current(snoozed, {
                  playSound: true,
                  forceRestart: true,
                  continueIfPlaying: false,
                  forceShow: true,
                }),
              5 * 60 * 1000
            )
          }
        }}
      />
    </>
  )
}
