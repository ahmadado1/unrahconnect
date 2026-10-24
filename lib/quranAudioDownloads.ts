// Download whole-surah Quran audio to the phone, so it plays with no internet
// (in Makkah / Madinah data can be slow or expensive).
// One file per reciter + surah, saved in the app's own storage. playSurah() uses the saved file
// automatically when it exists.
import * as FileSystem from "expo-file-system/legacy"
import { surahAudioUrl, verseAudioUrl, type SurahReciter } from "./quranAudio"

const ROOT = `${FileSystem.documentDirectory}quran-audio/`

function pad3(n: number) {
  return String(n).padStart(3, "0")
}

export function localSurahUri(reciterId: number, surah: number) {
  return `${ROOT}${reciterId}/${pad3(surah)}.mp3`
}

/** The saved file's address, or null if this surah is not downloaded for this reciter. */
export async function downloadedSurahUri(reciterId: number, surah: number): Promise<string | null> {
  try {
    const uri = localSurahUri(reciterId, surah)
    const info = await FileSystem.getInfoAsync(uri)
    // A tiny file means a broken download: ignore it.
    return info.exists && (info.size ?? 0) > 20_000 ? uri : null
  } catch {
    return null
  }
}

const running = new Map<string, FileSystem.DownloadResumable>()

/**
 * Download one surah. onProgress gets 0..1. Returns true when saved.
 * Downloads first to a temporary name, so a cut connection never leaves a half file.
 */
export async function downloadSurahAudio(
  reciter: SurahReciter,
  surah: number,
  onProgress?: (fraction: number) => void
): Promise<boolean> {
  const key = `${reciter.id}:${surah}`
  if (running.has(key)) return false
  const dir = `${ROOT}${reciter.id}/`
  const final = localSurahUri(reciter.id, surah)
  const temp = `${final}.part`
  try {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {})
    const task = FileSystem.createDownloadResumable(surahAudioUrl(reciter, surah), temp, {}, p => {
      if (p.totalBytesExpectedToWrite > 0) onProgress?.(p.totalBytesWritten / p.totalBytesExpectedToWrite)
    })
    running.set(key, task)
    const result = await task.downloadAsync()
    if (!result || result.status !== 200) {
      await FileSystem.deleteAsync(temp, { idempotent: true }).catch(() => {})
      return false
    }
    await FileSystem.deleteAsync(final, { idempotent: true }).catch(() => {})
    await FileSystem.moveAsync({ from: temp, to: final })
    onProgress?.(1)
    return true
  } catch (e) {
    console.log("[Quran download] failed:", e)
    await FileSystem.deleteAsync(temp, { idempotent: true }).catch(() => {})
    return false
  } finally {
    running.delete(key)
  }
}

/** Stop a download that is running. */
export async function cancelSurahDownload(reciterId: number, surah: number) {
  const task = running.get(`${reciterId}:${surah}`)
  if (!task) return
  try {
    await task.pauseAsync()
  } catch {}
  running.delete(`${reciterId}:${surah}`)
  await FileSystem.deleteAsync(`${localSurahUri(reciterId, surah)}.part`, { idempotent: true }).catch(() => {})
}

export async function deleteSurahAudio(reciterId: number, surah: number) {
  await FileSystem.deleteAsync(localSurahUri(reciterId, surah), { idempotent: true }).catch(() => {})
}

// ─── Verse-by-verse audio (EveryAyah) ──────────────────────────────────────
// The play button next to each verse uses one small file per verse. Downloading a surah saves
// all of its verse files for the chosen verse reciter; startVerse() then plays them offline.
const VERSE_ROOT = `${FileSystem.documentDirectory}quran-verse-audio/`

export function localVerseUri(folder: string, surah: number, ayah: number) {
  return `${VERSE_ROOT}${folder}/${pad3(surah)}${pad3(ayah)}.mp3`
}

/** Marker file written when every verse of the surah is saved. */
function verseDoneMarker(folder: string, surah: number) {
  return `${VERSE_ROOT}${folder}/${pad3(surah)}.done`
}

/** The saved verse file, or null (then the verse streams from the internet). */
export async function downloadedVerseUri(folder: string, surah: number, ayah: number): Promise<string | null> {
  try {
    const uri = localVerseUri(folder, surah, ayah)
    const info = await FileSystem.getInfoAsync(uri)
    return info.exists && (info.size ?? 0) > 1_000 ? uri : null
  } catch {
    return null
  }
}

export async function isSurahVersesDownloaded(folder: string, surah: number): Promise<boolean> {
  try {
    return (await FileSystem.getInfoAsync(verseDoneMarker(folder, surah))).exists
  } catch {
    return false
  }
}

const verseRuns = new Map<string, { cancelled: boolean }>()

/**
 * Download every verse of a surah (4 at a time). Files already saved are skipped, so a
 * cut download continues where it stopped. onProgress gets 0..1. Returns true when complete.
 */
export async function downloadSurahVerses(
  folder: string,
  surah: number,
  ayahCount: number,
  onProgress?: (fraction: number) => void
): Promise<boolean> {
  const key = `${folder}:${surah}`
  if (verseRuns.has(key) || ayahCount < 1) return false
  const run = { cancelled: false }
  verseRuns.set(key, run)
  try {
    await FileSystem.makeDirectoryAsync(`${VERSE_ROOT}${folder}/`, { intermediates: true }).catch(() => {})
    let done = 0
    let failed = 0
    const ayahs = Array.from({ length: ayahCount }, (_, i) => i + 1)
    for (let i = 0; i < ayahs.length; i += 4) {
      if (run.cancelled) return false
      await Promise.all(
        ayahs.slice(i, i + 4).map(async ayah => {
          const final = localVerseUri(folder, surah, ayah)
          if (!(await downloadedVerseUri(folder, surah, ayah))) {
            const temp = `${final}.part`
            try {
              const res = await FileSystem.downloadAsync(verseAudioUrl(folder, surah, ayah), temp)
              if (res.status !== 200) throw new Error(`status ${res.status}`)
              await FileSystem.deleteAsync(final, { idempotent: true }).catch(() => {})
              await FileSystem.moveAsync({ from: temp, to: final })
            } catch {
              failed++
              await FileSystem.deleteAsync(temp, { idempotent: true }).catch(() => {})
            }
          }
          done++
          onProgress?.(done / ayahCount)
        })
      )
      if (failed > 0) return false
    }
    await FileSystem.writeAsStringAsync(verseDoneMarker(folder, surah), String(Date.now())).catch(() => {})
    onProgress?.(1)
    return true
  } catch (e) {
    console.log("[Verse download] failed:", e)
    return false
  } finally {
    verseRuns.delete(key)
  }
}

export function cancelSurahVersesDownload(folder: string, surah: number) {
  const run = verseRuns.get(`${folder}:${surah}`)
  if (run) run.cancelled = true
}

/** Delete the saved verse files of one surah (one reciter). */
export async function deleteSurahVerses(folder: string, surah: number, ayahCount: number) {
  await FileSystem.deleteAsync(verseDoneMarker(folder, surah), { idempotent: true }).catch(() => {})
  for (let ayah = 1; ayah <= ayahCount; ayah++) {
    await FileSystem.deleteAsync(localVerseUri(folder, surah, ayah), { idempotent: true }).catch(() => {})
  }
}
