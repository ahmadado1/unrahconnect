import AsyncStorage from "@react-native-async-storage/async-storage"
import { fetchWithTimeout } from "./fetchWithTimeout"

export type ReadVerse = {
  number: number
  numberInQuran: number
  text: string
  translation: string
  page: number
}

const TRANSLATION_EDITIONS: Record<string, string> = {
  bn: "bn.bengali",
  fr: "fr.hamidullah",
  ur: "ur.jalandhry",
  tr: "tr.diyanet",
  ar: "ar.muyassar",
  en: "en.sahih",
}

const memoryCache = new Map<string, ReadVerse[]>()

export function normalizeReadLanguage(language: string) {
  const base = language.split("-")[0].toLowerCase()
  return TRANSLATION_EDITIONS[base] ? base : "en"
}

export function getTranslationEdition(language: string) {
  return TRANSLATION_EDITIONS[normalizeReadLanguage(language)]
}

export function surahCacheKey(surah: number, language: string) {
  return `quran_surah_${surah}_${normalizeReadLanguage(language)}`
}

/** Instant read from in-memory cache (no AsyncStorage). */
export function peekCachedSurah(surah: number, language: string): ReadVerse[] | null {
  const cached = memoryCache.get(surahCacheKey(surah, language))
  return cached?.length ? cached : null
}

/** Load all cached surahs for a language into memory for instant read mode. */
export async function warmReadCacheForLanguage(language: string): Promise<number> {
  const lang = normalizeReadLanguage(language)
  const keys = Array.from({ length: 114 }, (_, i) => surahCacheKey(i + 1, lang))
  const pairs = await AsyncStorage.multiGet(keys)
  let loaded = 0

  pairs.forEach(([key, value]) => {
    if (!value) return
    try {
      const parsed: ReadVerse[] = JSON.parse(value)
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryCache.set(key, parsed)
        loaded++
      }
    } catch {}
  })

  return loaded
}

export async function readCachedSurah(
  surah: number,
  language: string
): Promise<ReadVerse[] | null> {
  try {
    const key = surahCacheKey(surah, language)
    const inMemory = memoryCache.get(key)
    if (inMemory?.length) return inMemory

    const cached = await AsyncStorage.getItem(key)
    if (!cached) return null

    const parsed: ReadVerse[] = JSON.parse(cached)
    if (!Array.isArray(parsed) || parsed.length === 0) return null

    memoryCache.set(key, parsed)
    return parsed
  } catch {
    return null
  }
}

export async function writeCachedSurah(
  surah: number,
  language: string,
  verses: ReadVerse[]
): Promise<void> {
  const key = surahCacheKey(surah, language)
  memoryCache.set(key, verses)
  await AsyncStorage.setItem(key, JSON.stringify(verses))
}

/** Prefer requested language; fall back to any offline language so reading works offline. */
export async function readSurahOfflineFirst(
  surah: number,
  language: string
): Promise<ReadVerse[] | null> {
  const primary = await readCachedSurah(surah, language)
  if (primary?.length) return primary

  const fallbackLangs = ["en", "ar", "bn", "fr", "ur", "tr"].filter(
    code => code !== normalizeReadLanguage(language)
  )
  for (const code of fallbackLangs) {
    const cached = await readCachedSurah(surah, code)
    if (cached?.length) return cached
  }
  return null
}

export async function fetchAndCacheSurah(
  surah: number,
  language: string
): Promise<ReadVerse[] | null> {
  const existing = await readCachedSurah(surah, language)
  if (existing?.length) return existing

  // Offline fallback: Arabic text from another language cache
  const offlineFallback = await readSurahOfflineFirst(surah, language)

  try {
    const arabicRes = await fetchWithTimeout(
      `https://api.alquran.cloud/v1/surah/${surah}/quran-uthmani`,
      {},
      10000
    )
    const arabicData = await arabicRes.json()

    if (arabicData.status !== "OK" || !arabicData.data?.ayahs) {
      return offlineFallback
    }

    let translations: string[] = []
    try {
      const edition = getTranslationEdition(language)
      const transRes = await fetchWithTimeout(
        `https://api.alquran.cloud/v1/surah/${surah}/${edition}`,
        {},
        10000
      )
      const transData = await transRes.json()
      if (transData.status === "OK") {
        translations = transData.data.ayahs.map((a: { text: string }) => a.text)
      }
    } catch {}

    const combined: ReadVerse[] = arabicData.data.ayahs.map(
      (ayah: { numberInSurah: number; number: number; text: string; page: number }, index: number) => {
        let text = ayah.text
        if (ayah.numberInSurah === 1 && surah !== 1 && surah !== 9) {
          const words = text.split(" ")
          if (words.length > 4) text = words.slice(4).join(" ").trim()
        }
        return {
          number: ayah.numberInSurah,
          numberInQuran: ayah.number,
          text,
          translation: translations[index] ?? "",
          page: ayah.page,
        }
      }
    )

    // Always cache Arabic for offline — even if translation fetch failed.
    if (!combined.length) return offlineFallback

    await writeCachedSurah(surah, language, combined)
    return combined
  } catch {
    return offlineFallback
  }
}

export async function downloadSurahList(): Promise<boolean> {
  try {
    const cached = await AsyncStorage.getItem("quran_surahs")
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        if (Array.isArray(parsed) && parsed.length >= 114) return true
      } catch {}
    }

    const res = await fetchWithTimeout("https://api.alquran.cloud/v1/surah", {}, 10000)
    const data = await res.json()
    if (data.code !== 200 || !Array.isArray(data.data)) return false

    await AsyncStorage.setItem("quran_surahs", JSON.stringify(data.data))
    return true
  } catch {
    return false
  }
}

export async function getMissingSurahNumbers(language: string): Promise<number[]> {
  const keys = Array.from({ length: 114 }, (_, i) => surahCacheKey(i + 1, language))
  const pairs = await AsyncStorage.multiGet(keys)
  const missing: number[] = []

  pairs.forEach(([, value], index) => {
    if (!value) {
      missing.push(index + 1)
      return
    }
    try {
      const parsed = JSON.parse(value)
      if (!Array.isArray(parsed) || parsed.length === 0) missing.push(index + 1)
    } catch {
      missing.push(index + 1)
    }
  })

  return missing
}
