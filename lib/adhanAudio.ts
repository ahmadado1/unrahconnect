import { getAdhanFile, DEFAULT_ADHAN_ID, type PrayerName } from "@/lib/prayerConstants"
import AsyncStorage from "@react-native-async-storage/async-storage"
import {
  createAudioPlayer,
  setAudioModeAsync,
  setIsAudioActiveAsync,
  type AudioPlayer,
  type AudioStatus,
} from "expo-audio"

/** Short clips used only if the full Adhan file fails to load. */
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

let player: AudioPlayer | null = null
let statusSub: { remove: () => void } | null = null
let currentSource: number | null = null
let playing = false
/** Prayer whose full Adhan is currently loaded / expected to play. */
let currentPrayer: PrayerName | null = null
/** True while we want Adhan to keep playing (resume after lock / interruption). */
let expectPlaying = false
/** True when user (or app) intentionally stopped — do not auto-resume. */
let userStopped = false

let previewPlayer: AudioPlayer | null = null
let previewStatusSub: { remove: () => void } | null = null

const listeners = new Set<PlayingListener>()

function notifyPlaying(next: boolean) {
  if (playing === next) return
  playing = next
  listeners.forEach(listener => listener(playing))
}

function lockScreenMetadata(prayerName: PrayerName | null) {
  const name = prayerName ?? "Adhan"
  return {
    title: `Adhan - ${name}`,
    artist: name,
    albumTitle: "UmrahConnect",
  }
}

function activateLockScreen(target: AudioPlayer, prayerName: PrayerName | null) {
  target.setActiveForLockScreen(true, lockScreenMetadata(prayerName), {
    showSeekForward: false,
    showSeekBackward: false,
  })
}

export async function configureAdhanAudioMode() {
  try {
    await setIsAudioActiveAsync(true)
    await setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "doNotMix",
      shouldRouteThroughEarpiece: false,
    })
  } catch (e) {
    console.log("Adhan audio mode failed:", e)
  }
}

function onPlaybackStatusUpdate(status: AudioStatus) {
  if (status.didJustFinish) {
    expectPlaying = false
    userStopped = false
    currentPrayer = null
    notifyPlaying(false)
    void teardownPlayer({ keepExpectation: true })
    return
  }

  notifyPlaying(status.playing)
}

export function isAdhanPlaying() {
  return playing
}

export function getPlayingAdhanPrayer(): PrayerName | null {
  if (!playing && !expectPlaying) return null
  return currentPrayer
}

/** True when this prayer's Adhan is already in progress (playing or resuming). */
export function isAdhanPlayingFor(prayerName: PrayerName) {
  return currentPrayer === prayerName && (playing || expectPlaying)
}

export function subscribeAdhanPlaying(listener: PlayingListener) {
  listeners.add(listener)
  listener(playing)
  return () => {
    listeners.delete(listener)
  }
}

export function isAdhanPreviewPlaying() {
  return previewPlayer != null
}

async function teardownPlayer(opts?: { keepExpectation?: boolean }) {
  statusSub?.remove()
  statusSub = null
  const current = player
  player = null
  currentSource = null
  if (current) {
    try {
      current.pause()
    } catch {}
    try {
      current.clearLockScreenControls()
    } catch {}
    try {
      current.remove()
    } catch {}
  }
  if (!opts?.keepExpectation) {
    expectPlaying = false
    currentPrayer = null
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
  await configureAdhanAudioMode()

  const continueIfPlaying = opts?.continueIfPlaying !== false
  const forceRestart = opts?.forceRestart === true
  const seekSeconds = opts?.seekSeconds

  userStopped = false
  expectPlaying = true

  if (player && continueIfPlaying && !forceRestart && player.playing) {
    activateLockScreen(player, currentPrayer)
    notifyPlaying(true)
    return true
  }

  if (player && currentSource === source) {
    if (player.playing && continueIfPlaying && !forceRestart) {
      activateLockScreen(player, currentPrayer)
      notifyPlaying(true)
      return true
    }
    if (typeof seekSeconds === "number" && Number.isFinite(seekSeconds) && seekSeconds > 0) {
      await player.seekTo(seekSeconds)
    } else if (forceRestart || !player.playing) {
      await player.seekTo(0)
    }
    activateLockScreen(player, currentPrayer)
    player.play()
    notifyPlaying(true)
    return true
  }

  await teardownPlayer({ keepExpectation: true })
  expectPlaying = true
  userStopped = false

  const next = createAudioPlayer(source, {
    updateInterval: 500,
    keepAudioSessionActive: true,
  })
  next.loop = false
  next.volume = 1
  statusSub = next.addListener("playbackStatusUpdate", onPlaybackStatusUpdate)
  player = next
  currentSource = source

  if (typeof seekSeconds === "number" && Number.isFinite(seekSeconds) && seekSeconds > 0) {
    await next.seekTo(seekSeconds)
  }

  // Start the Android media foreground service before play so lock/background keeps audio.
  activateLockScreen(next, currentPrayer)
  await configureAdhanAudioMode()
  next.play()
  notifyPlaying(true)
  return true
}

/**
 * Play the full Adhan MP3 with a background-capable session + Android media FGS.
 * Falls back to the short lock-screen clip if the full file fails.
 */
export async function playAdhan(
  prayerName: PrayerName,
  opts?: PlayAdhanOptions
): Promise<boolean> {
  currentPrayer = prayerName
  expectPlaying = true
  void stopAdhanPreview()

  const selected = (await AsyncStorage.getItem("selected_adhan")) || DEFAULT_ADHAN_ID
  const fullSource = getAdhanFile(selected, prayerName)
  const allowFallback = opts?.allowFallback !== false

  try {
    return await playSource(fullSource, opts)
  } catch (e) {
    console.log("Full Adhan playback failed, trying short clip fallback:", e)
    if (!allowFallback) {
      expectPlaying = false
      currentPrayer = null
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
      currentPrayer = null
      notifyPlaying(false)
      return false
    }
  }
}

export async function stopAdhan() {
  userStopped = true
  expectPlaying = false
  await teardownPlayer()
}

export async function pauseAdhan() {
  userStopped = true
  expectPlaying = false
  if (!player) {
    notifyPlaying(false)
    return
  }
  try {
    player.pause()
  } catch {}
  notifyPlaying(false)
}

/** 12s Guide-tab sample. Separate player so it cannot steal a live prayer Adhan session. */
export async function startAdhanPreview(source: number): Promise<boolean> {
  if (playing || expectPlaying) return false

  await stopAdhanPreview()
  await configureAdhanAudioMode()

  const next = createAudioPlayer(source, {
    updateInterval: 500,
    keepAudioSessionActive: true,
  })
  next.loop = false
  next.volume = 1
  previewStatusSub = next.addListener("playbackStatusUpdate", status => {
    if (status.didJustFinish) void stopAdhanPreview()
  })
  previewPlayer = next
  next.play()
  return true
}

export async function stopAdhanPreview() {
  previewStatusSub?.remove()
  previewStatusSub = null
  const current = previewPlayer
  previewPlayer = null
  if (current) {
    try {
      current.pause()
    } catch {}
    try {
      current.remove()
    } catch {}
  }
  try {
    await configureAdhanAudioMode()
  } catch {}
}
