const SHADDA = "\u0651"

const BELOW_VOWEL = new Set([
  "\u0650", // kasra
  "\u064D", // kasratan
  "\u061A", // small kasra
  "\u08F2", // open kasratan
])

const SMALL_MEEM = new Set([
  "\u06E2",
  "\u06ED",
  "\u06D8",
])

/**
 * Mushaf fonts draw kasra under the letter only when shadda comes first
 * (م + ّ + ِ). A previous pass stored the vowel before the shadda, which
 * makes the mark above the meem look like a fatha and hides the kasra.
 * This puts shadda back in front of the vowel. Text that is already in
 * that order is left as-is.
 */
export function showKasraWithShadda(text: string): string {
  if (!text.includes(SHADDA)) return text

  let out = ""
  for (let i = 0; i < text.length; i++) {
    const vowel = text[i]
    if (!BELOW_VOWEL.has(vowel)) {
      out += vowel
      continue
    }
    const second = text[i + 1]
    if (second === SHADDA) {
      out += SHADDA + vowel
      i += 1
      continue
    }
    if (second && SMALL_MEEM.has(second) && text[i + 2] === SHADDA) {
      out += SHADDA + vowel + second
      i += 2
      continue
    }
    out += vowel
  }
  return out
}
