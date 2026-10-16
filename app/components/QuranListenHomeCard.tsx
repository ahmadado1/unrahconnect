// Home card: "Listen to the Quran". (Premium users who are listening see the big player on Home instead.)
// Premium users who stopped in the middle of a surah see "Continue listening" with the exact time,
// and the card opens the full-page player. Everyone else goes to the Listen screen.
import TouchableOpacity from "@/app/components/AppPressable"
import { clock } from "@/app/components/QuranBigPlayer"
import { useTheme } from "@/context/themeContext"
import { usePremium } from "@/lib/premium"
import { loadListenSpot, type ListenSpot } from "@/lib/quranAudio"
import { useQuranPlayback } from "@/lib/useQuranPlayback"
import { Ionicons } from "@expo/vector-icons"
import { useFocusEffect, useRouter } from "expo-router"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, Text, View } from "react-native"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"

export default function QuranListenHomeCard() {
  const router = useRouter()
  const { theme } = useTheme()
  const { t } = useTranslation()
  const { isPremium } = usePremium()
  const playback = useQuranPlayback()
  const [spot, setSpot] = useState<ListenSpot | null>(null)

  useFocusEffect(
    useCallback(() => {
      let active = true
      void loadListenSpot().then(s => active && setSpot(s))
      return () => {
        active = false
      }
    }, [])
  )

  const playingNow = isPremium && playback.kind === "surah"
  const canContinue = isPremium && !playingNow && spot
  // Premium with something playing / paused: Home shows the big player instead of this card.
  if (playingNow || canContinue) return null

  const subtitle = playingNow
    ? `${playback.title} · ${playback.reciterName}`
    : canContinue
      ? `${spot.title} · ${clock(spot.position)}`
      : t("qaHomeSub")

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.card, borderColor: canContinue || playingNow ? GOLD : theme.border }]}
      onPress={() => router.push((canContinue || playingNow ? "/quran-player" : "/quran-listen") as any)}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={t("qaListenTitle")}
    >
      <View style={styles.icon}>
        <Ionicons name={playingNow && playback.playing ? "musical-notes" : "headset"} size={20} color={GOLD} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: theme.text }]}>
          {playingNow ? t("qaNowPlaying") : canContinue ? t("qaContinueListening") : t("qaListenTitle")}
        </Text>
        <Text style={[styles.sub, { color: theme.textSecondary }]} numberOfLines={1}>{subtitle}</Text>
      </View>
      <Ionicons name="play-circle" size={30} color={GOLD} />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: 12, marginHorizontal: 16, marginTop: 12, padding: 14, borderRadius: 16, borderWidth: 0.5 },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: NAVY, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 15, fontWeight: "700" },
  sub: { fontSize: 12, marginTop: 2 },
})
