// Tours & ziyarah: search a holy site, mosque or Saudi city and open Booking.com
// "things to do" there (tours, tickets, day trips). Short list on purpose.
import BookingLogo from "@/app/components/BookingLogo"
import OfflineBanner from "@/app/components/OfflineBanner"
import TouchableOpacity from "@/app/components/AppPressable"
import { useTheme } from "@/context/themeContext"
import { openExternalUrl } from "@/lib/openAffiliateWebView"
import { searchTours, tourLink, type TourCity } from "@/lib/tours"
import { GOLD, NAVY, ui } from "@/lib/ui"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { I18nManager, ImageBackground, ScrollView, StyleSheet, Text, TextInput, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

export default function ToursScreen() {
  const router = useRouter()
  const { theme } = useTheme()
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const [query, setQuery] = useState("")
  const results = useMemo(() => searchTours(query, c => t(c.nameKey)), [query, t])
  const chevron = I18nManager.isRTL ? "chevron-back" : "chevron-forward"

  const open = (c: TourCity) => openExternalUrl(router, tourLink(c), "Booking.com")

  const Body = ({ c }: { c: TourCity }) => (
    <View style={styles.cardBody}>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{t(c.nameKey)}</Text>
        <Text style={styles.cardSub} numberOfLines={2}>{t(c.highlightsKey)}</Text>
      </View>
      <View style={styles.cardBtn}>
        <Text style={styles.cardBtnText}>{t("toursSee")}</Text>
        <Ionicons name={chevron} size={14} color={NAVY} />
      </View>
    </View>
  )

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />
      <OfflineBanner />
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel={t("back")}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{t("toursTitle")}</Text>
            <View style={styles.onRow}>
              <Text style={styles.subtitle}>{t("toursSub")}</Text>
              <BookingLogo height={15} />
            </View>
          </View>
        </View>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color="rgba(255,255,255,0.6)" />
          <TextInput
            placeholder={t("toursSearch")}
            placeholderTextColor="rgba(255,255,255,0.45)"
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            returnKeyType="search"
          />
          {query ? (
            <TouchableOpacity onPress={() => setQuery("")} hitSlop={10} accessibilityLabel={t("close")}>
              <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}
      >
        {results.map(c => (
          <TouchableOpacity key={c.id} activeOpacity={0.9} onPress={() => open(c)} accessibilityRole="button" style={styles.card}>
            {c.photo ? (
              <ImageBackground source={c.photo} style={styles.cardImg} imageStyle={{ borderRadius: 18 }}>
                <LinearGradient colors={["rgba(15,30,50,0.05)", "rgba(15,30,50,0.85)"]} style={styles.shade}>
                  <Body c={c} />
                </LinearGradient>
              </ImageBackground>
            ) : (
              <LinearGradient colors={[c.color, `${c.color}CC`]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cardPlain}>
                <View style={styles.plainIcon}>
                  <Ionicons name={c.icon as any} size={22} color="#fff" />
                </View>
                <Body c={c} />
              </LinearGradient>
            )}
          </TouchableOpacity>
        ))}

        {!results.length ? (
          <View style={styles.empty}>
            <Ionicons name="map-outline" size={40} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>{t("toursNone")}</Text>
          </View>
        ) : null}

        <Text style={[styles.footer, { color: theme.textSecondary }]}>{t("toursNote")}</Text>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { backgroundColor: NAVY, paddingHorizontal: 16, paddingBottom: 16 },
  headerTop: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 },
  iconBtn: { padding: 6 },
  title: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  subtitle: { color: GOLD, fontSize: 13 },
  onRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 12, paddingHorizontal: 12, height: 42, marginTop: 14 },
  searchInput: { flex: 1, color: "#fff", fontSize: 14 },
  content: { padding: ui.space, gap: 12 },
  card: { borderRadius: 18, overflow: "hidden" },
  cardImg: { height: 150, borderRadius: 18 },
  shade: { flex: 1, borderRadius: 18, padding: 14, justifyContent: "flex-end" },
  cardPlain: { borderRadius: 18, padding: 14, minHeight: 110, justifyContent: "space-between", gap: 10 },
  plainIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
  cardBody: { flexDirection: "row", alignItems: "flex-end", gap: 10 },
  cardTitle: { color: "#fff", fontSize: 19, fontWeight: "bold" },
  cardSub: { color: "#E2E8F0", fontSize: 12, marginTop: 3, lineHeight: 16 },
  cardBtn: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: GOLD, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 12 },
  cardBtnText: { color: NAVY, fontWeight: "bold", fontSize: 12 },
  empty: { alignItems: "center", gap: 8, paddingVertical: 30 },
  emptyText: { fontSize: 14, textAlign: "center" },
  footer: { fontSize: 11, textAlign: "center", marginTop: 8, lineHeight: 15 },
})
