import AsyncStorage from "@react-native-async-storage/async-storage"
import * as FileSystem from "expo-file-system/legacy"
import { fetchWithTimeout } from "./fetchWithTimeout"
import { resolveJuzNumber } from "./mushafJuz"

export const TOTAL_MUSHAF_PAGES = 604
export const QURAN_DOWNLOAD_FLAG_KEY = "quran_fully_cached_v2"
export const QURAN_DOWNLOAD_PROGRESS_KEY = "quran_download_progress_v2"

function getCacheDir() {
  if (!FileSystem.documentDirectory) {
    throw new Error("Document directory unavailable")
  }
  return `${FileSystem.documentDirectory}quran_pages_v2/`
}
const PAGE_API =
  "https://api.quran.com/api/v4/verses/by_page"

export type MushafWord = {
  text_uthmani: string
  line_number: number
  page_number: number
  char_type_name: string
  position: number
}

export type MushafVerse = {
  verse_number: number
  verse_key: string
  juz_number: number
  words: MushafWord[]
}

export type MushafPageData = {
  verses: MushafVerse[]
  juzNumber: number
}

function pageFilePath(page: number) {
  return `${getCacheDir()}page_${page}.json`
}

export function pageApiUrl(page: number) {
  return `${PAGE_API}/${page}?words=true&word_fields=text_uthmani,line_number,page_number&fields=juz_number`
}

export function extractJuzNumber(verses: MushafVerse[], pageHint?: number): number {
  const pageFromWords = verses[0]?.words?.find(
    w => typeof w.page_number === "number",
  )?.page_number
  const page = pageHint ?? pageFromWords
  for (const verse of verses) {
    const n = Number(verse.juz_number)
    if (Number.isInteger(n) && n >= 1 && n <= 30) return n
  }
  return resolveJuzNumber(undefined, page)
}

export function slimPageDataFromJson(json: { verses?: any[] }, pageHint?: number): MushafPageData {
  const verses: MushafVerse[] = (json.verses ?? []).map(verse => ({
    verse_number: verse.verse_number,
    verse_key: verse.verse_key,
    juz_number: verse.juz_number,
    words: (verse.words ?? []).map((word: any) => ({
      text_uthmani: word.text_uthmani,
      line_number: word.line_number,
      page_number: word.page_number,
      char_type_name: word.char_type_name,
      position: word.position,
    })),
  }))

  return {
    verses,
    juzNumber: extractJuzNumber(verses, pageHint),
  }
}

async function ensureCacheDir() {
  const cacheDir = getCacheDir()
  const info = await FileSystem.getInfoAsync(cacheDir)
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true })
  }
}

async function readLegacyAsyncStoragePage(page: number): Promise<MushafPageData | null> {
  try {
    const legacy = await AsyncStorage.getItem(`quran_page_v2_${page}`)
    if (!legacy) return null
    const parsed: MushafPageData = JSON.parse(legacy)
    await writeCachedPage(page, parsed)
    await AsyncStorage.removeItem(`quran_page_v2_${page}`)
    return parsed
  } catch {
    return null
  }
}

export async function readCachedPage(page: number): Promise<MushafPageData | null> {
  try {
    await ensureCacheDir()
    const path = pageFilePath(page)
    const info = await FileSystem.getInfoAsync(path)
    if (!info.exists) return readLegacyAsyncStoragePage(page)

    const raw = await FileSystem.readAsStringAsync(path)
    const parsed: MushafPageData = JSON.parse(raw)
    if (!Array.isArray(parsed?.verses) || parsed.verses.length === 0) {
      await FileSystem.deleteAsync(path, { idempotent: true }).catch(() => {})
      return null
    }
    return { ...parsed, juzNumber: extractJuzNumber(parsed.verses, page) }
  } catch {
    return null
  }
}

export async function writeCachedPage(page: number, data: MushafPageData): Promise<void> {
  await ensureCacheDir()
  await FileSystem.writeAsStringAsync(pageFilePath(page), JSON.stringify(data))
}

/** First verse on a Madani mushaf page (for Mushaf → Verse view handoff). */
export async function getFirstVerseOnPage(
  page: number,
): Promise<{ surah: number; ayah: number } | null> {
  const data = await fetchAndCachePage(page)
  const key = data?.verses?.[0]?.verse_key
  if (!key) return null
  const [surah, ayah] = key.split(":").map(Number)
  if (!surah || !ayah) return null
  return { surah, ayah }
}

export async function fetchAndCachePage(page: number): Promise<MushafPageData | null> {
  const cached = await readCachedPage(page)
  if (cached) return cached

  try {
    const res = await fetchWithTimeout(pageApiUrl(page), {}, 10000)
    if (!res.ok) return null

    const json = await res.json()
    const data = slimPageDataFromJson(json, page)
    if (!data.verses.length) return null

    try {
      await writeCachedPage(page, data)
    } catch (e) {
      console.warn(`[QuranCache] Failed to cache page ${page}:`, e)
    }
    return data
  } catch {
    return null
  }
}

/** Warm current ±1 so mushaf swipe feels instant. */
export function preloadAdjacentPages(page: number): void {
  const targets = [page - 1, page, page + 1].filter(
    p => p >= 1 && p <= TOTAL_MUSHAF_PAGES,
  )
  for (const p of targets) {
    void fetchAndCachePage(p)
  }
}

export async function getMissingPageNumbers(): Promise<number[]> {
  try {
    await ensureCacheDir()
    const files = await FileSystem.readDirectoryAsync(getCacheDir())
    const cached = new Set(
      files
        .filter(name => name.startsWith("page_") && name.endsWith(".json"))
        .map(name => parseInt(name.slice(5, -5), 10))
        .filter(n => !Number.isNaN(n))
    )
    const missing: number[] = []
    for (let page = 1; page <= TOTAL_MUSHAF_PAGES; page++) {
      if (!cached.has(page)) missing.push(page)
    }
    return missing
  } catch {
    return Array.from({ length: TOTAL_MUSHAF_PAGES }, (_, i) => i + 1)
  }
}

export async function getCachedPageCount(): Promise<number> {
  const missing = await getMissingPageNumbers()
  return TOTAL_MUSHAF_PAGES - missing.length
}

/** Page-only check — prefer `isQuranFullyCached` from quranDownload for full readiness. */
export async function areMushafPagesCached(): Promise<boolean> {
  try {
    const missing = await getMissingPageNumbers()
    return missing.length === 0
  } catch {
    return false
  }
}

export async function setDownloadProgress(done: number, total: number) {
  await AsyncStorage.setItem(
    QURAN_DOWNLOAD_PROGRESS_KEY,
    JSON.stringify({ done, total, updatedAt: Date.now() })
  )
}

export async function markQuranFullyCached() {
  await AsyncStorage.setItem(QURAN_DOWNLOAD_FLAG_KEY, "true")
  await setDownloadProgress(TOTAL_MUSHAF_PAGES, TOTAL_MUSHAF_PAGES)
}

export async function clearQuranDownloadFlag() {
  await AsyncStorage.removeItem(QURAN_DOWNLOAD_FLAG_KEY)
  await AsyncStorage.removeItem(QURAN_DOWNLOAD_PROGRESS_KEY)
}
