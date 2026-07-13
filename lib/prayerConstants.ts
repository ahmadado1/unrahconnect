export const PRAYER_NAMES = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const

export type PrayerName = (typeof PRAYER_NAMES)[number]

export const PRAYER_ICONS: Record<PrayerName, string> = {
  Fajr: "partly-sunny-outline",
  Dhuhr: "sunny-outline",
  Asr: "sunny-outline",
  Maghrib: "cloudy-night-outline",
  Isha: "moon-outline",
}

export const PRAYER_INFO: Record<
  PrayerName,
  {
    arabic: string
    dua: string
    duaTranslit: string
    duaTranslation: string
  }
> = {
  Fajr: {
    arabic: "صلاة الفجر",
    dua: "اللَّهُمَّ بَاعِدْ بَيْنِي وَبَيْنَ خَطَايَايَ كَمَا بَاعَدْتَ بَيْنَ الْمَشْرِقِ وَالْمَغْرِبِ",
    duaTranslit: "Allahumma ba'id bayni wa bayna khatayaya kama ba'adta baynal mashriqi wal maghrib",
    duaTranslation: "O Allah distance me from my sins as You have distanced the East from the West",
  },
  Dhuhr: {
    arabic: "صلاة الظهر",
    dua: "اللَّهُمَّ اجْعَلْنِي مِنَ التَّوَّابِينَ وَاجْعَلْنِي مِنَ الْمُتَطَهِّرِينَ",
    duaTranslit: "Allahumma aj'alni minat-tawwabina waj'alni minal mutatahhirin",
    duaTranslation: "O Allah make me among those who repent and make me among those who purify themselves",
  },
  Asr: {
    arabic: "صلاة العصر",
    dua: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ وَالْعَجْزِ وَالْكَسَلِ",
    duaTranslit: "Allahumma inni a'udhu bika minal hammi wal hazan wal ajzi wal kasal",
    duaTranslation: "O Allah I seek refuge in You from worry, grief, inability and laziness",
  },
  Maghrib: {
    arabic: "صلاة المغرب",
    dua: "اللَّهُمَّ إِنِّي أَسْأَلُكَ رَحْمَتَكَ وَمَغْفِرَتَكَ",
    duaTranslit: "Allahumma inni as'aluka rahmataka wa maghfirataka",
    duaTranslation: "O Allah I ask You for Your mercy and Your forgiveness",
  },
  Isha: {
    arabic: "صلاة العشاء",
    dua: "اللَّهُمَّ اجْعَلْ فِي قَلْبِي نُوراً وَفِي لِسَانِي نُوراً",
    duaTranslit: "Allahumma aj'al fi qalbi nuran wa fi lisani nura",
    duaTranslation: "O Allah place light in my heart and light on my tongue",
  },
}

export const ADHAN_FILES: Record<string, number> = {
  "1": require("../assets/audio/azan1.mp3"),
  "2": require("../assets/audio/azan2.mp3"),
  "3": require("../assets/audio/azan3.mp3"),
  "4": require("../assets/audio/azan4.mp3"),
  "5": require("../assets/audio/azan5.mp3"),
}

/** Fajr adhan includes «الصلاة خير من النوم» (prayer is better than sleep). */
export const ADHAN_FAJR_FILES: Record<string, number> = {
  "1": require("../assets/audio/azan1_fajr.mp3"),
  "2": require("../assets/audio/azan2_fajr.mp3"),
  "3": require("../assets/audio/azan3_fajr.mp3"),
  "4": require("../assets/audio/azan4_fajr.mp3"),
  "5": require("../assets/audio/azan5_fajr.mp3"),
}

export const ADHAN_OPTIONS = [
  { id: "1", name: "Makkah — Ali Mala", fajrLabel: "Makkah Fajr" },
  { id: "2", name: "Mishary Al-Afasy", fajrLabel: "Mishary Fajr" },
  { id: "3", name: "Madinah Haram", fajrLabel: "Madinah Fajr" },
  { id: "4", name: "Yasser Al-Dosari", fajrLabel: "Kuwait Fajr" },
  { id: "5", name: "Al-Aqsa Jerusalem", fajrLabel: "Cairo Fajr" },
] as const

export function getAdhanFile(adhanId: string, prayerName?: PrayerName | string | null) {
  const id = ADHAN_FILES[adhanId] ? adhanId : "1"
  if (prayerName === "Fajr") {
    return ADHAN_FAJR_FILES[id] ?? ADHAN_FAJR_FILES["1"]
  }
  return ADHAN_FILES[id] ?? ADHAN_FILES["1"]
}

export function normalizePrayerName(value: unknown): PrayerName | null {
  if (typeof value !== "string") return null
  const match = PRAYER_NAMES.find(name => name.toLowerCase() === value.toLowerCase())
  return match ?? null
}

export function prayerNameFromNotification(identifier: string, data: Record<string, unknown> | undefined) {
  const fromData = normalizePrayerName(data?.prayerName)
  if (fromData) return fromData

  const match = identifier.match(/^prayer-(fajr|dhuhr|asr|maghrib|isha)-now$/i)
  if (!match) return null
  return normalizePrayerName(match[1])
}
