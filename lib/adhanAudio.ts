import { getAdhanFile, DEFAULT_ADHAN_ID, type PrayerName } from "@/lib/prayerConstants"
import AsyncStorage from "@react-native-async-storage/async-storage"
import {
  Audio,
  InterruptionModeAndroid,
  InterruptionModeIOS,
  type AVPlaybackStatus,
} from "expo-av"

/** Short lock-screen / notification clips (≤30s) used when full Adhan audio fails. */
const ADHAN_LOCK_FILES: Record<string, number> = {
  "1": require("../assets/audio1/azan1_lock.mp3"),
  "2": require("../assets/audio1/azan2_lock.mp3"),
  "3": require("../assets/audio1/azan3_lock.mp3"),
  "4": require("../assets/audio1/azan4_lock.mp3"),
  "5": require("../assets/audio1/azan5_lock.mp3"),
}

const ADHAN_FAJR_LOCK_FILES: Record<string, number> = {
  "1": require("../assets/audio1/azan1_fajr_lock.mp3"),
  "2": require("../assets/audio1/azan2_fajr_lock.mp3"),
  "3": require("../assets/audio1/azan3_fajr_lock.mp3"),
  "4": require("../assets/audio1/azan4_fajr_lock.mp3"),
  "5": require("../assets/audio1/azan5_fajr_lock.mp3"),
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
let playing = false
/** True while we want Adhan to keep playing (resume after lock / interruption). */
let expectPlaying = false
/** True when user (or app) intentionally stopped — do not auto-resume. */
let userStopped = false
let resumeInFlight = false

const listeners = new Set<PlayingListener>()

function notifyPlaying(next: boolean) {
  if (playing === next) return
  playing = next
  listeners.forEach(listener => listener(playing))
}

async function configureAdhanAudioMode() {
  // Always re-apply before playback so iOS keeps the session when the screen locks.
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    staysActiveInBackground: true,
    playsInSilentModeIOS: true,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
    interruptionModeIOS: InterruptionModeIOS.DoNotMix,
    interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
  })
}

function onPlaybackStatusUpdate(status: AVPlaybackStatus) {
  if (!status.isLoaded) {
    notifyPlaying(false)
    return
  }

  if (status.didJustFinish) {
    expectPlaying = false
    userStopped = false
    notifyPlaying(false)
    void unloadSound({ keepExpectation: true })
    return
  }

  notifyPlaying(status.isPlaying)

  // iOS often pauses briefly on lock / interruption — resume if we still expect Adhan.
  if (
    !status.isPlaying &&
    expectPlaying &&
    !userStopped &&
    !resumeInFlight &&
    sound
  ) {
    resumeInFlight = true
    void (async () => {
      try {
        await configureAdhanAudioMode()
        if (!sound || userStopped || !expectPlaying) return
        const current = await sound.getStatusAsync()
        if (current.isLoaded && !current.isPlaying && !current.didJustFinish) {
          await sound.playAsync()
          notifyPlaying(true)
        }
      } catch (e) {
        console.log("Adhan resume after interruption failed:", e)
      } finally {
        resumeInFlight = false
      }
    })()
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

export { configureAdhanAudioMode }

async function unloadSound(opts?: { keepExpectation?: boolean }) {
  if (!sound) {
    if (!opts?.keepExpectation) {
      expectPlaying = false
    }
    notifyPlaying(false)
    return
  }
  try {
    sound.setOnPlaybackStatusUpdate(null)
    await sound.stopAsync()
  } catch {}
  try {
    await sound.unloadAsync()
  } catch {}
  sound = null
  currentSource = null
  if (!opts?.keepExpectation) {
    expectPlaying = false
  }
  notifyPlaying(false)
}

function getLockFile(adhanId: string, prayerName?: PrayerName | string | null) {
  const id = ADHAN_LOCK_FILES[adhanId] ? adhanId : DEFAULT_ADHAN_ID
  if (prayerName === "Fajr") {
    return ADHAN_FAJR_LOCK_FILES[id] ?? ADHAN_FAJR_LOCK_FILES[DEFAULT_ADHAN_ID]
  }
  return ADHAN_LOCK_FILES[id] ?? ADHAN_LOCK_FILES[DEFAULT_ADHAN_ID]
}

async function playSource(
  source: number,
  opts?: { seekSeconds?: number; forceRestart?: boolean; continueIfPlaying?: boolean }
): Promise<boolean> {
  // Critical: configure session BEFORE any play/create call.
  await configureAdhanAudioMode()

  const continueIfPlaying = opts?.continueIfPlaying !== false
  const forceRestart = opts?.forceRestart === true
  const seekSeconds = opts?.seekSeconds

  userStopped = false
  expectPlaying = true

  // If Adhan is already playing (e.g. user opened notification mid-playback), never restart/seek.
  if (sound && continueIfPlaying && !forceRestart) {
    try {
      const status = await sound.getStatusAsync()
      if (status.isLoaded && status.isPlaying) {
        notifyPlaying(true)
        return true
      }
    } catch {}
  }

  if (sound && currentSource === source) {
    const status = await sound.getStatusAsync()
    if (status.isLoaded) {
      if (status.isPlaying && continueIfPlaying && !forceRestart) {
        notifyPlaying(true)
        return true
      }
      if (typeof seekSeconds === "number" && Number.isFinite(seekSeconds) && seekSeconds > 0) {
        await sound.setPositionAsync(Math.floor(seekSeconds * 1000))
      } else if (forceRestart || !status.isPlaying) {
        await sound.setPositionAsync(0)
      }
      await sound.setStatusAsync({
        shouldPlay: true,
        isLooping: false,
        volume: 1.0,
      })
      await sound.playAsync()
      notifyPlaying(true)
      return true
    }
  }

  await unloadSound({ keepExpectation: true })
  expectPlaying = true
  userStopped = false

  const positionMillis =
    typeof seekSeconds === "number" && Number.isFinite(seekSeconds) && seekSeconds > 0
      ? Math.floor(seekSeconds * 1000)
      : 0

  const { sound: next } = await Audio.Sound.createAsync(
    source,
    {
      shouldPlay: true,
      isLooping: false,
      volume: 1.0,
      positionMillis,
      progressUpdateIntervalMillis: 500,
    },
    onPlaybackStatusUpdate
  )

  sound = next
  currentSource = source
  // Re-apply mode after create — some iOS versions reset session on Sound init.
  await configureAdhanAudioMode()
  try {
    await sound.setStatusAsync({
      shouldPlay: true,
      isLooping: false,
      volume: 1.0,
    })
    const status = await sound.getStatusAsync()
    if (status.isLoaded && !status.isPlaying) {
      await sound.playAsync()
    }
  } catch (e) {
    console.log("Adhan playAsync after create failed:", e)
  }

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
  const selected = (await AsyncStorage.getItem("selected_adhan")) || DEFAULT_ADHAN_ID
  const fullSource = getAdhanFile(selected, prayerName)
  const allowFallback = opts?.allowFallback !== false

  try {
    return await playSource(fullSource, opts)
  } catch (e) {
    console.log("Full Adhan playback failed, trying short clip fallback:", e)
    if (!allowFallback) {
      expectPlaying = false
      notifyPlaying(false)
      return false
    }

    try {
      return await playSource(getLockFile(selected, prayerName), {
        forceRestart: true,
        continueIfPlaying: false,
      })
    } catch (fallbackError) {
      console.log("Adhan fallback clip also failed:", fallbackError)
      expectPlaying = false
      notifyPlaying(false)
      return false
    }
  }
}

export async function stopAdhan() {
  userStopped = true
  expectPlaying = false
  await unloadSound()
}

export async function pauseAdhan() {
  userStopped = true
  expectPlaying = false
  if (!sound) {
    notifyPlaying(false)
    return
  }
  try {
    await sound.pauseAsync()
  } catch {}
  notifyPlaying(false)
}
