import { useEffect, useState } from "react"
import { StyleSheet, Text, View } from "react-native"
import { toArabicIndic } from "../../lib/mushafFontSize"
import { packMushafPieces, type MushafBlock, type MushafLinePiece } from "../../lib/mushafLines"

type ParagraphBlock = Extract<MushafBlock, { type: "paragraph" }>

/** Scheherazade New, registered with expo-font. Never substitute a system face. */
export const MUSHAF_FONT = "ScheherazadeNew_400Regular"
export const MUSHAF_FONT_BOLD = "ScheherazadeNew_700Bold"

/** Same dark ink as the earlier readable mushaf. Weight stays regular. */
export const MUSHAF_INK = {
  color: "#0E1C33",
  fontWeight: "400" as const,
}

/** Body leading. Header and Bismillah keep their own spacing. */
const BODY_LEADING = 1.75

function markerMetrics(verseNumber: number, fontSize: number) {
  const digitSize = Math.max(13, Math.round(fontSize * 0.5))
  const label = toArabicIndic(verseNumber)
  const height = Math.round(fontSize * 1.15)
  const width = Math.max(height, Math.round(digitSize * label.length * 0.72) + 12)
  return { digitSize, label, height, width }
}

/**
 * One surah section, wrapped to the frame. Full lines are justified.
 * The last line stays on the right. The font size is never reduced.
 */
export default function MushafFittedLine({
  block,
  fontsLoaded,
  fontSize,
}: {
  block: ParagraphBlock
  fontsLoaded: boolean
  fontSize: number
}) {
  const lineHeight = Math.round(fontSize * BODY_LEADING)
  const gap = Math.max(4, Math.round(fontSize * 0.16))
  const [boxWidth, setBoxWidth] = useState(0)
  const [widths, setWidths] = useState<Record<string, number>>({})
  const pieceKey = block.pieces.map(piece => piece.key).join("|")

  useEffect(() => {
    setWidths({})
  }, [fontSize, pieceKey])

  const ready =
    fontsLoaded &&
    boxWidth > 0 &&
    block.pieces.every(piece => piece.type === "end" || widths[piece.key] != null)

  const widthOf = (piece: MushafLinePiece) =>
    piece.type === "end"
      ? markerMetrics(piece.verseNumber, fontSize).width
      : Math.max(1, widths[piece.key] ?? 1)

  const lines = ready ? packMushafPieces(block.pieces, widthOf, boxWidth - 1, gap) : []

  if (!fontsLoaded) {
    return <View style={{ width: "100%", minHeight: lineHeight }} />
  }

  const wordStyle = [styles.word, { fontSize, lineHeight, fontFamily: MUSHAF_FONT }]

  const rememberWidth = (key: string, width: number) => {
    setWidths(current => {
      const previous = current[key]
      if (previous != null && Math.abs(previous - width) < 0.5) return current
      return { ...current, [key]: width }
    })
  }

  const renderPiece = (piece: MushafLinePiece, measure: boolean) => {
    if (piece.type === "word") {
      return (
        <Text
          key={piece.key}
          style={wordStyle}
          onLayout={
            measure
              ? event => rememberWidth(piece.key, event.nativeEvent.layout.width)
              : undefined
          }
        >
          {piece.text}
        </Text>
      )
    }

    const marker = markerMetrics(piece.verseNumber, fontSize)
    return (
      <View
        key={piece.key}
        style={[
          styles.verseEndBadge,
          { width: marker.width, height: marker.height, borderRadius: marker.height / 2 },
        ]}
      >
        <Text style={[styles.verseEndText, { fontSize: marker.digitSize, fontFamily: MUSHAF_FONT_BOLD }]}>
          {marker.label}
        </Text>
      </View>
    )
  }

  return (
    <View
      style={[styles.slot, { minHeight: lineHeight }]}
      onLayout={event => {
        const width = event.nativeEvent.layout.width
        if (width <= 0 || Math.abs(boxWidth - width) < 0.5) return
        setBoxWidth(width)
      }}
    >
      {!ready ? (
        <View style={[styles.line, styles.wrap, { minHeight: lineHeight, columnGap: gap, rowGap: Math.round(fontSize * 0.12) }]}>
          {block.pieces.map(piece => renderPiece(piece, true))}
        </View>
      ) : null}
      {ready
        ? lines.map((line, index) => {
            const last = index === lines.length - 1
            return (
              <View
                key={line.map(piece => piece.key).join("|")}
                style={[
                  styles.line,
                  { minHeight: lineHeight },
                  last ? [styles.ragged, { columnGap: gap }] : styles.justify,
                ]}
              >
                {line.map(piece => renderPiece(piece, false))}
              </View>
            )
          })
        : null}
    </View>
  )
}

const styles = StyleSheet.create({
  slot: {
    width: "100%",
  },
  line: {
    width: "100%",
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  justify: {
    justifyContent: "space-between",
  },
  ragged: {
    justifyContent: "flex-start",
  },
  wrap: {
    flexWrap: "wrap",
    justifyContent: "flex-start",
    alignContent: "flex-start",
  },
  word: {
    flexShrink: 0,
    ...MUSHAF_INK,
  },
  verseEndBadge: {
    borderWidth: 1.25,
    borderColor: "#8B6914",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5EDD6",
    flexShrink: 0,
  },
  verseEndText: {
    color: "#1A1A1A",
    fontWeight: "700",
    textAlign: "center",
  },
})
