import AsyncStorage from "@react-native-async-storage/async-storage"
import * as FileSystem from "expo-file-system/legacy"
import { fetchWithTimeout } from "./fetchWithTimeout"
import { resolveJuzNumber } from "./mushafJuz"
import { isUsableMushafPage } from "./mushafPageValidity"

export { isUsableMushafPage }

export const TOTAL_MUSHAF_PAGES = 604
export const QURAN_DOWNLOAD_FLAG_KEY = "quran_fully_cached_v2"
export const QURAN_DOWNLOAD_PROGRESS_KEY = "quran_download_progress_v2"

function getCacheDir() {
  if (!FileSystem.documentDirectory) {
    throw new Error("Document directory unavailable")
  }
  return `${FileSystem.documentDirectory}quran_pages_v3/`
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
      text_uthmani: word.text_uthmani ?? "",
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
    if (!isUsableMushafPage(parsed)) {
      await AsyncStorage.removeItem(`quran_page_v2_${page}`)
      return null
    }
    const fixed: MushafPageData = {
      ...parsed,
      verses: parsed.verses.map(verse => ({
        ...verse,
        words: verse.words?.map(word => ({
          ...word,
          text_uthmani: word.text_uthmani ?? "",
        })),
      })),
    }
    await writeCachedPage(page, fixed)
    await AsyncStorage.removeItem(`quran_page_v2_${page}`)
    return fixed
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
    if (!isUsableMushafPage(parsed)) {
      await FileSystem.deleteAsync(path, { idempotent: true }).catch(() => {})
      return null
    }
    const verses = parsed.verses.map(verse => ({
      ...verse,
      words: verse.words?.map(word => ({
        ...word,
        text_uthmani: word.text_uthmani ?? "",
      })),
    }))
    return { ...parsed, verses, juzNumber: extractJuzNumber(verses, page) }
  } catch {
    return null
  }
}

export async function writeCachedPage(page: number, data: MushafPageData): Promise<void> {
  if (!isUsableMushafPage(data)) return
  await ensureCacheDir()
  await FileSystem.writeAsStringAsync(pageFilePath(page), JSON.stringify(data))
}

const LEGACY_PAGE_PREFIX = "quran_page_v2_"

/** Drop cached pages that failed or came back with no verses. */
export async function purgeEmptyCachedPages(): Promise<void> {
  try {
    await ensureCacheDir()
    const names = await FileSystem.readDirectoryAsync(getCacheDir())
    for (const name of names) {
      if (!name.startsWith("page_") || !name.endsWith(".json")) continue
      const path = `${getCacheDir()}${name}`
      let usable = false
      try {
        const parsed = JSON.parse(await FileSystem.readAsStringAsync(path)) as MushafPageData
        usable = isUsableMushafPage(parsed)
      } catch {
        usable = false
      }
      if (!usable) {
        await FileSystem.deleteAsync(path, { idempotent: true }).catch(() => {})
      }
    }
  } catch {
    // Cache directory may not exist yet.
  }

  try {
    const keys = (await AsyncStorage.getAllKeys()).filter(key => key.startsWith(LEGACY_PAGE_PREFIX))
    if (!keys.length) return
    const pairs = await AsyncStorage.multiGet(keys)
    const drop: string[] = []
    for (const [key, value] of pairs) {
      if (!value) {
        drop.push(key)
        continue
      }
      try {
        if (!isUsableMushafPage(JSON.parse(value) as MushafPageData)) drop.push(key)
      } catch {
        drop.push(key)
      }
    }
    if (drop.length) await AsyncStorage.multiRemove(drop)
  } catch {
    // AsyncStorage can be unavailable during early startup.
  }
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

const PAGE_ATTEMPTS = 3
const RETRY_DELAYS_MS = [400, 900]
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

type PageJob = () => Promise<void>
const highQueue: PageJob[] = []
const lowQueue: PageJob[] = []
let queueRunning = false
const inflightPages = new Map<number, Promise<MushafPageData | null>>()

function drainPageQueue() {
  if (queueRunning) return
  const job = highQueue.shift() ?? lowQueue.shift()
  if (!job) return
  queueRunning = true
  job().finally(() => {
    queueRunning = false
    drainPageQueue()
  })
}

function enqueuePageTask<T>(task: () => Promise<T>, priority: "high" | "low"): Promise<T> {
  return new Promise((resolve, reject) => {
    const job = async () => {
      try {
        resolve(await task())
      } catch (error) {
        reject(error)
      }
    }
    if (priority === "high") highQueue.unshift(job)
    else lowQueue.push(job)
    drainPageQueue()
  })
}

async function fetchPageOnce(page: number): Promise<MushafPageData | null> {
  const res = await fetchWithTimeout(pageApiUrl(page), {}, 10000)
  if (!res.ok) return null
  const data = slimPageDataFromJson(await res.json(), page)
  if (!isUsableMushafPage(data)) return null
  try {
    await writeCachedPage(page, data)
  } catch (error) {
    console.warn(`[QuranCache] Failed to cache page ${page}:`, error)
  }
  return data
}

async function fetchPageAttempt(
  page: number,
  priority: "high" | "low",
  attempt: number,
): Promise<MushafPageData | null> {
  const cached = await readCachedPage(page)
  if (isUsableMushafPage(cached)) return cached

  const data = await enqueuePageTask(async () => {
    try {
      return await fetchPageOnce(page)
    } catch {
      return null
    }
  }, priority)

  if (isUsableMushafPage(data) || attempt >= PAGE_ATTEMPTS - 1) return data
  await sleep(RETRY_DELAYS_MS[attempt] ?? 900)
  return fetchPageAttempt(page, priority, attempt + 1)
}

/**
 * Read a page from cache, or fetch it. Requests run one at a time.
 * `high` is the page on screen and jumps the queue. Failures are not cached.
 */
export function fetchAndCachePage(
  page: number,
  priority: "high" | "low" = "high",
): Promise<MushafPageData | null> {
  const existing = inflightPages.get(page)
  if (existing) return existing

  const promise = fetchPageAttempt(page, priority, 0).finally(() => {
    inflightPages.delete(page)
  })

  inflightPages.set(page, promise)
  return promise
}

/** Warm only the neighbours. The open page loads itself. */
export function preloadAdjacentPages(page: number): void {
  for (const target of [page - 1, page + 1]) {
    if (target >= 1 && target <= TOTAL_MUSHAF_PAGES) {
      void fetchAndCachePage(target, "low")
    }
  }
}

const EXPECTED_MUSHAF_VERSES = 6236

/** Dev-only walk of all 604 pages. Logs any page that still has no verses. */
export async function auditAllMushafPages(): Promise<void> {
  if (!__DEV__) return
  let total = 0
  const empty: number[] = []
  for (let page = 1; page <= TOTAL_MUSHAF_PAGES; page++) {
    const data = await fetchAndCachePage(page, "low")
    const count = isUsableMushafPage(data) ? data.verses.length : 0
    if (count === 0) {
      empty.push(page)
      console.warn(`[MushafAudit] page ${page} has 0 verses`)
    }
    total += count
  }
  const emptyLabel = empty.length ? empty.join(", ") : "none"
  console.log(`[MushafAudit] ${total} verses across ${TOTAL_MUSHAF_PAGES} pages. Empty: ${emptyLabel}`)
  if (total !== EXPECTED_MUSHAF_VERSES) {
    console.warn(`[MushafAudit] expected ${EXPECTED_MUSHAF_VERSES} verses, got ${total}`)
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
