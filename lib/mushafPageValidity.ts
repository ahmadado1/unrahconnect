import type { MushafPageData } from "./quranPageCache"

/** A page is usable only when it contains verses and at least one word of text. */
export function isUsableMushafPage(data: MushafPageData | null | undefined): data is MushafPageData {
  if (!data || !Array.isArray(data.verses) || data.verses.length === 0) return false
  return data.verses.some(verse =>
    Array.isArray(verse.words) &&
    verse.words.some(word => word.char_type_name === "end" || Boolean(word.text_uthmani?.trim())),
  )
}
