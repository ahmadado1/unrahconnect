// Surah Al-Mulk nightly progress (isolated Mulk reader). Same idea as kahfWeekly.ts, but it resets every night.
import { AL_MULK_SURAH_NUMBER } from "@/lib/homeQuranCard"
import { safeStorage } from "@/lib/safeStorage"
import { ayahCountForSurah } from "@/lib/quranSurahMeta"
import { readSurahOfflineFirst } from "@/lib/quranReadCache"

/** Madani 604-page mushaf: Al-Mulk typically occupies these pages. */
export const MULK_FALLBACK_START_PAGE = 562
export const MULK_FALLBACK_END_PAGE = 564
export const MULK_AYAH_COUNT = ayahCountForSurah(AL_MULK_SURAH_NUMBER)
export const MULK_STORAGE_KEY = "mulk_nightly_progress_v1"
export const MULK_READER_ROUTE = "/quran/mulk"

export type MulkNightlyProgress = {
  nightId: string
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
 * The night this Mulk reading belongs to (local calendar).
 * After midnight until 3am still counts as the night before,
 * so reading at 1am ticks off "last night", not tomorrow.
 */
export function getMulkNightId(now = new Date()): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (now.getHours() < 3) d.setDate(d.getDate() - 1)
  return localYmd(d)
}

export function emptyMulkProgress(now = new Date()): MulkNightlyProgress {
  return {
    nightId: getMulkNightId(now),
    verseNumber: 0,
    pageNumber: 0,
    completed: false,
  }
}

export function mulkProgressFraction(progress: MulkNightlyProgress): number {
  if (progress.completed) return 1
  if (MULK_AYAH_COUNT <= 0) return 0
  return Math.min(1, Math.max(0, progress.verseNumber / MULK_AYAH_COUNT))
}

async function readStored(): Promise<MulkNightlyProgress | null> {
  try {
    const raw = await safeStorage.getItem(MULK_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as MulkNightlyProgress
    if (!parsed?.nightId) return null
    return {
      nightId: String(parsed.nightId),
      verseNumber: Number(parsed.verseNumber) || 0,
      pageNumber: Number(parsed.pageNumber) || 0,
      completed: Boolean(parsed.completed),
    }
  } catch {
    return null
  }
}

/** Load tonight's progress; last night's row is ignored (fresh start every night). */
export async function loadMulkNightlyProgress(
  now = new Date(),
): Promise<MulkNightlyProgress> {
  const nightId = getMulkNightId(now)
  const stored = await readStored()
  if (!stored || stored.nightId !== nightId) return emptyMulkProgress(now)
  return stored
}

export async function saveMulkNightlyProgress(
  patch: Partial<Omit<MulkNightlyProgress, "nightId">> & { nightId?: string },
  now = new Date(),
): Promise<MulkNightlyProgress> {
  const current = await loadMulkNightlyProgress(now)
  const next: MulkNightlyProgress = {
    nightId: current.nightId,
    verseNumber: Math.max(current.verseNumber, patch.verseNumber ?? current.verseNumber),
    pageNumber: patch.pageNumber ?? current.pageNumber,
    completed: patch.completed ?? current.completed,
  }
  if (next.completed) {
    next.verseNumber = Math.max(next.verseNumber, MULK_AYAH_COUNT)
  }
  await safeStorage.setItem(MULK_STORAGE_KEY, JSON.stringify(next))
  return next
}

export async function markMulkNightComplete(now = new Date()): Promise<MulkNightlyProgress> {
  return saveMulkNightlyProgress(
    { completed: true, verseNumber: MULK_AYAH_COUNT },
    now,
  )
}

export async function isMulkCompleteTonight(now = new Date()): Promise<boolean> {
  const progress = await loadMulkNightlyProgress(now)
  return progress.completed
}

export async function resolveMulkPageRange(
  language: string,
): Promise<{ start: number; end: number }> {
  const verses = await readSurahOfflineFirst(AL_MULK_SURAH_NUMBER, language)
  const pages = (verses ?? [])
    .map(v => v.page)
    .filter(p => Number.isInteger(p) && p >= 1 && p <= 604)
  if (!pages.length) {
    return { start: MULK_FALLBACK_START_PAGE, end: MULK_FALLBACK_END_PAGE }
  }
  return { start: Math.min(...pages), end: Math.max(...pages) }
}
