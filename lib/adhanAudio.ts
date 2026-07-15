import { getAdhanFile, type PrayerName } from "@/lib/prayerConstants"
import { Audio, InterruptionModeAndroid, InterruptionModeIOS, type AVPlaybackStatus } from "expo-av"
import AsyncStorage from "@react-native-async-storage/async-storage"

/** Short lock-screen / notification clips (≤30s) used when full Adhan audio fails. */
const ADHAN_LOCK_FILES: Record<string, number> = {
  "1": require("../assets/audio/azan1_lock.mp3"),
  "2": require("../assets/audio/azan2_lock.mp3"),
  "3": require("../assets/audio/azan3_lock.mp3"),
  "4": require("../assets/audio/azan4_lock.mp3"),
  "5": require("../assets/audio/azan5_lock.mp3"),
}

const ADHAN_FAJR_LOCK_FILES: Record<string, number> = {
  "1": require("../assets/audio/azan1_fajr_lock.mp3"),
  "2": require("../assets/audio/azan2_fajr_lock.mp3"),
  "3": require("../assets/audio/azan3_fajr_lock.mp3"),
  "4": require("../assets/audio/azan4_fajr_lock.mp3"),
  "5": require("../assets/audio/azan5_fajr_lock.mp3"),
}

export type PlayAdhanOptions = {
  forceRestart?: boolean
  continueIfPlaying?: boolean
  seekSeconds?: number
  /** Skip short-clip fallback (e.g. already relying on system notification sound). */
  allowFallback?: boolean
}

type PlayingListener = (playing: boolean) => void

let sound: Audio.Sound | null = null
let currentSource: number | null = null
let audioModeReady = false
let playing = false
const listeners = new Set<PlayingListener>()

function notifyPlaying(next: boolean) {
  if (playing === next) return
  playing = next
  listeners.forEach(listener => listener(playing))
}

function onPlaybackStatusUpdate(status: AVPlaybackStatus) {
  if (!status.isLoaded) {
    notifyPlaying(false)
    return
  }
  notifyPlaying(status.isPlaying)
  if (status.didJustFinish) {
    notifyPlaying(false)
  }
}

export function isAdhanPlaying() {
  return playing
}

export function subscribeAdhanPlaying(listener: PlayingListener) {
  listeners.add(listener)
  listener(playing)
  return () => {
    listeners.delete(listener)
  }
}

export async function configureAdhanAudioMode() {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    staysActiveInBackground: true,
    playsInSilentModeIOS: true,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
    interruptionModeIOS: InterruptionModeIOS.DoNotMix,
    interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
  })
  audioModeReady = true
}

async function ensureAudioMode() {
  if (audioModeReady) return
  try {
    await configureAdhanAudioMode()
  } catch (e) {
    console.log("Adhan audio mode error:", e)
    audioModeReady = false
    throw e
  }
}

async function unloadSound() {
  if (!sound) return
  try {
    sound.setOnPlaybackStatusUpdate(null)
    await sound.stopAsync()
  } catch {}
  try {
    await sound.unloadAsync()
  } catch {}
  sound = null
  currentSource = null
  notifyPlaying(false)
}

function getLockFile(adhanId: string, prayerName?: PrayerName | string | null) {
  const id = ADHAN_LOCK_FILES[adhanId] ? adhanId : "1"
  if (prayerName === "Fajr") {
    return ADHAN_FAJR_LOCK_FILES[id] ?? ADHAN_FAJR_LOCK_FILES["1"]
  }
  return ADHAN_LOCK_FILES[id] ?? ADHAN_LOCK_FILES["1"]
}

async function playSource(
  source: number,
  opts?: { seekSeconds?: number; forceRestart?: boolean; continueIfPlaying?: boolean }
): Promise<boolean> {
  await ensureAudioMode()

  const continueIfPlaying = opts?.continueIfPlaying !== false
  const forceRestart = opts?.forceRestart === true
  const seekSeconds = opts?.seekSeconds

  if (sound && currentSource === source) {
    const status = await sound.getStatusAsync()
    if (status.isLoaded) {
      if (status.isPlaying && continueIfPlaying && !forceRestart) {
        return true
      }
      if (typeof seekSeconds === "number" && Number.isFinite(seekSeconds) && seekSeconds > 0) {
        await sound.setPositionAsync(Math.floor(seekSeconds * 1000))
      } else if (forceRestart || !status.isPlaying) {
        await sound.setPositionAsync(0)
      }
      await sound.playAsync()
      notifyPlaying(true)
      return true
    }
  }

  await unloadSound()

  const positionMillis =
    typeof seekSeconds === "number" && Number.isFinite(seekSeconds) && seekSeconds > 0
      ? Math.floor(seekSeconds * 1000)
      : 0

  const { sound: next } = await Audio.Sound.createAsync(
    source,
    {
      shouldPlay: true,
      positionMillis,
      progressUpdateIntervalMillis: 500,
    },
    onPlaybackStatusUpdate
  )

  sound = next
  currentSource = source
  notifyPlaying(true)
  return true
}

/**
 * Play the full Adhan MP3 with a background-capable AVAudioSession.
 * Falls back to the short lock-screen clip if the full session fails.
 */
export async function playAdhan(
  prayerName: PrayerName,
  opts?: PlayAdhanOptions
): Promise<boolean> {
  const selected = (await AsyncStorage.getItem("selected_adhan")) || "1"
  const fullSource = getAdhanFile(selected, prayerName)
  const allowFallback = opts?.allowFallback !== false

  try {
    return await playSource(fullSource, opts)
  } catch (e) {
    console.log("Full Adhan playback failed, trying short clip fallback:", e)
    if (!allowFallback) return false

    try {
      return await playSource(getLockFile(selected, prayerName), {
        forceRestart: true,
        continueIfPlaying: false,
      })
    } catch (fallbackError) {
      console.log("Adhan fallback clip also failed:", fallbackError)
      notifyPlaying(false)
      return false
    }
  }
}

export async function stopAdhan() {
  await unloadSound()
}

export async function pauseAdhan() {
  if (!sound) {
    notifyPlaying(false)
    return
  }
  try {
    await sound.pauseAsync()
  } catch {}
  notifyPlaying(false)
}
