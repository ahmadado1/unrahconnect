import { useEffect, useRef, useState } from "react"
import { StyleSheet, Text, View } from "react-native"
// Gesture-handler Pressable: the Mushaf pages sit in a gesture-handler pager (swipe between
// pages), where the normal React Native Pressable often loses the tap to the swipe.
import { Pressable } from "react-native-gesture-handler"
import { toArabicIndic } from "../../lib/mushafFontSize"
import {
  mushafFontMetrics,
  mushafWordText,
  UTHMANI_MUSHAF_FONT,
  type MushafFontConfig,
} from "../../lib/mushafFonts"
import { packMushafPieces, type MushafBlock, type MushafLinePiece } from "../../lib/mushafLines"

type ParagraphBlock = Extract<MushafBlock, { type: "paragraph" }>

/** Scheherazade New, registered with expo-font. Never substitute a system face. */
// Fixed Scheherazade (kasra under the letter with shadda). Load with UC_QURAN_FONTS / MUSHAF_FONT_ASSETS.
export const MUSHAF_FONT = "UCScheherazade"
export const MUSHAF_FONT_BOLD = "UCScheherazadeBold"

/** Same dark ink as the earlier readable mushaf. Weight stays regular. */
export const MUSHAF_INK = {
  color: "#0E1C33",
  fontWeight: "400" as const,
}

/**
 * Tap a verse number → verse menu. Switched OFF for now: taps were unreliable inside the
 * page-swipe view. The code stays; set to true to try it again.
 */
const VERSE_MENU_ENABLED = false

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
function pieceIsVerse(piece: MushafLinePiece, verseKey: string) {
  return piece.key.startsWith(`${verseKey}-`)
}

export default function MushafFittedLine({
  block,
  fontsLoaded,
  fontSize,
  mushafFont = UTHMANI_MUSHAF_FONT,
  anchorVerseKey,
  anchorRef,
  highlighted = false,
  onSettled,
  onAnchorLayout,
  onVersePress,
}: {
  block: ParagraphBlock
  fontsLoaded: boolean
  fontSize: number
  /** Arabic body font; ayah markers keep their own face and size. */
  mushafFont?: MushafFontConfig
  /** `surah:ayah` of a verse to scroll to once lines have their final positions. */
  anchorVerseKey?: string
  anchorRef?: { current: View | null }
  highlighted?: boolean
  /** Fires once after the packed lines have laid out. */
  onSettled?: () => void
  /** Fires when the first line of anchorVerseKey is laid out. */
  onAnchorLayout?: () => void
  /** Tap on a verse-end number: "surah:ayah" (opens the verse menu: play, tafsir, bookmark). */
  onVersePress?: (verseKey: string) => void
}) {
  const { fontSize: wordSize, lineHeight } = mushafFontMetrics(mushafFont, fontSize)
  const gap = Math.max(4, Math.round(fontSize * 0.16))
  const [boxWidth, setBoxWidth] = useState(0)
  const [widths, setWidths] = useState<Record<string, number>>({})
  const pieceKey = block.pieces.map(piece => piece.key).join("|")

  useEffect(() => {
    setWidths({})
  }, [fontSize, pieceKey, mushafFont.id])

  const ready =
    fontsLoaded &&
    boxWidth > 0 &&
    block.pieces.every(piece => piece.type === "end" || widths[piece.key] != null)

  const widthOf = (piece: MushafLinePiece) =>
    piece.type === "end"
      ? markerMetrics(piece.verseNumber, fontSize).width
      : Math.max(1, widths[piece.key] ?? 1)

  const lines = ready ? packMushafPieces(block.pieces, widthOf, boxWidth - 1, gap) : []
  const settledRef = useRef(false)
  const laidOutRef = useRef(new Set<number>())
  const onSettledRef = useRef(onSettled)
  onSettledRef.current = onSettled
  if (!ready) {
    settledRef.current = false
    laidOutRef.current.clear()
  }

  const markLineLaidOut = (index: number) => {
    if (!ready) return
    laidOutRef.current.add(index)
    if (settledRef.current || laidOutRef.current.size < lines.length) return
    settledRef.current = true
    onSettledRef.current?.()
  }

  useEffect(() => {
    if (!ready || lines.length === 0 || laidOutRef.current.size < lines.length) return
    onSettledRef.current?.()
  }, [ready, lines.length, pieceKey, fontSize, mushafFont.id, boxWidth])

  if (!fontsLoaded) {
    return <View style={{ width: "100%", minHeight: lineHeight }} />
  }

  const wordStyle = [styles.word, { fontSize: wordSize, lineHeight, fontFamily: mushafFont.family }]

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
          {mushafWordText(mushafFont, piece)}
        </Text>
      )
    }

    const marker = markerMetrics(piece.verseNumber, fontSize)
    const badgeStyle = [
      styles.verseEndBadge,
      { width: marker.width, height: marker.height, borderRadius: marker.height / 2 },
    ]
    const label = (
      <Text style={[styles.verseEndText, { fontSize: marker.digitSize, fontFamily: MUSHAF_FONT_BOLD }]}>
        {marker.label}
      </Text>
    )
    // Measuring pass (hidden) and pages without a menu: plain badge.
    if (measure || !onVersePress || !VERSE_MENU_ENABLED) {
      return (
        <View key={piece.key} style={badgeStyle}>
          {label}
        </View>
      )
    }
    const verseKey = piece.key.replace(/-end$/, "")
    return (
      <Pressable
        key={piece.key}
        onPress={() => onVersePress(verseKey)}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={verseKey}
        style={({ pressed }) => [badgeStyle, pressed && styles.verseEndPressed]}
      >
        {label}
      </Pressable>
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
        ? (() => {
            let anchorPlaced = false
            return lines.map((line, index) => {
              const last = index === lines.length - 1
              const matchesAnchor = anchorVerseKey
                ? line.some(piece => pieceIsVerse(piece, anchorVerseKey))
                : false
              const isAnchorStart = matchesAnchor && !anchorPlaced
              if (matchesAnchor) anchorPlaced = true
              return (
                <View
                  key={line.map(piece => piece.key).join("|")}
                  ref={isAnchorStart ? anchorRef : undefined}
                  collapsable={isAnchorStart ? false : undefined}
                  onLayout={() => {
                    markLineLaidOut(index)
                    if (isAnchorStart) onAnchorLayout?.()
                  }}
                  style={[
                    styles.line,
                    { minHeight: lineHeight },
                    last ? [styles.ragged, { columnGap: gap }] : styles.justify,
                    highlighted && matchesAnchor && styles.lineGlow,
                  ]}
                >
                  {line.map(piece => renderPiece(piece, false))}
                </View>
              )
            })
          })()
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
  lineGlow: {
    backgroundColor: "rgba(201,168,76,0.32)",
    borderRadius: 6,
    shadowColor: "#C9A84C",
    shadowOpacity: 0.9,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
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
  verseEndPressed: {
    backgroundColor: "#E8D5A3",
    transform: [{ scale: 0.92 }],
  },
  verseEndText: {
    color: "#1A1A1A",
    fontWeight: "700",
    textAlign: "center",
  },
})
