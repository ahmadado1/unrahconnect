// Daily dhikr for the Home card and the dhikr counter page.
// A different dhikr each day; on Friday it is always the Salawat on the Prophet ﷺ.

export type Dhikr = { id: string; arabic: string; translit: string; meaning: string }

export const SALAWAT: Dhikr = {
  id: "salawat",
  arabic: "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ",
  translit: "Allahumma salli 'ala Muhammad",
  meaning: "O Allah, send Your blessings upon Muhammad ﷺ",
}

export const DHIKR_LIST: Dhikr[] = [
  { id: "subhanallah-bihamdihi", arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ", translit: "SubhanAllah wa bihamdihi", meaning: "Glory and praise be to Allah" },
  { id: "alhamdulillah", arabic: "الْحَمْدُ لِلَّهِ", translit: "Alhamdulillah", meaning: "All praise is due to Allah" },
  { id: "la-ilaha-illallah", arabic: "لَا إِلَهَ إِلَّا اللَّهُ", translit: "La ilaha illallah", meaning: "There is no god but Allah" },
  { id: "allahu-akbar", arabic: "اللَّهُ أَكْبَرُ", translit: "Allahu Akbar", meaning: "Allah is the Greatest" },
  { id: "astaghfirullah", arabic: "أَسْتَغْفِرُ اللَّهَ", translit: "Astaghfirullah", meaning: "I seek forgiveness from Allah" },
  { id: "subhanallah-azeem", arabic: "سُبْحَانَ اللَّهِ الْعَظِيمِ", translit: "SubhanAllah il-Azeem", meaning: "Glory be to Allah the Magnificent" },
  { id: "hawqala", arabic: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ", translit: "La hawla wa la quwwata illa billah", meaning: "There is no power and no strength except with Allah" },
  { id: "hasbunallah", arabic: "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ", translit: "Hasbunallahu wa ni'mal wakeel", meaning: "Allah is enough for us, and He is the best guardian" },
  SALAWAT,
]

/** Day number since 1970 in local time (changes at local midnight). */
function localDayNumber(now: Date) {
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.floor((midnight.getTime() - midnight.getTimezoneOffset() * 60000) / 86400000)
}

/** Today's dhikr: Salawat on Friday, otherwise the next one in the list each day. */
export function dhikrForToday(now = new Date()): Dhikr {
  if (now.getDay() === 5) return SALAWAT
  const others = DHIKR_LIST.filter(d => d.id !== SALAWAT.id)
  return others[localDayNumber(now) % others.length]
}

export function dhikrById(id: string | undefined | null): Dhikr | undefined {
  return DHIKR_LIST.find(d => d.id === id)
}
