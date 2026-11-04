// Progress bar for the Quran player that you can drag (or tap) to jump to any second.
// While dragging, the time shows where you will land; the audio jumps when you let go.
import { useRef, useState } from "react"
import { PanResponder, StyleSheet, Text, View, type GestureResponderEvent } from "react-native"

const GOLD = "#C9A84C"

function clock(seconds: number) {
  const s = Math.max(0, Math.floor(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = String(s % 60).padStart(2, "0")
  return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`
}

export default function QuranSeekBar({
  position,
  duration,
  onSeek,
  disabled,
  big,
}: {
  position: number
  duration: number
  onSeek: (seconds: number) => void
  disabled?: boolean
  /** Bigger knob (full-page player). */
  big?: boolean
}) {
  const [width, setWidth] = useState(1)
  const [dragAt, setDragAt] = useState<number | null>(null)
  // The responder is made once, so it reads the latest values from refs.
  const live = useRef({ width: 1, duration: 0, disabled: false, onSeek })
  live.current = { width, duration, disabled: !!disabled, onSeek }

  const toSeconds = (x: number) => {
    const { width: w, duration: d } = live.current
    return Math.min(d, Math.max(0, (x / w) * d))
  }

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !live.current.disabled && live.current.duration > 0,
      onMoveShouldSetPanResponder: () => !live.current.disabled && live.current.duration > 0,
      // Don't let a scroll view steal the drag.
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e: GestureResponderEvent) => setDragAt(toSeconds(e.nativeEvent.locationX)),
      onPanResponderMove: (e: GestureResponderEvent) => setDragAt(toSeconds(e.nativeEvent.locationX)),
      onPanResponderRelease: (e: GestureResponderEvent) => {
        const to = toSeconds(e.nativeEvent.locationX)
        setDragAt(null)
        live.current.onSeek(to)
      },
      onPanResponderTerminate: () => setDragAt(null),
    })
  ).current

  const shown = dragAt ?? position
  const percent = duration > 0 ? Math.min(100, (shown / duration) * 100) : 0
  const knob = big ? 18 : dragAt !== null ? 18 : 14

  return (
    <View>
      <View
        style={styles.hit}
        onLayout={e => setWidth(Math.max(1, e.nativeEvent.layout.width))}
        {...responder.panHandlers}
      >
        {/* Children ignore touches so locationX is always measured on this bar. */}
        <View style={styles.track} pointerEvents="none">
          <View style={[styles.fill, { width: `${percent}%` }]} />
        </View>
        <View
          pointerEvents="none"
          style={[
            styles.knob,
            { left: `${percent}%`, width: knob, height: knob, borderRadius: knob / 2, marginLeft: -knob / 2, top: 14 - knob / 2 },
          ]}
        />
      </View>
      <View style={styles.times} pointerEvents="none">
        <Text style={[styles.time, dragAt !== null && styles.timeDrag]}>{clock(shown)}</Text>
        <Text style={styles.time}>{duration ? clock(duration) : "--:--"}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  // Tall touch area (28 px) around a thin bar, so it's easy to grab.
  hit: { height: 28, justifyContent: "center", marginTop: 6 },
  track: { height: 5, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.2)", overflow: "hidden" },
  fill: { height: "100%", backgroundColor: GOLD },
  knob: { position: "absolute", backgroundColor: GOLD },
  times: { flexDirection: "row", justifyContent: "space-between" },
  time: { color: "rgba(255,255,255,0.65)", fontSize: 11 },
  timeDrag: { color: GOLD, fontWeight: "700" },
})
