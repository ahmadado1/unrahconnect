import AsyncStorage from "@react-native-async-storage/async-storage"
import i18n from "@/i18n"
import { fetchWithTimeout } from "./fetchWithTimeout"
import {
  downloadSurahList,
  fetchAndCacheSurah,
  getMissingSurahNumbers,
  normalizeReadLanguage,
  warmReadCacheForLanguage,
} from "./quranReadCache"
import {
  clearQuranDownloadFlag,
  getCachedPageCount,
  getMissingPageNumbers,
  markQuranFullyCached,
  pageApiUrl,
  QURAN_DOWNLOAD_FLAG_KEY,
  slimPageDataFromJson,
  TOTAL_MUSHAF_PAGES,
  writeCachedPage,
} from "./quranPageCache"

const BATCH_SIZE = 4
const BATCH_DELAY_MS = 250
const MAX_ROUNDS = 12

export type QuranDownloadStatus = "idle" | "downloading" | "complete" | "paused"

export type QuranDownloadState = {
  status: QuranDownloadStatus
  done: number
  total: number
  label: string
}

type ProgressCallback = (done: number, total: number) => void
type Listener = (state: QuranDownloadState) => void

const TOTAL_ITEMS = TOTAL_MUSHAF_PAGES + 114

const listeners = new Set<Listener>()
let state: QuranDownloadState = {
  status: "idle",
  done: 0,
  total: TOTAL_ITEMS,
  label: "",
}
let downloadPromise: Promise<boolean> | null = null

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

function emit(partial: Partial<QuranDownloadState>) {
  state = { ...state, ...partial }
  listeners.forEach(listener => listener(state))
}

export function getQuranDownloadState() {
  return state
}

export function subscribeQuranDownload(listener: Listener) {
  listeners.add(listener)
  listener(state)
  return () => {
    listeners.delete(listener)
  }
}

async function downloadPageFromNetwork(page: number): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(pageApiUrl(page), {}, 12000)
    if (!res.ok) return false

    const json = await res.json()
    const data = slimPageDataFromJson(json)
    if (!data.verses.length) return false

    await writeCachedPage(page, data)
    return true
  } catch (e) {
    console.warn(`[QuranDownload] Page ${page} failed:`, e)
    return false
  }
}

async function getDownloadLanguage() {
  const fromI18n = normalizeReadLanguage(i18n.language || "en")
  const stored = normalizeReadLanguage((await AsyncStorage.getItem("language")) ?? fromI18n)
  if (stored !== fromI18n) {
    await AsyncStorage.setItem("language", fromI18n)
  }
  return fromI18n
}

export async function isQuranFullyCached(): Promise<boolean> {
  try {
    const flag = await AsyncStorage.getItem(QURAN_DOWNLOAD_FLAG_KEY)
    if (flag !== "true") return false

    const missingPages = await getMissingPageNumbers()
    if (missingPages.length > 0) return false

    const language = await getDownloadLanguage()
    const missingSurahs = await getMissingSurahNumbers(language)
    return missingSurahs.length === 0
  } catch {
    return false
  }
}

export { getCachedPageCount }

async function runDownload(onProgress?: ProgressCallback): Promise<boolean> {
  const language = await getDownloadLanguage()

  const initialMissingPages = await getMissingPageNumbers()
  const initialMissingSurahs = await getMissingSurahNumbers(language)
  const surahListOk = await downloadSurahList()

  if (
    initialMissingPages.length === 0 &&
    initialMissingSurahs.length === 0 &&
    surahListOk
  ) {
    await markQuranFullyCached()
    await warmReadCacheForLanguage(language)
    emit({
      status: "complete",
      done: TOTAL_ITEMS,
      total: TOTAL_ITEMS,
      label: "Quran ready offline",
    })
    onProgress?.(TOTAL_ITEMS, TOTAL_ITEMS)
    setTimeout(() => emit({ status: "idle", done: TOTAL_ITEMS, total: TOTAL_ITEMS, label: "" }), 4000)
    return true
  }

  const flag = await AsyncStorage.getItem(QURAN_DOWNLOAD_FLAG_KEY)
  if (flag === "true" && (initialMissingPages.length > 0 || initialMissingSurahs.length > 0)) {
    await clearQuranDownloadFlag()
  }

  let pagesDone = TOTAL_MUSHAF_PAGES - initialMissingPages.length
  let surahsDone = 114 - initialMissingSurahs.length

  const reportProgress = (label: string, status: QuranDownloadStatus = "downloading") => {
    const done = pagesDone + surahsDone
    emit({ status, done, total: TOTAL_ITEMS, label })
    onProgress?.(done, TOTAL_ITEMS)
  }

  reportProgress("Downloading Quran...")

  if (!surahListOk) {
    const listRetry = await downloadSurahList()
    if (!listRetry) {
      reportProgress("Download paused — will retry", "paused")
      return false
    }
  }

  for (let round = 0; round < MAX_ROUNDS; round++) {
    let missingPages = await getMissingPageNumbers()

    for (let i = 0; i < missingPages.length; i += BATCH_SIZE) {
      const batch = missingPages.slice(i, i + BATCH_SIZE)
      const results = await Promise.all(batch.map(page => downloadPageFromNetwork(page)))
      pagesDone += results.filter(Boolean).length
      reportProgress("Downloading mushaf pages...")

      if (i + BATCH_SIZE < missingPages.length) {
        await sleep(BATCH_DELAY_MS)
      }
    }

    missingPages = await getMissingPageNumbers()
    pagesDone = TOTAL_MUSHAF_PAGES - missingPages.length
    if (missingPages.length === 0) break
  }

  let missingPages = await getMissingPageNumbers()
  if (missingPages.length > 0) {
    pagesDone = TOTAL_MUSHAF_PAGES - missingPages.length
    reportProgress("Download paused — will retry", "paused")
    return false
  }

  let missingSurahs = await getMissingSurahNumbers(language)
  for (let i = 0; i < missingSurahs.length; i += 2) {
    const batch = missingSurahs.slice(i, i + 2)
    const results = await Promise.all(batch.map(surah => fetchAndCacheSurah(surah, language)))
    surahsDone += results.filter(r => r?.length).length
    reportProgress("Downloading read mode...")

    if (i + 2 < missingSurahs.length) {
      await sleep(BATCH_DELAY_MS)
    }
  }

  missingSurahs = await getMissingSurahNumbers(language)
  surahsDone = 114 - missingSurahs.length
  if (missingSurahs.length > 0) {
    reportProgress("Download paused — will retry", "paused")
    return false
  }

  const listFinal = await downloadSurahList()
  if (!listFinal) {
    reportProgress("Download paused — will retry", "paused")
    return false
  }

  await markQuranFullyCached()
  await warmReadCacheForLanguage(language)
  emit({
    status: "complete",
    done: TOTAL_ITEMS,
    total: TOTAL_ITEMS,
    label: "Quran ready offline",
  })
  onProgress?.(TOTAL_ITEMS, TOTAL_ITEMS)

  setTimeout(() => emit({ status: "idle", done: TOTAL_ITEMS, total: TOTAL_ITEMS, label: "" }), 4000)

  return true
}

/** Single-flight download — concurrent callers share one run. */
export async function downloadFullQuran(onProgress?: ProgressCallback): Promise<boolean> {
  if (downloadPromise) {
    return downloadPromise
  }

  downloadPromise = runDownload(onProgress).finally(() => {
    downloadPromise = null
  })
  return downloadPromise
}

/** After language change: keep mushaf; only fetch missing translation surahs. */
export async function ensureQuranForLanguage(language: string): Promise<boolean> {
  await AsyncStorage.setItem("language", normalizeReadLanguage(language))
  return downloadFullQuran()
}

export async function resetQuranCache(): Promise<void> {
  await clearQuranDownloadFlag()
  emit({ status: "idle", done: 0, total: TOTAL_ITEMS, label: "" })
}
