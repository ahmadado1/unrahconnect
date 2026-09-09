import { AL_KAHF_SURAH_NUMBER } from "@/lib/alKahfWindow"
import { safeStorage } from "@/lib/safeStorage"
import { ayahCountForSurah } from "@/lib/quranSurahMeta"
import { readSurahOfflineFirst } from "@/lib/quranReadCache"

/** Madani 604-page mushaf: Al-Kahf typically occupies these pages. */
export const KAHF_FALLBACK_START_PAGE = 293
export const KAHF_FALLBACK_END_PAGE = 304
export const KAHF_AYAH_COUNT = ayahCountForSurah(AL_KAHF_SURAH_NUMBER)
export const KAHF_STORAGE_KEY = "kahf_weekly_progress_v1"
export const KAHF_READER_ROUTE = "/quran/kahf"

export type KahfWeeklyProgress = {
  weekId: string
  verseNumber: number
  pageNumber: number
  completed: boolean
}

function localYmd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

/**
 * The Friday this Kahf cycle belongs to (local calendar).
 * Saturday–Wednesday map to the upcoming Friday so last week's
 * checkmark does not carry over after Friday ends.
 */
export function getKahfFridayDate(now = new Date()): Date {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const day = d.getDay() // 0 Sun … 5 Fri, 6 Sat
  const add = day === 5 ? 0 : day === 6 ? 6 : 5 - day
  d.setDate(d.getDate() + add)
  return d
}

export function getKahfWeekId(now = new Date()): string {
  return localYmd(getKahfFridayDate(now))
}

export function emptyKahfProgress(now = new Date()): KahfWeeklyProgress {
  return {
    weekId: getKahfWeekId(now),
    verseNumber: 0,
    pageNumber: 0,
    completed: false,
  }
}

export function kahfProgressFraction(progress: KahfWeeklyProgress): number {
  if (progress.completed) return 1
  if (KAHF_AYAH_COUNT <= 0) return 0
  return Math.min(1, Math.max(0, progress.verseNumber / KAHF_AYAH_COUNT))
}

async function readStored(): Promise<KahfWeeklyProgress | null> {
  try {
    const raw = await safeStorage.getItem(KAHF_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as KahfWeeklyProgress
    if (!parsed?.weekId) return null
    return {
      weekId: String(parsed.weekId),
      verseNumber: Number(parsed.verseNumber) || 0,
      pageNumber: Number(parsed.pageNumber) || 0,
      completed: Boolean(parsed.completed),
    }
  } catch {
    return null
  }
}

/** Load this week's progress; last week's row is ignored (fresh start). */
export async function loadKahfWeeklyProgress(
  now = new Date(),
): Promise<KahfWeeklyProgress> {
  const weekId = getKahfWeekId(now)
  const stored = await readStored()
  if (!stored || stored.weekId !== weekId) return emptyKahfProgress(now)
  return stored
}

export async function saveKahfWeeklyProgress(
  patch: Partial<Omit<KahfWeeklyProgress, "weekId">> & { weekId?: string },
  now = new Date(),
): Promise<KahfWeeklyProgress> {
  const current = await loadKahfWeeklyProgress(now)
  const next: KahfWeeklyProgress = {
    weekId: current.weekId,
    verseNumber: Math.max(current.verseNumber, patch.verseNumber ?? current.verseNumber),
    pageNumber: patch.pageNumber ?? current.pageNumber,
    completed: patch.completed ?? current.completed,
  }
  if (next.completed) {
    next.verseNumber = Math.max(next.verseNumber, KAHF_AYAH_COUNT)
  }
  await safeStorage.setItem(KAHF_STORAGE_KEY, JSON.stringify(next))
  return next
}

export async function markKahfWeekComplete(now = new Date()): Promise<KahfWeeklyProgress> {
  return saveKahfWeeklyProgress(
    { completed: true, verseNumber: KAHF_AYAH_COUNT },
    now,
  )
}

export async function isKahfCompleteThisWeek(now = new Date()): Promise<boolean> {
  const progress = await loadKahfWeeklyProgress(now)
  return progress.completed
}

export async function resolveKahfPageRange(
  language: string,
): Promise<{ start: number; end: number }> {
  const verses = await readSurahOfflineFirst(AL_KAHF_SURAH_NUMBER, language)
  const pages = (verses ?? [])
    .map(v => v.page)
    .filter(p => Number.isInteger(p) && p >= 1 && p <= 604)
  if (!pages.length) {
    return { start: KAHF_FALLBACK_START_PAGE, end: KAHF_FALLBACK_END_PAGE }
  }
  return { start: Math.min(...pages), end: Math.max(...pages) }
}
