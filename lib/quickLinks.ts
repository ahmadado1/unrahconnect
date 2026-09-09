/**
 * Quran tab Quick Links — static shortcuts, independent of Last Read history.
 * Could later become user-customizable pinned favorites.
 */
export type QuranQuickLink = {
  label: string
  surahNumber: number
  startAyah?: number
}

export const QURAN_QUICK_LINKS: QuranQuickLink[] = [
  { label: "Al-Mulk", surahNumber: 67 },
  { label: "Al-Kahf", surahNumber: 18 },
  { label: "Ayatul Kursi", surahNumber: 2, startAyah: 255 },
  { label: "Ya Sin", surahNumber: 36 },
  { label: "Ar-Rahman", surahNumber: 55 },
]
