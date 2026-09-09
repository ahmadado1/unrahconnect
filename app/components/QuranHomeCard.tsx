import { LinearGradient } from "expo-linear-gradient"
import { ScheherazadeNew_400Regular, useFonts } from "@expo-google-fonts/scheherazade-new"
import { Ionicons } from "@expo/vector-icons"
import { ActivityIndicator, StyleSheet, Text, View } from "react-native"
import { useTheme } from "@/context/themeContext"
import AppPressable from "@/app/components/AppPressable"
import type { HomeQuranCardState } from "@/lib/homeQuranCard"
import { cardShadow, ui } from "@/lib/ui"

const BISMILLAH = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"
const NO_BISMILLAH_SURAH = 9
const CARD_RADIUS = 24

type Props = {
  card: HomeQuranCardState
  previewText: string
  startLabel: string
  loading?: boolean
  onPress: () => void
}

function stripLeadingBismillah(text: string) {
  const trimmed = text.trim()
  if (trimmed.startsWith(BISMILLAH)) return trimmed.slice(BISMILLAH.length).trim()
  return trimmed
}

export default function QuranHomeCard({
  card,
  previewText,
  startLabel,
  loading = false,
  onPress,
}: Props) {
  const { theme } = useTheme()
  const [fontsLoaded] = useFonts({ ScheherazadeNew_400Regular })
  const showBismillah = card.surahNumber !== NO_BISMILLAH_SURAH
  const verses = stripLeadingBismillah(previewText)
  const fadeColors = theme.dark
    ? ["rgba(30,42,58,0)", "rgba(30,42,58,0.72)", theme.card]
    : ["rgba(255,255,255,0)", "rgba(255,255,255,0.78)", "#FFFFFF"]

  return (
    <AppPressable
      onPress={onPress}
      style={[
        styles.card,
        cardShadow,
        { backgroundColor: theme.card, borderColor: theme.border },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${card.englishName}. ${startLabel}`}
    >
      {showBismillah ? (
        <Text
          style={[
            styles.bismillah,
            { color: theme.text },
            fontsLoaded && { fontFamily: "ScheherazadeNew_400Regular" },
          ]}
        >
          {BISMILLAH}
        </Text>
      ) : null}

      <View style={styles.previewClip}>
        {loading && !verses ? (
          <View style={styles.loadingWrap}>
            <View style={styles.loadingGlow} />
            <ActivityIndicator color="#8E8E93" />
          </View>
        ) : (
          <Text
            style={[
              styles.previewArabic,
              { color: theme.text },
              fontsLoaded && { fontFamily: "ScheherazadeNew_400Regular" },
            ]}
          >
            {verses}
          </Text>
        )}
        <LinearGradient
          colors={fadeColors}
          locations={[0, 0.42, 1]}
          style={styles.fade}
          pointerEvents="none"
        />
      </View>

      <View style={[styles.cta, { backgroundColor: theme.dark ? theme.inputBg : "#F3F3F3" }]}>
        <Text style={[styles.ctaText, { color: theme.dark ? theme.text : "#3A3A3A" }]}>{startLabel}</Text>
        <Ionicons name="arrow-forward" size={14} color={theme.dark ? theme.text : "#3A3A3A"} />
      </View>
    </AppPressable>
  )
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: CARD_RADIUS,
    borderWidth: ui.hairline,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 18,
    overflow: "hidden",
  },
  bismillah: {
    fontSize: 26,
    textAlign: "center",
    lineHeight: 40,
    marginBottom: 10,
  },
  previewClip: {
    height: 148,
    overflow: "hidden",
    marginBottom: 16,
  },
  previewArabic: {
    fontSize: 23,
    textAlign: "center",
    writingDirection: "rtl",
    lineHeight: 42,
  },
  fade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 96,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingGlow: {
    position: "absolute",
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "rgba(201,168,76,0.18)",
  },
  cta: {
    alignSelf: "center",
    borderRadius: ui.radiusPill,
    paddingVertical: 10,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: "600",
  },
})
