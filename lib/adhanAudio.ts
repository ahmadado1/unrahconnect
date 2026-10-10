// lib/adhanAudio.ts
// Plays the full Adhan for a prayer (and the short Guide-tab preview).
// Audio keeps playing when the screen locks, and shows lock-screen controls.

import { DEFAULT_ADHAN_ID, getAdhanFile, getAdhanLockFile } from "@/lib/adhanCatalog"
import type { PrayerName } from "@/lib/prayerConstants"
import AsyncStorage from "@react-native-async-storage/async-storage"
import {
  createAudioPlayer,
  setAudioModeAsync,
  setIsAudioActiveAsync,
  type AudioPlayer,
  type AudioStatus,
} from "expo-audio"

// ─── Settings ──────────────────────────────────────────────────────────────
// AsyncStorage key where the user's chosen Adhan voice is saved.
// IMPORTANT: this must be the same key the Adhan settings screen uses.
const SELECTED_ADHAN_KEY = "selectedAdhan"

/** Short lock-screen clip for this voice and prayer (used as a fallback). */
function getLockFile(adhanId: string, prayerName?: PrayerName | string | null) {
  return getAdhanLockFile(adhanId, prayerName)
}

/** Reads the chosen Adhan voice, or the default if none is saved. */
async function getSelectedAdhanId(): Promise<string> {
  try {
    const saved = await AsyncStorage.getItem(SELECTED_ADHAN_KEY)
    return saved || DEFAULT_ADHAN_ID
  } catch {
    return DEFAULT_ADHAN_ID
  }
}

export type PlayAdhanOptions = {
  forceRestart?: boolean
  continueIfPlaying?: boolean
  seekSeconds?: number
  /** Wall-clock time the prayer began. Playback seeks to seconds since then. */
  prayerAtMs?: number
  /** Set to false to skip the short-clip fallback if the full file fails. */
  allowFallback?: boolean
}

type PlayingListener = (playing: boolean) => void

// ─── State ─────────────────────────────────────────────────────────────────
let player: AudioPlayer | null = null
let statusSub: { remove: () => void } | null = null
let currentSource: number | null = null
let playing = false
/** Prayer whose full Adhan is currently loaded / expected to play. */
let currentPrayer: PrayerName | null = null
/** True while we want Adhan to keep playing (resume after lock / interruption). */
let expectPlaying = false
/** True when the user (or app) stopped on purpose, so do not auto-resume. */
let userStopped = false

let previewPlayer: AudioPlayer | null = null
let previewStatusSub: { remove: () => void } | null = null

const listeners = new Set<PlayingListener>()

function notifyPlaying(next: boolean) {
  if (playing === next) return
  playing = next
  listeners.forEach(listener => listener(playing))
}

// ─── Lock screen ───────────────────────────────────────────────────────────
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

// ─── Audio session ─────────────────────────────────────────────────────────
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

// ─── Public state helpers ──────────────────────────────────────────────────
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

// ─── Player helpers ────────────────────────────────────────────────────────
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

/** Waits until the player knows the audio length (seconds). Returns 0 if it times out. */
async function waitForDuration(target: AudioPlayer, timeoutMs = 3000): Promise<number> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const d = target.duration
    if (typeof d === "number" && Number.isFinite(d) && d > 0) return d
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  return 0
}

/** Plays one audio file. Reuses the current player when it's the same file. */
async function playSource(
  source: number,
  opts?: PlayAdhanOptions
): Promise<boolean> {
  await configureAdhanAudioMode()

  const continueIfPlaying = opts?.continueIfPlaying !== false
  const forceRestart = opts?.forceRestart === true
  const seekSeconds = opts?.seekSeconds
  const prayerAtMs = opts?.prayerAtMs
  const continueFromPrayer = typeof prayerAtMs === "number" && Number.isFinite(prayerAtMs)

  userStopped = false
  expectPlaying = true

  // 1) Already playing and we're allowed to keep going: do nothing.
  if (!continueFromPrayer && player && continueIfPlaying && !forceRestart && player.playing) {
    activateLockScreen(player, currentPrayer)
    notifyPlaying(true)
    return true
  }

  // 2) Same file already loaded: seek and play it again.
  if (!continueFromPrayer && player && currentSource === source) {
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

  // 3) New file (or catching up to the prayer time): create a fresh player.
  await teardownPlayer({ keepExpectation: true })

  const next = createAudioPlayer(source, {
    updateInterval: 500,
    keepAudioSessionActive: true,
  })
  next.loop = false
  next.volume = 1
  statusSub = next.addListener("playbackStatusUpdate", onPlaybackStatusUpdate)
  player = next
  currentSource = source

  if (continueFromPrayer) {
    // Seek to "seconds since the prayer began", so opening the app mid-Adhan continues it.
    const duration = await waitForDuration(next)
    const elapsed = Math.max(0, (Date.now() - (prayerAtMs as number)) / 1000)
    const finished = duration > 0 ? elapsed >= duration - 0.2 : elapsed > 10 * 60
    if (finished) {
      await teardownPlayer()
      return false
    }
    const seek = duration > 0 ? Math.min(elapsed, Math.max(0, duration - 0.2)) : elapsed
    if (seek > 0.3) await next.seekTo(seek)
  } else if (typeof seekSeconds === "number" && Number.isFinite(seekSeconds) && seekSeconds > 0) {
    await next.seekTo(seekSeconds)
  }

  // Start the Android media foreground service before play so lock/background keeps audio.
  activateLockScreen(next, currentPrayer)
  await configureAdhanAudioMode()
  next.play()
  notifyPlaying(true)
  return true
}

// ─── Full Adhan ────────────────────────────────────────────────────────────
/**
 * Play the full Adhan MP3. Playback continues if the screen locks.
 * Falls back to the short clip only when `allowFallback` is left on.
 */
export async function playAdhan(
  prayerName: PrayerName,
  opts?: PlayAdhanOptions
): Promise<boolean> {
  currentPrayer = prayerName
  expectPlaying = true
  void stopAdhanPreview()

  const allowFallback = opts?.allowFallback !== false
  const selected = await getSelectedAdhanId()
  const fullSource = getAdhanFile(selected, prayerName)

  try {
    return await playSource(fullSource, opts)
  } catch (e) {
    console.log("Full Adhan playback failed:", e)
    if (!allowFallback) {
      expectPlaying = false
      currentPrayer = null
      notifyPlaying(false)
      return false
    }

    // Fallback: the short lock-screen clip.
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

/** Full Adhan. `fromStart` plays at 0. Otherwise seek to seconds since `prayerAtMs`. */
export async function playPrayerAdhan(
  prayerName: PrayerName,
  opts: { fromStart: boolean; prayerAtMs?: number }
) {
  return playAdhan(prayerName, {
    forceRestart: true,
    continueIfPlaying: false,
    allowFallback: false,
    prayerAtMs: opts.fromStart ? undefined : opts.prayerAtMs,
  })
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

// ─── Guide-tab preview ─────────────────────────────────────────────────────
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