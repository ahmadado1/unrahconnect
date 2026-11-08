import AsyncStorage from "@react-native-async-storage/async-storage"
import * as FileSystem from "expo-file-system/legacy"
import { fetchWithTimeout } from "./fetchWithTimeout"
import { showKasraWithShadda } from "./quranArabicMarks"
import { readCachedPage, TOTAL_MUSHAF_PAGES } from "./quranPageCache"
import { surahPageRange } from "./quranPages"

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

// Keeps only the last few opened surahs in memory. Keeping all 114 (whole Quran with
// translation and Mushaf text) used tens of MB and got the app killed on low-memory phones.
const MEMORY_SURAHS = 6
class SmallCache extends Map<string, ReadVerse[]> {
  get(key: string) {
    const value = super.get(key)
    if (value) {
      // Mark as recently used
      super.delete(key)
      super.set(key, value)
    }
    return value
  }
  set(key: string, value: ReadVerse[]) {
    super.delete(key)
    super.set(key, value)
    while (this.size > MEMORY_SURAHS) {
      const oldest = this.keys().next().value
      if (oldest === undefined) break
      super.delete(oldest)
    }
    return this
  }
}
const memoryCache = new SmallCache()

/** True when most verses have a translation. A surah saved while the translation failed is incomplete. */
export function hasTranslation(verses: ReadVerse[] | null | undefined, language?: string): boolean {
  if (!verses?.length) return false
  const withText = verses.filter(v => v.translation?.trim()).length
  if (withText < Math.ceil(verses.length * 0.8)) return false
  return language ? translationMatchesLanguage(verses, language) : true
}

/**
 * Checks the saved translation is really in the chosen language.
 * Older app versions could save the English translation under another language.
 */
function translationMatchesLanguage(verses: ReadVerse[], language: string): boolean {
  const lang = normalizeReadLanguage(language)
  const sample = verses.slice(0, 8).map(v => v.translation ?? "").join(" ")
  if (!sample.trim()) return false
  const arabicScript = /[\u0600-\u06FF]/.test(sample)
  switch (lang) {
    case "ar":
      return arabicScript && !/[ےںٹڈڑگ]/.test(sample)
    case "ur":
      // Urdu uses letters Arabic doesn't (ے ں ٹ ڈ ڑ گ)
      return arabicScript && /[ےںٹڈڑگ]/.test(sample)
    case "bn":
      return /[\u0980-\u09FF]/.test(sample)
    case "tr":
      return /[çğıöşüÇĞİÖŞÜ]/.test(sample)
    case "fr":
      return !/[ğışİ]/.test(sample) && /[éèàêâçùûîô]|\b(le|la|les|des|du|et|qui|est)\b/i.test(sample)
    default:
      return !arabicScript && /\b(the|and|of|is|you|who)\b/i.test(sample)
  }
}

/** Download the translation for one surah, trying twice (big surahs can be slow). */
async function fetchTranslation(surah: number, language: string): Promise<string[] | null> {
  const edition = getTranslationEdition(language)
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetchWithTimeout(
        `https://api.alquran.cloud/v1/surah/${surah}/${edition}`,
        {},
        attempt === 0 ? 15000 : 25000
      )
      const data = await res.json()
      if (data?.status === "OK" && Array.isArray(data.data?.ayahs)) {
        return data.data.ayahs.map((a: { text: string }) => a.text ?? "")
      }
    } catch {}
    if (attempt === 0) await new Promise(r => setTimeout(r, 1500))
  }
  return null
}

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

// ---------------------------------------------------------------------------
// Where saved surahs live.
// On Android, AsyncStorage is capped at 6 MB. The 114 surahs (Arabic + translation + Mushaf text)
// are bigger than that, so the storage filled up ("database or disk is full") and EVERY save in the
// app started failing (login, settings, progress) — a big cause of Android problems.
// Surahs are now saved as small files on the phone (like the Mushaf pages and tafsir).
// Old copies in AsyncStorage are moved to files the first time they are read, which frees the space.
// ---------------------------------------------------------------------------
const READ_DIR = FileSystem.documentDirectory ? `${FileSystem.documentDirectory}quran_read_v1/` : null
let readDirReady: Promise<void> | null = null

function surahFile(key: string) {
  return `${READ_DIR}${key}.json`
}

async function ensureReadDir() {
  if (!READ_DIR) return
  if (!readDirReady) {
    readDirReady = (async () => {
      const info = await FileSystem.getInfoAsync(READ_DIR)
      if (!info.exists) await FileSystem.makeDirectoryAsync(READ_DIR, { intermediates: true })
    })().catch(() => {
      readDirReady = null
    })
  }
  await readDirReady
}

/** Read one saved surah (file first, then the old AsyncStorage copy, which gets moved to a file). */
async function storedGet(key: string): Promise<string | null> {
  if (READ_DIR) {
    try {
      const path = surahFile(key)
      const info = await FileSystem.getInfoAsync(path)
      if (info.exists) return await FileSystem.readAsStringAsync(path)
    } catch {}
  }
  try {
    const legacy = await AsyncStorage.getItem(key)
    if (legacy && READ_DIR) {
      // Move it out of AsyncStorage to free space there.
      await storedSet(key, legacy)
    }
    return legacy
  } catch {
    return null
  }
}

/** Save one surah as a file (and drop any old AsyncStorage copy). */
async function storedSet(key: string, value: string): Promise<void> {
  if (!READ_DIR) {
    await AsyncStorage.setItem(key, value).catch(() => {})
    return
  }
  try {
    await ensureReadDir()
    await FileSystem.writeAsStringAsync(surahFile(key), value)
    await AsyncStorage.removeItem(key).catch(() => {})
  } catch (e) {
    console.log("Surah save error:", e)
  }
}

async function storedGetMany(keys: string[]): Promise<[string, string | null][]> {
  return Promise.all(keys.map(async key => [key, await storedGet(key)] as [string, string | null]))
}

/** Instant read from in-memory cache (no storage read). */
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

/**
 * Used to load all 114 surahs into memory. That used too much memory on budget Android phones,
 * so now it only loads the surah the reader was last on (others load from files when opened).
 * Returns how many surahs are saved on the phone for this language.
 */
export async function warmReadCacheForLanguage(language: string): Promise<number> {
  const lang = normalizeReadLanguage(language)
  try {
    if (READ_DIR) {
      const info = await FileSystem.getInfoAsync(READ_DIR)
      if (!info.exists) return 0
      const files = await FileSystem.readDirectoryAsync(READ_DIR)
      return files.filter(f => f.endsWith(`_${lang}.json`)).length
    }
  } catch {}
  return 0
}

export async function readCachedSurah(
  surah: number,
  language: string
): Promise<ReadVerse[] | null> {
  try {
    const key = surahCacheKey(surah, language)
    const inMemory = memoryCache.get(key)
    if (inMemory?.length) return withVisibleKasra(inMemory)

    const cached = await storedGet(key)
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
  await storedSet(key, JSON.stringify(verses))
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
    // Show the Arabic only; a translation in another language confuses readers.
    if (cached?.length) return cached.map(v => ({ ...v, translation: "" }))
  }
  return null
}

export async function fetchAndCacheSurah(
  surah: number,
  language: string
): Promise<ReadVerse[] | null> {
  const existing = await readCachedSurah(surah, language)
  if (existing?.length && hasTranslation(existing, language)) return existing

  // Saved earlier without a translation: download only the translation and fill it in.
  if (existing?.length) {
    const translations = await fetchTranslation(surah, language)
    if (!translations) return existing
    const repaired = existing.map((v, i) => ({ ...v, translation: translations[i] ?? "" }))
    await writeCachedSurah(surah, language, repaired).catch(() => {})
    return repaired
  }

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

    const translations = (await fetchTranslation(surah, language)) ?? []

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

/**
 * KFGQPC text of a surah built from the saved Mushaf pages (no internet needed).
 * The full-Quran download saves all 604 pages with this text, so Read mode can show
 * the same Madinah font offline. Returns null if a page is missing or has old text.
 */
async function qpcFromCachedPages(surah: number): Promise<Record<number, string> | null> {
  const { start, end } = surahPageRange(surah)
  // A surah can end on the page where the next one starts, so read one page more.
  const last = Math.min(end + 1, TOTAL_MUSHAF_PAGES)
  const out: Record<number, string> = {}
  for (let page = start; page <= last; page++) {
    const data = await readCachedPage(page).catch(() => null)
    if (!data?.verses?.length) {
      if (page > end) break // the extra page is optional
      return null
    }
    for (const verse of data.verses) {
      const [s, a] = String(verse.verse_key ?? "").split(":").map(Number)
      if (s !== surah || !a) continue
      const words = [...(verse.words ?? [])]
        .filter(w => w.char_type_name !== "end")
        .sort((x, y) => x.position - y.position)
      if (words.some(w => w.text_uthmani?.trim() && !w.text_qpc_hafs?.trim())) return null
      const text = words.map(w => (w.text_qpc_hafs ?? "").trim()).filter(Boolean).join(" ")
      if (text) out[a] = out[a] ? `${out[a]} ${text}` : text
    }
  }
  return Object.keys(out).length ? out : null
}

/** One page of the quran.com chapter API, tried twice (long surahs need several pages). */
async function fetchQpcChapterPage(surah: number, page: number): Promise<Response> {
  const url = `https://api.quran.com/api/v4/verses/by_chapter/${surah}?words=true&word_fields=text_qpc_hafs&per_page=50&page=${page}`
  try {
    return await fetchWithTimeout(url, {}, 15000)
  } catch {
    return await fetchWithTimeout(url, {}, 20000)
  }
}

/** KFGQPC Hafs text of every verse of a surah (verse number → text), from quran.com. */
async function fetchQpcSurahText(surah: number): Promise<Record<number, string> | null> {
  const out: Record<number, string> = {}
  let page: number | null = 1
  try {
    while (page) {
      const res = await fetchQpcChapterPage(surah, page)
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
  // Saved Mushaf pages first (works offline), then the internet.
  const fromPages = await qpcFromCachedPages(surah)
  const fromPagesComplete = fromPages && verses.every(v => fromPages[v.number])
  const qpc = fromPagesComplete ? fromPages : await fetchQpcSurahText(surah)
  if (!qpc) return verses
  const merged = verses.map(v => (qpc[v.number] ? { ...v, qpc: qpc[v.number] } : v))
  // Only trust it if (almost) every verse got its text.
  if (merged.filter(v => v.qpc).length < verses.length) return verses
  // Don't save another language's translation under this language (it would stick forever).
  const toSave = hasTranslation(merged, language) ? merged : merged.map(v => ({ ...v, translation: "" }))
  await writeCachedSurah(surah, language, toSave).catch(() => {})
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
  const pairs = await storedGetMany(keys)
  const missing: number[] = []

  pairs.forEach(([, value], index) => {
    if (!value) {
      missing.push(index + 1)
      return
    }
    try {
      const parsed = JSON.parse(value)
      if (!Array.isArray(parsed) || parsed.length === 0 || !hasTranslation(parsed, language)) missing.push(index + 1)
    } catch {
      missing.push(index + 1)
    }
  })

  return missing
}

/**
 * One-time clean-up on app start: moves every surah saved in AsyncStorage (old app versions)
 * into files, so Android's 6 MB AsyncStorage has room again for login, settings and progress.
 */
export async function migrateLegacySurahCache(): Promise<number> {
  if (!READ_DIR) return 0
  try {
    const keys = (await AsyncStorage.getAllKeys()).filter(k => /^quran_surah_\d+_[a-z]+$/.test(k))
    let moved = 0
    for (const key of keys) {
      try {
        const value = await AsyncStorage.getItem(key)
        if (value) {
          await storedSet(key, value) // writes the file, then removes the AsyncStorage copy
          moved++
        } else {
          await AsyncStorage.removeItem(key)
        }
      } catch {}
    }
    return moved
  } catch {
    return 0
  }
}
