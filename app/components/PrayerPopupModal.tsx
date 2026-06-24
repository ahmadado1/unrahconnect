import { PRAYER_INFO, type PrayerName } from "@/lib/prayerConstants"
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import Svg, { Circle, Defs, Pattern, Polygon, Rect } from "react-native-svg"

const IslamicPatternSVG = () => (
  <View style={styles.patternLayer} pointerEvents="none">
    <Svg width="100%" height="100%" preserveAspectRatio="none">
      <Defs>
        <Pattern id="islamicPrayerPattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
          <Polygon points="30,5 55,17.5 55,42.5 30,55 5,42.5 5,17.5" fill="none" stroke="#C9A84C" strokeWidth="1" opacity="0.2" />
          <Polygon points="30,12 48,22 48,38 30,48 12,38 12,22" fill="none" stroke="#C9A84C" strokeWidth="1" opacity="0.2" />
          <Circle cx="30" cy="30" r="6" fill="none" stroke="#C9A84C" strokeWidth="1" opacity="0.2" />
        </Pattern>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#islamicPrayerPattern)" />
    </Svg>
  </View>
)

type PrayerPopupModalProps = {
  visible: boolean
  prayerName: PrayerName | null
  onDismiss: () => void
  onSnooze: () => void
}

export default function PrayerPopupModal({
  visible,
  prayerName,
  onDismiss,
  onSnooze,
}: PrayerPopupModalProps) {
  const info = prayerName ? PRAYER_INFO[prayerName] : null

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <View style={styles.popupOverlay}>
        <View style={styles.popupCard}>
          <IslamicPatternSVG />
          <View style={styles.popupContent}>
            <Text style={styles.popupMosque}>🕌</Text>
            <Text style={styles.popupArabic}>{info?.arabic ?? ""}</Text>
            <Text style={styles.popupTitle}>It&apos;s time for {prayerName}</Text>
            <View style={styles.popupDivider} />
            <Text style={styles.popupDuaLabel}>Dua before prayer</Text>
            <Text style={styles.popupDuaArabic}>{info?.dua ?? ""}</Text>
            <Text style={styles.popupDuaTranslit}>{info?.duaTranslit ?? ""}</Text>
            <Text style={styles.popupDuaTranslation}>{info?.duaTranslation ?? ""}</Text>

            <TouchableOpacity style={styles.popupBtn} onPress={onDismiss}>
              <Text style={styles.popupBtnText}>Pray Now</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.popupBtnSecondary} onPress={onSnooze}>
              <Text style={styles.popupBtnSecondaryText}>Remind me in 5 minutes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  popupOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "flex-end" },
  popupCard: {
    backgroundColor: "#1E3A5F",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.3)",
    borderBottomWidth: 0,
    overflow: "hidden",
    minHeight: "85%",
  },
  patternLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  popupContent: {
    flex: 1,
    padding: 36,
    paddingBottom: 52,
    paddingTop: 48,
    alignItems: "center",
    zIndex: 1,
  },
  popupMosque: { fontSize: 80, marginBottom: 20 },
  popupArabic: { fontSize: 32, color: "#C9A84C", marginBottom: 10, textAlign: "center" },
  popupTitle: { fontSize: 26, fontWeight: "bold", color: "#fff", marginBottom: 24, textAlign: "center" },
  popupDivider: { width: 80, height: 1, backgroundColor: "rgba(201,168,76,0.4)", marginBottom: 24 },
  popupDuaLabel: { fontSize: 11, color: "#C9A84C", fontWeight: "600", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 16 },
  popupDuaArabic: { fontSize: 20, color: "#fff", textAlign: "right", lineHeight: 36, marginBottom: 14, width: "100%" },
  popupDuaTranslit: { fontSize: 14, color: "#C9A84C", fontStyle: "italic", textAlign: "center", marginBottom: 10, lineHeight: 22 },
  popupDuaTranslation: { fontSize: 14, color: "rgba(255,255,255,0.6)", textAlign: "center", lineHeight: 22, marginBottom: 32 },
  popupBtn: { backgroundColor: "#C9A84C", borderRadius: 25, paddingVertical: 16, width: "100%", alignItems: "center", marginBottom: 14 },
  popupBtnText: { color: "#1E3A5F", fontSize: 16, fontWeight: "bold" },
  popupBtnSecondary: { paddingVertical: 12, alignItems: "center" },
  popupBtnSecondaryText: { color: "rgba(255,255,255,0.5)", fontSize: 14 },
})
