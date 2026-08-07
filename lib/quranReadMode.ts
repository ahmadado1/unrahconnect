import AsyncStorage from "@react-native-async-storage/async-storage"

export const QURAN_READ_MODE_KEY = "quran_read_mode"

/** Mushaf = page layout; Verses = ayah cards with translation */
export type QuranReadMode = "mushaf" | "verses"

/** In-memory cache so the mode is available sync across screens. */
let cachedMode: QuranReadMode | null = null

function migrateLegacyMode(value: string | null | undefined): QuranReadMode | null {
  if (value === "mushaf" || value === "verses") return value
  // Previous "Arabic Only" ≈ mushaf layout; "With Translation" ≈ verse cards
  if (value === "arabic_only") return "mushaf"
  if (value === "with_translation") return "verses"
  return null
}

export function isQuranReadMode(value: string | null | undefined): value is QuranReadMode {
  return value === "mushaf" || value === "verses"
}

export function getCachedQuranReadMode(): QuranReadMode | null {
  return cachedMode
}

export async function getQuranReadMode(): Promise<QuranReadMode | null> {
  if (cachedMode) return cachedMode

  try {
    const stored = await AsyncStorage.getItem(QURAN_READ_MODE_KEY)
    const mode = migrateLegacyMode(stored)
    if (mode) {
      cachedMode = mode
      // Normalize legacy values on disk
      if (stored !== mode) {
        await AsyncStorage.setItem(QURAN_READ_MODE_KEY, mode).catch(() => {})
      }
      return mode
    }
    return null
  } catch {
    return cachedMode
  }
}

export async function setQuranReadMode(mode: QuranReadMode): Promise<void> {
  cachedMode = mode
  try {
    await AsyncStorage.setItem(QURAN_READ_MODE_KEY, mode)
  } catch (error) {
    console.warn("Failed to persist Quran read mode", error)
  }
}

export function toggleQuranReadMode(mode: QuranReadMode): QuranReadMode {
  return mode === "mushaf" ? "verses" : "mushaf"
}
