import { AppIcon, ICON_GOLD } from "@/components/AppIcon"
import { useTheme } from "@/context/themeContext"
import type { ReactNode } from "react"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, Text, View } from "react-native"
import Animated, {
  FadeInRight,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated"

type Props = {
  number: number
  index: number
  text: string
  title?: string
  badgeLabel?: string
  badgeColor: string
  crucial?: boolean
  menOnly?: boolean
  noteKey?: string
  arabic?: string
  transliteration?: string
  translation?: string
  citation?: string
  children?: ReactNode
}

export default function PhaseStepCard({
  number,
  index,
  text,
  title,
  badgeLabel,
  badgeColor,
  crucial,
  menOnly,
  noteKey,
  arabic,
  transliteration,
  translation,
  citation,
  children,
}: Props) {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const pulse = useSharedValue(0.3)

  useEffect(() => {
    if (!crucial) return
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 500 }),
        withTiming(0.3, { duration: 500 }),
      ),
      -1,
      false,
    )
  }, [crucial, pulse])

  const pulseStyle = useAnimatedStyle(() =>
    crucial
      ? {
          borderColor: interpolateColor(
            pulse.value,
            [0.3, 1],
            ["rgba(217, 119, 6, 0.35)", "rgba(217, 119, 6, 1)"],
          ),
          shadowOpacity: pulse.value * 0.3,
        }
      : {},
  )

  return (
    <Animated.View
      entering={FadeInRight.duration(400).delay(80 + index * 55)}
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: crucial ? "rgba(217, 119, 6, 0.5)" : theme.border,
          borderWidth: crucial ? 1.5 : 0.5,
          shadowColor: crucial ? "#D97706" : "transparent",
        },
        crucial && styles.crucialShadow,
        pulseStyle,
      ]}
    >
      <View style={styles.row}>
        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
          <Text style={styles.badgeText}>{number}</Text>
        </View>
        <View style={styles.body}>
          {(title || badgeLabel || crucial || menOnly) ? (
            <View style={styles.titleRow}>
              {title ? (
                <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
              ) : null}
              {menOnly ? (
                <View style={styles.menPill}>
                  <Text style={styles.menPillText}>{t("tawafMenOnly")}</Text>
                </View>
              ) : null}
              {badgeLabel ? (
                <View style={styles.crucialPill}>
                  <Text style={styles.crucialPillText}>{badgeLabel}</Text>
                </View>
              ) : crucial && !badgeLabel ? (
                <View style={styles.crucialPill}>
                  <Text style={styles.crucialPillText}>{t("crucialStepBadge")}</Text>
                </View>
              ) : null}
            </View>
          ) : null}
          <Text style={[styles.text, { color: theme.textSecondary }]}>{text}</Text>
          {arabic ? (
            <View style={[styles.duaBlock, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <Text style={styles.duaArabic}>{arabic}</Text>
              {transliteration ? (
                <Text style={styles.translit}>{transliteration}</Text>
              ) : null}
              {translation ? (
                <Text style={[styles.translation, { color: theme.textSecondary }]}>
                  {translation}
                </Text>
              ) : null}
              {citation ? (
                <View style={styles.citationRow}>
                  <AppIcon name="book" size={12} color={ICON_GOLD} />
                  <Text style={styles.citation}>{citation}</Text>
                </View>
              ) : null}
            </View>
          ) : citation ? (
            <View style={styles.citationRow}>
              <AppIcon name="book" size={12} color={ICON_GOLD} />
              <Text style={styles.citation}>{citation}</Text>
            </View>
          ) : null}
          {noteKey ? (
            <View style={styles.noteBadge}>
              <Text style={styles.noteText}>{t(noteKey)}</Text>
            </View>
          ) : null}
          {children}
        </View>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, padding: 14 },
  crucialShadow: {
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    elevation: 3,
  },
  row: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  badge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  body: { flex: 1, gap: 8 },
  titleRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
  title: { fontSize: 15, fontWeight: "bold", lineHeight: 22, flexShrink: 1 },
  menPill: {
    backgroundColor: "rgba(30, 58, 95, 0.1)",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  menPillText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#1E3A5F",
    textTransform: "uppercase",
  },
  crucialPill: {
    backgroundColor: "rgba(217, 119, 6, 0.15)",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(217, 119, 6, 0.35)",
  },
  crucialPillText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#D97706",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  text: { fontSize: 14, lineHeight: 22 },
  duaBlock: {
    borderRadius: 10,
    borderWidth: 0.5,
    padding: 12,
    gap: 8,
    marginTop: 2,
  },
  duaArabic: {
    fontSize: 20,
    textAlign: "center",
    lineHeight: 34,
    color: "#1E3A5F",
  },
  citationRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  citation: { fontSize: 11, lineHeight: 16, color: "#C9A84C", fontStyle: "italic", flex: 1 },
  noteBadge: {
    backgroundColor: "rgba(217, 119, 6, 0.1)",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(217, 119, 6, 0.25)",
  },
  noteText: { fontSize: 12, lineHeight: 18, color: "#B45309", fontWeight: "500" },
  translit: { fontSize: 13, color: "#C9A84C", fontStyle: "italic", lineHeight: 20, textAlign: "center" },
  translation: { fontSize: 13, lineHeight: 20, textAlign: "center" },
})
