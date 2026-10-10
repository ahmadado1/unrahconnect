import { StyleSheet, Text, View } from "react-native"

type Props = { size?: number }

export function AviasalesMark({ size = 44 }: Props) {
  return (
    <View style={[styles.aviasales, { width: size, height: size, borderRadius: size * 0.28 }]}>
      <View
        style={{
          width: size * 0.62,
          height: size * 0.62,
          borderRadius: size * 0.18,
          backgroundColor: "#fff",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            width: size * 0.26,
            height: size * 0.34,
            borderRadius: size * 0.13,
            borderWidth: Math.max(2, size * 0.055),
            borderColor: "#3A6DFF",
          }}
        />
      </View>
    </View>
  )
}

export function SailyMark({ size = 44 }: Props) {
  return (
    <View style={[styles.saily, { width: size, height: size, borderRadius: size * 0.24 }]}>
      <Text style={[styles.sailyLetter, { fontSize: size * 0.46 }]}>S</Text>
      <View
        style={{
          width: size * 0.4,
          height: size * 0.16,
          marginTop: -size * 0.04,
          borderBottomWidth: Math.max(2, size * 0.06),
          borderColor: "#111",
          borderRadius: size,
        }}
      />
    </View>
  )
}

const AIRALO_BARS = [
  { height: 0.38, color: "#F6B73D" },
  { height: 0.56, color: "#F58A2A" },
  { height: 0.76, color: "#F15B4A" },
  { height: 1, color: "#E23D7A" },
] as const

export function AiraloMark({ size = 44 }: Props) {
  const barWidth = size * 0.16
  return (
    <View style={[styles.airalo, { width: size, height: size }]}>
      {AIRALO_BARS.map(bar => (
        <View
          key={bar.color}
          style={{
            width: barWidth,
            height: size * 0.78 * bar.height,
            borderRadius: barWidth / 2,
            backgroundColor: bar.color,
          }}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  aviasales: { backgroundColor: "#3A6DFF", alignItems: "center", justifyContent: "center" },
  saily: { backgroundColor: "#FFE500", alignItems: "center", justifyContent: "center" },
  sailyLetter: { color: "#111", fontWeight: "900" },
  airalo: { flexDirection: "row", alignItems: "flex-end", justifyContent: "center", gap: 3 },
})
