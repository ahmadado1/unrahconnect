// Full Adhan on iPhone, in 30-second parts.
//
// iPhone only plays a notification sound if it is shorter than 30 seconds. So each Adhan is cut
// into parts of 29.8 s that start every 29 s (a little overlap, so there is no gap between parts).
// At prayer time the FIRST part comes with the normal prayer notification. The next parts come
// as notifications with the same title (iPhone plays no sound for a notification without text).
// iPhone stacks them as one group under the app, and the user hears the whole Adhan, back to back.
//
// The parts are not inside the app (that would add ~34 MB). The app downloads only the parts of
// the chosen voice (normal + Fajr, about 3 to 6 MB) from the website, and installs them in
// Library/Sounds, where iPhone looks for notification sounds.
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as FileSystem from "expo-file-system/legacy"
import { Platform } from "react-native"
import {
  canInstallIosSounds,
  installIosSound,
  iosHasNotificationSound,
  removeIosSounds,
} from "@/modules/adhan-alarm"

const PARTS_BASE = "https://myumrahconnect.com/adhan-parts/"
const MANIFEST_KEY = "adhan_parts_manifest_v1"
const READY_KEY = (track: string) => `adhan_parts_ready_v1_${track}`

/** A new part starts every 29 seconds (each part is 29.8 s long). */
export const PART_STEP_SECONDS = 29

/** "alafasy" / "alafasy_fajr" */
function trackFor(adhanId: string, isFajr: boolean) {
  return isFajr ? `${adhanId}_fajr` : adhanId
}

export function partSoundName(track: string, index: number) {
  return `uc_${track}_${String(index + 1).padStart(2, "0")}.caf`
}

/** True on iPhone builds that have the native code to install sounds. */
export function chainSupported() {
  return Platform.OS === "ios" && canInstallIosSounds()
}

async function loadManifest(): Promise<Record<string, number> | null> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 10_000)
    const res = await fetch(`${PARTS_BASE}manifest.json`, { cache: "no-store", signal: controller.signal }).finally(() =>
      clearTimeout(timer)
    )
    if (res.ok) {
      const json = (await res.json()) as Record<string, number>
      await AsyncStorage.setItem(MANIFEST_KEY, JSON.stringify(json)).catch(() => {})
      return json
    }
  } catch {}
  try {
    const raw = await AsyncStorage.getItem(MANIFEST_KEY)
    return raw ? (JSON.parse(raw) as Record<string, number>) : null
  } catch {
    return null
  }
}

/** Download + install every part of one track. Returns the number of parts, or 0 if it failed. */
async function installTrack(track: string, count: number): Promise<number> {
  const tmpDir = `${FileSystem.cacheDirectory}adhan-parts/`
  await FileSystem.makeDirectoryAsync(tmpDir, { intermediates: true }).catch(() => {})
  for (let i = 0; i < count; i++) {
    const name = partSoundName(track, i)
    if (iosHasNotificationSound(name)) continue
    const tmp = `${tmpDir}${name}`
    try {
      const result = await FileSystem.downloadAsync(`${PARTS_BASE}${name}`, tmp)
      if (result.status !== 200) return 0
      const ok = installIosSound(tmp, name)
      await FileSystem.deleteAsync(tmp, { idempotent: true }).catch(() => {})
      if (!ok) return 0
    } catch {
      return 0
    }
  }
  await AsyncStorage.setItem(READY_KEY(track), String(count)).catch(() => {})
  return count
}

/**
 * Make sure the parts of this voice (normal + Fajr) are on the phone.
 * Safe to call often: parts already installed are skipped. Old voices are removed to save space.
 */
export async function ensureAdhanParts(adhanId: string): Promise<boolean> {
  if (!chainSupported()) return false
  const manifest = await loadManifest()
  if (!manifest) return false
  let ok = true
  for (const isFajr of [false, true]) {
    const track = trackFor(adhanId, isFajr)
    const count = manifest[track]
    if (!count) {
      ok = false
      continue
    }
    if ((await installTrack(track, count)) === 0) ok = false
  }
  // Free space: remove parts of the other voices.
  for (const track of Object.keys(manifest)) {
    const voice = track.replace(/_fajr$/, "")
    if (voice === adhanId) continue
    if (removeIosSounds(`uc_${track}_`) > 0) await AsyncStorage.removeItem(READY_KEY(track)).catch(() => {})
  }
  return ok
}

/**
 * Sound names of the parts for this prayer, in order, or [] if they are not installed yet
 * (then the normal 30-second Adhan notification is used).
 */
export async function adhanPartSounds(adhanId: string, isFajr: boolean): Promise<string[]> {
  if (!chainSupported()) return []
  const track = trackFor(adhanId, isFajr)
  const count = Number(await AsyncStorage.getItem(READY_KEY(track)).catch(() => null))
  if (!count) return []
  const names = Array.from({ length: count }, (_, i) => partSoundName(track, i))
  // A part missing (for example the phone cleaned space): don't use a broken chain.
  if (!iosHasNotificationSound(names[0]) || !iosHasNotificationSound(names[count - 1])) {
    await AsyncStorage.removeItem(READY_KEY(track)).catch(() => {})
    return []
  }
  return names
}
