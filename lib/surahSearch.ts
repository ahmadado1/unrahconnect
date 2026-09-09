import {
  fuzzyDistanceLimit,
  levenshtein,
  normalizeSearchText,
} from "./searchNormalize"

export type SearchableSurah = {
  number: number
  englishName: string
  englishNameTranslation?: string
  name?: string
}

type IndexedSurah<T extends SearchableSurah> = {
  surah: T
  fields: string[]
}

const indexCache = new WeakMap<object, IndexedSurah<SearchableSurah>[]>()

function indexSurahs<T extends SearchableSurah>(surahs: T[]): IndexedSurah<T>[] {
  const cached = indexCache.get(surahs as object)
  if (cached) return cached as IndexedSurah<T>[]

  const indexed = surahs.map(surah => {
    const fields = [
      normalizeSearchText(surah.englishName),
      normalizeSearchText(surah.englishName, { keepArticle: true }),
      normalizeSearchText(surah.englishNameTranslation ?? ""),
      normalizeSearchText(surah.englishNameTranslation ?? "", { keepArticle: true }),
      normalizeSearchText(surah.name ?? ""),
      String(surah.number),
    ].filter(Boolean)
    return { surah, fields }
  })
  indexCache.set(surahs as object, indexed)
  return indexed
}

function bestSubstringScore(normalizedQuery: string, fields: string[]): number {
  let best = 0
  for (const field of fields) {
    if (!field) continue
    if (field === normalizedQuery) best = Math.max(best, 100)
    else if (field.startsWith(normalizedQuery)) best = Math.max(best, 80)
    else if (field.includes(normalizedQuery)) best = Math.max(best, 60)
  }
  return best
}

function bestFuzzyScore(normalizedQuery: string, fields: string[]): number {
  const limit = fuzzyDistanceLimit(normalizedQuery.length)
  let best = Number.POSITIVE_INFINITY
  for (const field of fields) {
    if (!field) continue
    const dist = levenshtein(normalizedQuery, field)
    if (dist < best) best = dist
    if (field.length > normalizedQuery.length) {
      // Compare against a same-length window when the field is longer
      for (let i = 0; i <= field.length - normalizedQuery.length; i++) {
        const slice = field.slice(i, i + normalizedQuery.length)
        const d = levenshtein(normalizedQuery, slice)
        if (d < best) best = d
      }
    }
  }
  if (!Number.isFinite(best) || best > limit) return 0
  return 40 - best * 10
}

/**
 * Rank Surahs for the Quran tab search box.
 * Substring matches (exact → starts-with → contains) win; fuzzy is fallback only.
 */
export function searchSurahs<T extends SearchableSurah>(query: string, surahs: T[]): T[] {
  const trimmed = query.trim()
  if (!trimmed) return surahs

  const normalizedQuery = normalizeSearchText(trimmed)
  const queryWithArticle = normalizeSearchText(trimmed, { keepArticle: true })
  const numericQuery = /^\d+$/.test(trimmed) ? trimmed : ""
  if (!normalizedQuery && !queryWithArticle && !numericQuery) return surahs

  const indexed = indexSurahs(surahs)
  const substringHits: { surah: T; score: number }[] = []

  for (const item of indexed) {
    let score = Math.max(
      bestSubstringScore(normalizedQuery, item.fields),
      bestSubstringScore(queryWithArticle, item.fields),
    )
    if (numericQuery && String(item.surah.number) === numericQuery) {
      score = Math.max(score, 100)
    }
    if (score > 0) substringHits.push({ surah: item.surah, score })
  }

  const ranked = substringHits.length
    ? substringHits
    : indexed
        .map(item => ({
          surah: item.surah,
          score: Math.max(
            bestFuzzyScore(normalizedQuery, item.fields),
            bestFuzzyScore(queryWithArticle, item.fields),
          ),
        }))
        .filter(hit => hit.score > 0)

  ranked.sort((a, b) => b.score - a.score || a.surah.number - b.surah.number)
  return ranked.map(hit => hit.surah)
}
