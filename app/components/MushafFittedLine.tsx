import { useRef, useState } from "react"
import { StyleSheet, Text, View } from "react-native"
import type { MushafBlock } from "../../lib/mushafLines"

type LineBlock = Extract<MushafBlock, { type: "line" }>

/**
 * One Madani line. Words stay in official order. A line that is wider than
 * the frame scales down just enough to stay inside the side borders.
 */
export default function MushafFittedLine({
  block,
  fontsLoaded,
}: {
  block: LineBlock
  fontsLoaded: boolean
}) {
  const spread = block.pieces.length > 2
  const widths = useRef<Record<string, number>>({})
  const boxRef = useRef(0)
  const [boxWidth, setBoxWidth] = useState(0)
  const [natural, setNatural] = useState(0)

  const publishNatural = () => {
    if (block.pieces.some(piece => widths.current[piece.key] == null)) return
    const margins = block.pieces.reduce((sum, piece) => sum + (piece.type === "end" ? 2 : 0), 0)
    const sum = block.pieces.reduce((total, piece) => total + (widths.current[piece.key] ?? 0), 0) + margins
    setNatural(prev => (Math.abs(prev - sum) < 0.5 ? prev : sum))
  }

  const overflow = boxWidth > 0 && natural > boxWidth - 4
  const scale = overflow ? (boxWidth - 6) / natural : 1

  return (
    <View
      style={styles.slot}
      onLayout={event => {
        const width = event.nativeEvent.layout.width
        if (Math.abs(boxRef.current - width) < 0.5) return
        boxRef.current = width
        setBoxWidth(width)
      }}
    >
      <View
        style={[
          styles.line,
          !spread && !overflow && styles.center,
          overflow ? { width: natural, transform: [{ scale }] } : styles.full,
        ]}
      >
        {block.pieces.map(piece => {
          if (piece.type === "word") {
            return (
              <Text
                key={piece.key}
                onLayout={event => {
                  const width = event.nativeEvent.layout.width
                  const prev = widths.current[piece.key]
                  if (prev != null && Math.abs(prev - width) < 0.5) return
                  widths.current[piece.key] = width
                  publishNatural()
                }}
                style={[styles.word, fontsLoaded && { fontFamily: "AmiriQuran" }]}
              >
                {piece.text}
              </Text>
            )
          }
          return (
            <View
              key={piece.key}
              onLayout={event => {
                const width = event.nativeEvent.layout.width
                const prev = widths.current[piece.key]
                if (prev != null && Math.abs(prev - width) < 0.5) return
                widths.current[piece.key] = width
                publishNatural()
              }}
              style={styles.verseEndBadge}
            >
              <Text style={styles.verseEndText}>{piece.verseNumber}</Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  slot: {
    width: "100%",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  line: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  full: {
    width: "100%",
  },
  center: {
    justifyContent: "center",
    gap: 8,
  },
  word: {
    fontSize: 28,
    color: "#071018",
    lineHeight: 58,
    fontWeight: "400",
    // Amiri Quran has no bold cut. A sharp copy of the same ink thickens
    // the strokes without changing size, spacing, or the fitted line.
    textShadowColor: "#071018",
    textShadowOffset: { width: 0.55, height: 0 },
    textShadowRadius: 0.2,
  },
  verseEndBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.25,
    borderColor: "#8B6914",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5EDD6",
    flexShrink: 0,
    marginHorizontal: 1,
  },
  verseEndText: {
    fontSize: 11,
    color: "#1A1A1A",
    fontWeight: "700",
    textAlign: "center",
  },
})
