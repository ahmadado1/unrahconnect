import type { LastReadEntry } from "@/lib/lastReadRegister"
import { getSurahMeta } from "@/lib/quranSurahMeta"

export const AL_MULK_SURAH_NUMBER = 67
export const AL_FATIHAH_SURAH_NUMBER = 1
export const AL_KAHF_SURAH_NUMBER = 18

export type HomeQuranCardKind = "mulk" | "kahf" | "resume"

export type HomeQuranCardState = {
  kind: HomeQuranCardKind
  surahNumber: number
  ayah: number
  englishName: string
  arabicName: string
  ayahCount: number
  revelationType: string
}

/** 10:00pm–2:59am local time (inclusive of 10pm, exclusive of 3am). */
export function isMulkNightWindow(now = new Date()): boolean {
  const hour = now.getHours()
  return hour >= 22 || hour < 3
}

export function isGregorianFriday(now = new Date()): boolean {
  return now.getDay() === 5
}

function metaCard(
  kind: HomeQuranCardKind,
  surahNumber: number,
  ayah: number,
): HomeQuranCardState {
  const meta = getSurahMeta(surahNumber)
  return {
    kind,
    surahNumber,
    ayah: Math.max(1, ayah),
    englishName: meta?.englishName ?? `Surah ${surahNumber}`,
    arabicName: meta?.arabicName ?? "",
    ayahCount: meta?.ayahCount ?? 1,
    revelationType: meta?.revelationType ?? "Meccan",
  }
}

/**
 * Home Quran card content. First match wins:
 * 1. 10pm–3am → Al-Mulk (including Friday nights)
 * 2. Friday → Al-Kahf
 * 3. Last-read position, else Al-Fatihah
 */
export function resolveHomeQuranCard(input: {
  lastRead?: LastReadEntry | null
  kahfAyah?: number
  now?: Date
}): HomeQuranCardState {
  const now = input.now ?? new Date()

  if (isMulkNightWindow(now)) {
    return metaCard("mulk", AL_MULK_SURAH_NUMBER, 1)
  }

  if (isGregorianFriday(now)) {
    return metaCard("kahf", AL_KAHF_SURAH_NUMBER, input.kahfAyah || 1)
  }

  if (input.lastRead?.surahNumber) {
    return metaCard("resume", input.lastRead.surahNumber, input.lastRead.ayah || 1)
  }

  return metaCard("resume", AL_FATIHAH_SURAH_NUMBER, 1)
}
