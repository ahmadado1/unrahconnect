/**
 * One catalog for in-app playback and the 30-second notification clip.
 * Fajr uses `adhan_<id>_fajr` when that sheikh has a Fajr take.
 *
 * Files live in assets/adhan. Rebuild them with scripts/fetch-adhan-assets.mjs.
 */
export const ADHAN_RECITERS = [
  {
    id: "abdulbasit",
    legacyIds: ["1"],
    name: "Sheikh Abdul Basit Abdus Samad",
    style: "Egyptian",
    fajrLabel: "Abdul Basit Fajr",
  },
  {
    id: "trablsy",
    legacyIds: ["2"],
    name: "Sheikh Ahmad Al-Trablsy",
    style: "Kuwaiti",
    fajrLabel: "Al-Trablsy Fajr",
  },
  {
    id: "alafasy",
    legacyIds: ["3"],
    name: "Sheikh Mishary Rashid Alafasy",
    style: "Kuwaiti",
    fajrLabel: "Mishary Fajr",
  },
] as const

export type AdhanReciterId = (typeof ADHAN_RECITERS)[number]["id"]

export const DEFAULT_ADHAN_ID: AdhanReciterId = "alafasy"

export const ADHAN_OPTIONS = ADHAN_RECITERS

const FULL_TRACKS: Record<string, number> = {
  abdulbasit: require("../assets/adhan/adhan_abdulbasit.mp3"),
  abdulbasit_fajr: require("../assets/adhan/adhan_abdulbasit_fajr.mp3"),
  trablsy: require("../assets/adhan/adhan_trablsy.mp3"),
  trablsy_fajr: require("../assets/adhan/adhan_trablsy_fajr.mp3"),
  alafasy: require("../assets/adhan/adhan_alafasy.mp3"),
  alafasy_fajr: require("../assets/adhan/adhan_alafasy_fajr.mp3"),
}

/** Short clip used only if the full mp3 fails. Same voice, Fajr-aware. */
const LOCK_TRACKS: Record<string, number> = {
  abdulbasit: require("../assets/adhan/adhan_abdulbasit_lock.wav"),
  abdulbasit_fajr: require("../assets/adhan/adhan_abdulbasit_fajr_lock.wav"),
  trablsy: require("../assets/adhan/adhan_trablsy_lock.wav"),
  trablsy_fajr: require("../assets/adhan/adhan_trablsy_fajr_lock.wav"),
  alafasy: require("../assets/adhan/adhan_alafasy_lock.wav"),
  alafasy_fajr: require("../assets/adhan/adhan_alafasy_fajr_lock.wav"),
}

const LEGACY_IDS: Record<string, AdhanReciterId> = {}
for (const reciter of ADHAN_RECITERS) {
  for (const legacyId of reciter.legacyIds) LEGACY_IDS[legacyId] = reciter.id
}

export function isFajrPrayer(prayerName?: string | null) {
  return typeof prayerName === "string" && prayerName.toLowerCase() === "fajr"
}

export function resolveAdhanId(adhanId?: string | null): AdhanReciterId {
  const raw = String(adhanId ?? "").trim()
  if (ADHAN_RECITERS.some(reciter => reciter.id === raw)) return raw as AdhanReciterId
  return LEGACY_IDS[raw] ?? DEFAULT_ADHAN_ID
}

function trackKey(adhanId: string | null | undefined, fajr: boolean) {
  const id = resolveAdhanId(adhanId)
  return fajr ? `${id}_fajr` : id
}

/** Full Adhan mp3. Fajr maps to adhan_<id>_fajr, every other prayer to adhan_<id>. */
export function getAdhanFile(adhanId?: string | null, prayerName?: string | null) {
  const key = trackKey(adhanId, isFajrPrayer(prayerName))
  return FULL_TRACKS[key] ?? FULL_TRACKS[DEFAULT_ADHAN_ID]
}

/** 25-second lock clip for the same reciter and the same Fajr / daytime choice. */
export function getAdhanLockFile(adhanId?: string | null, prayerName?: string | null) {
  const key = trackKey(adhanId, isFajrPrayer(prayerName))
  return LOCK_TRACKS[key] ?? LOCK_TRACKS[DEFAULT_ADHAN_ID]
}

/**
 * Basename bundled for the notification sound.
 * Must match a file listed in app.json expo-notifications sounds.
 */
export function getAdhanLockSoundName(adhanId?: string | null, isFajr = false) {
  const id = resolveAdhanId(adhanId)
  return isFajr ? `adhan_${id}_fajr_lock.wav` : `adhan_${id}_lock.wav`
}

/**
 * Full recording. Used only inside the app after the notification is tapped.
 * The notification itself is the short wav, on iPhone and Android.
 */
export function getAdhanFullSoundName(adhanId?: string | null, isFajr = false) {
  const id = resolveAdhanId(adhanId)
  return isFajr ? `adhan_${id}_fajr.mp3` : `adhan_${id}.mp3`
}
