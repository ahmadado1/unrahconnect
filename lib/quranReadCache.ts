import AsyncStorage from "@react-native-async-storage/async-storage"
import { fetchWithTimeout } from "./fetchWithTimeout"
import { showKasraWithShadda } from "./quranArabicMarks"

export type ReadVerse = {
  number: number
  numberInQuran: number
  text: string
  translation: string
  page: number
  /**
   * Same verse in the KFGQPC Hafs encoding (quran.com), the text the Mushaf mode uses.
   * Read mode shows it with the KFGQPC font so letters and marks look exactly like the Mushaf.
   */
  qpc?: string
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
function withVisibleKasra(verses: ReadVerse[]): ReadVerse[] {
  return verses.map(verse => ({
    ...verse,
    text: showKasraWithShadda(verse.text),
  }))
}

export function peekCachedSurah(surah: number, language: string): ReadVerse[] | null {
  const cached = memoryCache.get(surahCacheKey(surah, language))
  return cached?.length ? withVisibleKasra(cached) : null
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
        memoryCache.set(key, withVisibleKasra(parsed))
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
    if (inMemory?.length) return withVisibleKasra(inMemory)

    const cached = await AsyncStorage.getItem(key)
    if (!cached) return null

    const parsed: ReadVerse[] = JSON.parse(cached)
    if (!Array.isArray(parsed) || parsed.length === 0) return null

    const verses = withVisibleKasra(parsed)
    memoryCache.set(key, verses)
    return verses
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
        let text = showKasraWithShadda(ayah.text)
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
    // The Mushaf-quality text (ensureQpcText) is added by the reader in the background.
    return combined
  } catch {
    return offlineFallback
  }
}

/** KFGQPC Hafs text of every verse of a surah (verse number → text), from quran.com. */
async function fetchQpcSurahText(surah: number): Promise<Record<number, string> | null> {
  const out: Record<number, string> = {}
  let page: number | null = 1
  try {
    while (page) {
      const res = await fetchWithTimeout(
        `https://api.quran.com/api/v4/verses/by_chapter/${surah}?words=true&word_fields=text_qpc_hafs&per_page=50&page=${page}`,
        {},
        12000
      )
      const json = (await res.json()) as {
        verses?: { verse_number: number; words?: { char_type_name?: string; text_qpc_hafs?: string }[] }[]
        pagination?: { next_page?: number | null }
      }
      for (const v of json.verses ?? []) {
        const words = (v.words ?? [])
          .filter(w => w.char_type_name !== "end")
          .map(w => (w.text_qpc_hafs ?? "").trim())
          .filter(Boolean)
        if (words.length) out[v.verse_number] = words.join(" ")
      }
      page = json.pagination?.next_page ?? null
    }
  } catch {
    return null
  }
  return Object.keys(out).length ? out : null
}

/**
 * Adds the KFGQPC text to verses that don't have it yet (also old saved surahs) and saves it,
 * so it works offline next time. Returns the verses unchanged if it can't download.
 */
export async function ensureQpcText(surah: number, language: string, verses: ReadVerse[]): Promise<ReadVerse[]> {
  if (!verses.length || verses.every(v => v.qpc)) return verses
  const qpc = await fetchQpcSurahText(surah)
  if (!qpc) return verses
  const merged = verses.map(v => (qpc[v.number] ? { ...v, qpc: qpc[v.number] } : v))
  // Only trust it if (almost) every verse got its text.
  if (merged.filter(v => v.qpc).length < verses.length) return verses
  await writeCachedSurah(surah, language, merged).catch(() => {})
  return merged
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
