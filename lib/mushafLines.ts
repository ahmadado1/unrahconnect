import type { MushafVerse } from "./quranPageCache"

export type MushafLinePiece =
  | { type: "word"; text: string; key: string }
  | { type: "end"; verseNumber: number; key: string }

export type MushafBlock =
  | { type: "surahStart"; surahNumber: number; key: string }
  | { type: "line"; lineNumber: number; key: string; pieces: MushafLinePiece[] }

/**
 * Group words onto the Madani mushaf lines from the Quran.com `line_number`
 * field. Word text is copied through unchanged.
 */
export function buildMushafBlocks(verses: MushafVerse[]): MushafBlock[] {
  const blocks: MushafBlock[] = []
  let line: Extract<MushafBlock, { type: "line" }> | null = null

  for (const verse of verses) {
    if (verse.verse_number === 1) {
      const surahNumber = parseInt(verse.verse_key.split(":")[0], 10)
      line = null
      blocks.push({
        type: "surahStart",
        surahNumber,
        key: `surah-start-${surahNumber}-${verse.verse_key}`,
      })
    }

    for (const word of verse.words) {
      const lineNumber = word.line_number || 1
      if (!line || line.lineNumber !== lineNumber) {
        line = {
          type: "line",
          lineNumber,
          key: `line-${verse.verse_key}-${lineNumber}-${word.position}`,
          pieces: [],
        }
        blocks.push(line)
      }

      if (word.char_type_name === "end") {
        line.pieces.push({
          type: "end",
          verseNumber: verse.verse_number,
          key: `${verse.verse_key}-end`,
        })
      } else if (word.text_uthmani) {
        line.pieces.push({
          type: "word",
          text: word.text_uthmani,
          key: `${verse.verse_key}-${word.position}`,
        })
      }
    }
  }

  return blocks
}
