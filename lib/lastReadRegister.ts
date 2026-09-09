export const LAST_READ_MAX_VISIBLE = 5

export type LastReadEntry = {
  surahNumber: number
  englishName: string
  arabicName: string
  ayah: number
  registeredAt: number
}

export type LastReadState = {
  /** Most recent first. At most LAST_READ_MAX_VISIBLE items. */
  entries: LastReadEntry[]
  /** Registrations since the last reset (1–5, then the next resets). */
  registrationCount: number
}

export function emptyLastReadState(): LastReadState {
  return { entries: [], registrationCount: 0 }
}

/**
 * Push a new last-read registration onto the front of the list.
 * Does not dedupe — reading the same Surah again is a new registration.
 * After 5 visible entries, the 6th registration clears the list to just that entry.
 */
export function registerLastRead(
  current: LastReadState,
  newEntry: LastReadEntry,
): LastReadState {
  const entries = Array.isArray(current?.entries) ? current.entries : []
  const count = Number.isFinite(current?.registrationCount)
    ? current.registrationCount
    : entries.length

  if (entries.length >= LAST_READ_MAX_VISIBLE) {
    return {
      entries: [newEntry],
      registrationCount: 1,
    }
  }

  return {
    entries: [newEntry, ...entries].slice(0, LAST_READ_MAX_VISIBLE),
    registrationCount: count + 1,
  }
}
