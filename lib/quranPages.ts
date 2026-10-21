// Where each surah starts in the standard 604-page Madani Mushaf (same pages as the Mushaf mode).
// Index 0 is unused; SURAH_START_PAGES[18] = 293 (Al-Kahf), [67] = 562 (Al-Mulk).
export const SURAH_START_PAGES = [
  0, 1, 2, 50, 77, 106, 128, 151, 177, 187, 208, 221, 235, 249, 255, 262, 267, 282, 293, 305, 312,
  322, 332, 342, 350, 359, 367, 377, 385, 396, 404, 411, 415, 418, 428, 434, 440, 446, 453, 458, 467,
  477, 483, 489, 496, 499, 502, 507, 511, 515, 518, 520, 523, 526, 528, 531, 534, 537, 542, 545, 549,
  551, 553, 554, 556, 558, 560, 562, 564, 566, 568, 570, 572, 574, 575, 577, 578, 580, 582, 583, 585,
  586, 587, 587, 589, 590, 591, 591, 592, 593, 594, 595, 595, 596, 596, 597, 597, 598, 598, 599, 599,
  600, 600, 601, 601, 601, 602, 602, 602, 603, 603, 603, 604, 604, 604,
] as const

export const MUSHAF_PAGES = 604

/** Pages of one surah: from its first page to the page before the next surah starts. */
export function surahPageRange(surah: number): { start: number; end: number } {
  const s = Math.min(Math.max(1, Math.round(surah)), 114)
  const start = SURAH_START_PAGES[s]
  const next = s < 114 ? SURAH_START_PAGES[s + 1] : MUSHAF_PAGES + 1
  return { start, end: Math.max(start, next - 1) }
}

/** The surah that a page belongs to (the last surah that starts on or before it). */
export function surahForPage(page: number): number {
  const p = Math.min(Math.max(1, Math.round(page)), MUSHAF_PAGES)
  // Several short surahs can start on the same page: take the first of them.
  let surah = 1
  let best = 1
  for (let s = 1; s <= 114; s++) {
    const start = SURAH_START_PAGES[s]
    if (start > p) break
    if (start > best) {
      best = start
      surah = s
    }
  }
  return surah
}
