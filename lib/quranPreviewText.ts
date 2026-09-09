import { fetchAndCacheSurah, peekCachedSurah, readSurahOfflineFirst } from "@/lib/quranReadCache"

const PREVIEW_FALLBACK: Record<number, string> = {
  1: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ الرَّحْمَٰنِ الرَّحِيمِ مَالِكِ يَوْمِ الدِّينِ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ",
  18: "الْحَمْدُ لِلَّهِ الَّذِي أَنزَلَ عَلَىٰ عَبْدِهِ الْكِتَابَ وَلَمْ يَجْعَل لَّهُ عِوَجًا",
  67: "تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ الَّذِي خَلَقَ الْمَوْتَ وَالْحَيَاةَ لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًا",
}

export async function loadSurahPreviewText(surah: number, fromAyah: number): Promise<string> {
  const start = Math.max(1, fromAyah)
  const cached =
    peekCachedSurah(surah, "en") ||
    (await readSurahOfflineFirst(surah, "en")) ||
    (await fetchAndCacheSurah(surah, "en"))

  if (cached?.length) {
    const slice = cached.filter(v => v.number >= start).slice(0, 12)
    const text = slice.map(v => v.text).join(" ").trim()
    if (text) return text
  }

  return PREVIEW_FALLBACK[surah] ?? ""
}
