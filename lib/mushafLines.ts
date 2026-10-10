import type { MushafVerse } from "./quranPageCache"

export type MushafLinePiece =
  | { type: "word"; text: string; key: string }
  | { type: "end"; verseNumber: number; key: string }

export type MushafBlock =
  | { type: "surahStart"; surahNumber: number; key: string }
  | { type: "paragraph"; key: string; pieces: MushafLinePiece[] }

/**
 * One flowing paragraph per surah section on the page. Words stay in order.
 * Verse ends are markers inside the paragraph, and `line_number` is ignored
 * so the text can wrap to the screen width.
 */
function verseOrder(verse: MushafVerse) {
  const [surah, ayah] = verse.verse_key.split(":").map(part => Number(part) || 0)
  return { surah, ayah }
}

export function buildMushafBlocks(verses: MushafVerse[]): MushafBlock[] {
  const ordered = [...verses].sort((a, b) => {
    const left = verseOrder(a)
    const right = verseOrder(b)
    return left.surah - right.surah || left.ayah - right.ayah || a.verse_number - b.verse_number
  })

  const blocks: MushafBlock[] = []
  let paragraph: Extract<MushafBlock, { type: "paragraph" }> | null = null
  let currentSurah = 0

  for (const verse of ordered) {
    const surahNumber = verseOrder(verse).surah
    if (surahNumber !== currentSurah) {
      currentSurah = surahNumber
      paragraph = null
      if (verse.verse_number === 1 && surahNumber > 0) {
        blocks.push({
          type: "surahStart",
          surahNumber,
          key: `surah-start-${surahNumber}-${verse.verse_key}`,
        })
      }
    }

    if (!paragraph) {
      paragraph = {
        type: "paragraph",
        key: `paragraph-${verse.verse_key}`,
        pieces: [],
      }
      blocks.push(paragraph)
    }

    for (const word of verse.words ?? []) {
      if (word.char_type_name === "end") {
        paragraph.pieces.push({
          type: "end",
          verseNumber: verse.verse_number,
          key: `${verse.verse_key}-end`,
        })
      } else if (word.text_uthmani?.trim()) {
        paragraph.pieces.push({
          type: "word",
          text: word.text_uthmani,
          key: `${verse.verse_key}-${word.position}`,
        })
      }
    }
  }

  return blocks.filter(block => block.type === "surahStart" || block.pieces.length > 0)
}

/**
 * Greedy wrap. A piece stays on the current line when it fits, including an
 * ayah marker after the last word. Only the caller treats the final line as
 * the ragged one.
 */
export function packMushafPieces<T extends { key: string }>(
  pieces: T[],
  widthOf: (piece: T) => number,
  maxWidth: number,
  gap: number,
): T[][] {
  if (maxWidth <= 0) return pieces.length ? [pieces] : []

  const lines: T[][] = []
  let current: T[] = []
  let used = 0

  for (const piece of pieces) {
    const width = Math.max(0, widthOf(piece))
    const next = current.length === 0 ? width : used + gap + width
    if (current.length > 0 && next > maxWidth) {
      lines.push(current)
      current = [piece]
      used = width
    } else {
      current.push(piece)
      used = next
    }
  }

  if (current.length) lines.push(current)
  return lines
}
