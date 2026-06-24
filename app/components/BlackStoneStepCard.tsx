import { useTheme } from "@/context/themeContext"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native"
import Animated, {
  Easing,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated"
import Svg, { Path } from "react-native-svg"

function PointingHand({ active }: { active: boolean }) {
  const progress = useSharedValue(0)

  useEffect(() => {
    if (!active) {
      progress.value = 0
      return
    }
    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    )
  }, [active, progress])

  const handStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: progress.value * 28 },
      { translateY: -progress.value * 36 },
    ],
  }))

  return (
    <View style={styles.illustrationWindow}>
      <Animated.View style={[styles.handWrap, handStyle]}>
        <Svg width={88} height={88} viewBox="0 0 64 64" fill="none">
          <Path
            d="M14 52V34c0-2.5 2-4.5 4.5-4.5S23 31.5 23 34v6h3v-9c0-2.5 2-4 4-4s4 1.5 4 4v9h3V22c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4v22c0 9-7 16-16 16h-6c-7 0-12-5-12-12z"
            fill="#C9A84C"
          />
          <Path
            d="M38 10c-1.5-2.5-5-3-7-1.5-2.5 2-4 6-4.5 10 .5-3.5 2-6.5 4.5-8 2-1.5 4.5-1 5.5 1.5 1 2 .5 4.5-.5 6.5 1.5-.5 3.5 0 4.5 2s0 5-1.5 7"
            fill="#D4AF5A"
          />
        </Svg>
      </Animated.View>
      <View style={styles.kaabaHint}>
        <View style={styles.kaabaBlock} />
        <Text style={styles.kaabaLabel}>Black Stone</Text>
      </View>
    </View>
  )
}

export default function BlackStoneStepCard() {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const [modalVisible, setModalVisible] = useState(false)

  return (
    <>
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.row}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>8</Text>
          </View>
          <View style={styles.content}>
            <Text style={[styles.title, { color: theme.text }]}>
              {t("phaseUmrah3Step8Title")}
            </Text>
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              {t("phaseUmrah3Step8")}
            </Text>
            <Pressable
              onPress={() => setModalVisible(true)}
              style={({ pressed }) => [styles.linkBtn, pressed && styles.linkBtnPressed]}
              hitSlop={8}
            >
              <Text style={styles.linkText}>{t("phaseUmrah3Step8ShowHow")}</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setModalVisible(false)}
        >
          <Pressable onPress={() => {}} style={styles.modalOuter}>
            <Animated.View
              entering={ZoomIn.springify().damping(15)}
              style={[styles.modalCard, { backgroundColor: theme.card }]}
            >
              <PointingHand active={modalVisible} />
              <Text style={[styles.modalText, { color: theme.textSecondary }]}>
                {t("phaseUmrah3Step8ModalText")}
              </Text>
              <Pressable
                style={({ pressed }) => [
                  styles.understoodBtn,
                  pressed && styles.understoodBtnPressed,
                ]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.understoodText}>{t("phaseUmrah3Step8Understood")}</Text>
              </Pressable>
            </Animated.View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 0.5,
    padding: 14,
    marginBottom: 12,
  },
  row: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  badge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#1E3A5F",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  content: { flex: 1, gap: 8 },
  title: { fontSize: 15, fontWeight: "bold", lineHeight: 22 },
  description: { fontSize: 14, lineHeight: 22 },
  linkBtn: { alignSelf: "flex-start", marginTop: 2 },
  linkBtnPressed: { opacity: 0.65 },
  linkText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#C9A84C",
    textDecorationLine: "underline",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalOuter: { width: "100%", maxWidth: 360 },
  modalCard: {
    borderRadius: 20,
    padding: 24,
    gap: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 8,
  },
  illustrationWindow: {
    height: 160,
    borderRadius: 14,
    backgroundColor: "rgba(30, 58, 95, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(201, 168, 76, 0.25)",
    overflow: "hidden",
    justifyContent: "flex-end",
    alignItems: "flex-start",
    padding: 16,
  },
  handWrap: {
    position: "absolute",
    left: 24,
    bottom: 20,
  },
  kaabaHint: {
    position: "absolute",
    top: 20,
    right: 20,
    alignItems: "center",
    gap: 6,
  },
  kaabaBlock: {
    width: 36,
    height: 36,
    backgroundColor: "#1E3A5F",
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#C9A84C",
  },
  kaabaLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748B",
  },
  modalText: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: "center",
  },
  understoodBtn: {
    backgroundColor: "#1E3A5F",
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: "center",
  },
  understoodBtnPressed: { opacity: 0.85 },
  understoodText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
})
