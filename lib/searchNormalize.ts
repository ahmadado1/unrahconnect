/** Longest Arabic definite-article prefixes first (transliterated). */
const ARTICLE_PREFIXES = ["ash", "adh", "ath", "al", "an", "as", "ar", "az"] as const

function stripDiacritics(value: string): string {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
}

function isArticlePrefix(token: string): boolean {
  return (ARTICLE_PREFIXES as readonly string[]).includes(token)
}

function stripGluedArticle(value: string): string {
  for (const prefix of ARTICLE_PREFIXES) {
    if (value.length - prefix.length >= 4 && value.startsWith(prefix)) {
      return value.slice(prefix.length)
    }
  }
  return value
}

function collapseAlphanumeric(value: string): string {
  let out = stripDiacritics(String(value ?? "").toLowerCase())
  out = out.replace(/[''`ʾʿ]/g, "")
  out = out.replace(/[^a-z0-9\s-]+/g, " ")
  return out.replace(/[-_\s]+/g, " ").trim()
}

/**
 * Normalize a Surah search string: lowercase, strip punctuation/diacritics,
 * collapse separators, and drop a leading Al-/An-/Ash- style article.
 */
export function normalizeSearchText(value: string, options?: { keepArticle?: boolean }): string {
  const tokens = collapseAlphanumeric(value).split(" ").filter(Boolean)
  if (!options?.keepArticle && tokens.length > 1 && isArticlePrefix(tokens[0])) {
    tokens.shift()
  }

  const joined = tokens.join("")
  if (options?.keepArticle) return joined
  return stripGluedArticle(joined)
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length

  const row = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0]
    row[0] = i
    for (let j = 1; j <= b.length; j++) {
      const cur = row[j]
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost)
      prev = cur
    }
  }
  return row[b.length]
}

export function fuzzyDistanceLimit(queryLength: number): number {
  if (queryLength <= 3) return 1
  if (queryLength <= 6) return 2
  return 3
}
