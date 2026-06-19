import AsyncStorage from "@react-native-async-storage/async-storage"

export type ReadVerse = {
  number: number
  numberInQuran: number
  text: string
  translation: string
  page: number
}

const TRANSLATION_EDITIONS: Record<string, string> = {
  fr: "fr.hamidullah",
  ur: "ur.jalandhry",
  tr: "tr.diyanet",
  ar: "ar.muyassar",
  en: "en.sahih",
}

export function getTranslationEdition(language: string) {
  return TRANSLATION_EDITIONS[language] ?? TRANSLATION_EDITIONS.en
}

export function surahCacheKey(surah: number, language: string) {
  return `quran_surah_${surah}_${language}`
}

export async function readCachedSurah(
  surah: number,
  language: string
): Promise<ReadVerse[] | null> {
  try {
    const cached = await AsyncStorage.getItem(surahCacheKey(surah, language))
    if (!cached) return null
    return JSON.parse(cached)
  } catch {
    return null
  }
}

export async function writeCachedSurah(
  surah: number,
  language: string,
  verses: ReadVerse[]
): Promise<void> {
  await AsyncStorage.setItem(surahCacheKey(surah, language), JSON.stringify(verses))
}

export async function fetchAndCacheSurah(
  surah: number,
  language: string
): Promise<ReadVerse[] | null> {
  const existing = await readCachedSurah(surah, language)
  if (existing?.length) return existing

  try {
    const arabicRes = await fetch(
      `https://api.alquran.cloud/v1/surah/${surah}/quran-uthmani`
    )
    const arabicData = await arabicRes.json()

    if (arabicData.status !== "OK" || !arabicData.data?.ayahs) return null

    let translations: string[] = []
    try {
      const edition = getTranslationEdition(language)
      const transRes = await fetch(
        `https://api.alquran.cloud/v1/surah/${surah}/${edition}`
      )
      const transData = await transRes.json()
      if (transData.status === "OK") {
        translations = transData.data.ayahs.map((a: { text: string }) => a.text)
      }
    } catch {}

    const combined: ReadVerse[] = arabicData.data.ayahs.map(
      (ayah: { numberInSurah: number; number: number; text: string; page: number }, index: number) => {
        let text = ayah.text
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

    await writeCachedSurah(surah, language, combined)
    return combined
  } catch {
    return null
  }
}

export async function downloadSurahList(): Promise<boolean> {
  try {
    const cached = await AsyncStorage.getItem("quran_surahs")
    if (cached) return true

    const res = await fetch("https://api.alquran.cloud/v1/surah")
    const data = await res.json()
    if (data.code !== 200) return false

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
