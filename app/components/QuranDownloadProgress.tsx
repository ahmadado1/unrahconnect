import {
  getQuranDownloadState,
  subscribeQuranDownload,
  type QuranDownloadState,
} from "@/lib/quranDownload"
import { useEffect, useState } from "react"
import { StyleSheet, Text, View } from "react-native"

export default function QuranDownloadProgress() {
  const [state, setState] = useState<QuranDownloadState>(getQuranDownloadState)

  useEffect(() => subscribeQuranDownload(setState), [])

  if (state.status === "idle" || state.status === "complete") return null

  const percent =
    state.total > 0 ? Math.min(Math.round((state.done / state.total) * 100), 100) : 0

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.label} numberOfLines={1}>
          {state.label || "Downloading Quran..."}
        </Text>
        <Text style={styles.pct}>{percent}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percent}%` }]} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 6,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  label: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 11,
    flex: 1,
    marginRight: 8,
  },
  pct: {
    color: "#C9A84C",
    fontSize: 11,
    fontWeight: "600",
  },
  track: {
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.18)",
    overflow: "hidden",
  },
  fill: {
    height: 3,
    borderRadius: 2,
    backgroundColor: "#C9A84C",
  },
})
