// Download whole-surah Quran audio to the phone, so it plays with no internet
// (in Makkah / Madinah data can be slow or expensive).
// One file per reciter + surah, saved in the app's own storage. playSurah() uses the saved file
// automatically when it exists.
import * as FileSystem from "expo-file-system/legacy"
import { surahAudioUrl, type SurahReciter } from "./quranAudio"

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
