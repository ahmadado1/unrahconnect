// Full-page Quran player (Premium). Opened from the big player card on the Listen screen
// or from the "Continue listening" card on Home.
import TouchableOpacity from "@/app/components/AppPressable"
import QuranBigPlayer from "@/app/components/QuranBigPlayer"
import { usePremium } from "@/lib/premium"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useTranslation } from "react-i18next"
import { StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

export default function QuranPlayerScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { t } = useTranslation()
  const { isPremium } = usePremium()

  return (
    <LinearGradient colors={["#0F2140", "#1E3A5F", "#0F2140"]} style={styles.screen}>
      <StatusBar style="light" />
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} accessibilityLabel={t("qaClose")}>
          <Ionicons name="chevron-down" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("qaNowPlaying")}</Text>
        <TouchableOpacity onPress={() => router.push("/quran-listen" as any)} style={styles.iconBtn} accessibilityLabel={t("qaChooseReciter")}>
          <Ionicons name="list" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, paddingBottom: insets.bottom + 30 }}>
        {isPremium ? (
          <QuranBigPlayer variant="full" />
        ) : (
          <Text style={styles.locked}>{t("premiumFeatureBody")}</Text>
        )}
      </View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16 },
  iconBtn: { backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 20, padding: 7 },
  headerTitle: { color: "#E8D5A3", fontSize: 13, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" },
  locked: { color: "rgba(255,255,255,0.75)", textAlign: "center", marginTop: 80, paddingHorizontal: 30 },
})
