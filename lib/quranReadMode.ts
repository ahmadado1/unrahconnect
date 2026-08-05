import AsyncStorage from "@react-native-async-storage/async-storage"

export const QURAN_READ_MODE_KEY = "quran_read_mode"

export type QuranReadMode = "arabic_only" | "with_translation"

export function isQuranReadMode(value: string | null | undefined): value is QuranReadMode {
  return value === "arabic_only" || value === "with_translation"
}

export async function getQuranReadMode(): Promise<QuranReadMode | null> {
  try {
    const stored = await AsyncStorage.getItem(QURAN_READ_MODE_KEY)
    return isQuranReadMode(stored) ? stored : null
  } catch {
    return null
  }
}

export async function setQuranReadMode(mode: QuranReadMode): Promise<void> {
  await AsyncStorage.setItem(QURAN_READ_MODE_KEY, mode)
}

export function toggleQuranReadMode(mode: QuranReadMode): QuranReadMode {
  return mode === "arabic_only" ? "with_translation" : "arabic_only"
}
