/**
 * First page of each Juz in the standard 604-page Madani Mushaf.
 * Index 0 = Juz 1 (page 1), … index 29 = Juz 30 (page 582).
 */
export const JUZ_START_PAGES = [
  1, 22, 42, 62, 82, 102, 121, 142, 162, 182, 201, 222, 242, 262, 282, 302, 322,
  342, 362, 382, 402, 422, 442, 462, 482, 502, 522, 542, 562, 582,
] as const

/** Page → Juz (1–30) for the Madani Mushaf. */
export function juzForPage(page: number): number {
  if (!Number.isFinite(page) || page < 1) return 1
  if (page > 604) return 30

  let juz = 1
  for (let i = 0; i < JUZ_START_PAGES.length; i++) {
    if (page >= JUZ_START_PAGES[i]) juz = i + 1
    else break
  }
  return juz
}

/** Prefer API juz_number; fall back to Madani page→juz table. */
export function resolveJuzNumber(
  juzFromApi: unknown,
  pageHint?: number,
): number {
  const n = Number(juzFromApi)
  if (Number.isInteger(n) && n >= 1 && n <= 30) return n
  if (typeof pageHint === "number" && pageHint >= 1) return juzForPage(pageHint)
  return 1
}
