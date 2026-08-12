import { AppIcon } from "@/components/AppIcon"
import { useTheme } from "@/context/themeContext"
import { MAKKAH_PLACES } from "@/lib/makkahPlaces"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useTranslation } from "react-i18next"
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

export default function MakkahPlacesScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { theme } = useTheme()
  const { t } = useTranslation()

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{t("makkahPlacesTitle")}</Text>
          <Text style={styles.subtitle}>{t("makkahPlacesSub")}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {MAKKAH_PLACES.map(place => (
          <TouchableOpacity
            key={place.id}
            style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.push(`/makkah-place/${place.id}` as any)}
            activeOpacity={0.85}
          >
            <View style={[styles.iconWrap, { backgroundColor: "rgba(201,168,76,0.12)" }]}>
              <AppIcon name="kaaba" size={26} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>{t(place.titleKey)}</Text>
              <Text style={styles.arabic}>{place.arabic}</Text>
              <Text style={[styles.cardDesc, { color: theme.textSecondary }]} numberOfLines={2}>
                {t(place.descriptionKey)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C9A84C" />
          </TouchableOpacity>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    backgroundColor: "#1E3A5F",
    paddingHorizontal: 16,
    paddingBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtn: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    padding: 8,
  },
  title: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  subtitle: { color: "#C9A84C", fontSize: 12, marginTop: 2 },
  content: { padding: 16, gap: 12 },
  card: {
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 0.5,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontSize: 16, fontWeight: "700", marginBottom: 2 },
  arabic: { color: "#C9A84C", fontSize: 13, marginBottom: 4 },
  cardDesc: { fontSize: 12, lineHeight: 17 },
})
