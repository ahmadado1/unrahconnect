// "Compare prices" sheet: KAYAK prices from several sites for one hotel, for the saved trip dates.
import TouchableOpacity from "@/app/components/AppPressable"
import { useTheme } from "@/context/themeContext"
import { kayakHotelPrices, kayakSearchName, type KayakResult } from "@/lib/kayak"
import { affiliateWebViewHref } from "@/lib/openAffiliateWebView"
import type { TripDetails } from "@/lib/tripDetails"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, Image, Modal, ScrollView, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"

export default function KayakCompareSheet({
  hotel,
  trip,
  onClose,
  onNeedDates,
}: {
  hotel: { name: string; city: "Makkah" | "Madinah" } | null
  trip: TripDetails | null
  onClose: () => void
  onNeedDates: () => void
}) {
  const { theme } = useTheme()
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [result, setResult] = useState<KayakResult | null>(null)

  useEffect(() => {
    if (!hotel) return
    let alive = true
    setResult(null)
    void kayakHotelPrices(hotel.city, kayakSearchName(hotel.name), trip).then(r => alive && setResult(r))
    return () => {
      alive = false
    }
  }, [hotel, trip])

  const money = (n: number | null, currency: string) => {
    if (n == null) return ""
    try {
      return new Intl.NumberFormat(i18n.language, { style: "currency", currency, maximumFractionDigits: 0 }).format(n)
    } catch {
      return `${currency} ${Math.round(n)}`
    }
  }

  const found = result?.ok ? result.hotels.find(h => h.rates.length > 0) : undefined

  let content: React.ReactNode
  if (!result) {
    content = (
      <View style={styles.center}>
        <ActivityIndicator color={GOLD} />
        <Text style={[styles.note, { color: theme.textSecondary }]}>{t("kyLoading")}</Text>
      </View>
    )
  } else if (!result.ok && result.reason === "no_dates") {
    content = (
      <View style={styles.center}>
        <Ionicons name="calendar-outline" size={34} color={GOLD} />
        <Text style={[styles.note, { color: theme.text }]}>{t("kyNoDates")}</Text>
        <TouchableOpacity style={styles.mainBtn} onPress={onNeedDates}>
          <Text style={styles.mainBtnText}>{t("kySetDates")}</Text>
        </TouchableOpacity>
      </View>
    )
  } else if (!result.ok) {
    content = (
      <View style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={34} color={theme.textSecondary} />
        <Text style={[styles.note, { color: theme.textSecondary }]}>{t(result.reason === "busy" ? "kyBusy" : "kyError")}</Text>
      </View>
    )
  } else if (!found) {
    content = (
      <View style={styles.center}>
        <Ionicons name="search-outline" size={34} color={theme.textSecondary} />
        <Text style={[styles.note, { color: theme.textSecondary }]}>{t("kyNone")}</Text>
      </View>
    )
  } else {
    content = (
      <>
        <Text style={[styles.matched, { color: theme.textSecondary }]} numberOfLines={1}>
          {found.name}
          {found.guestRating ? `  ·  ${found.guestRating.toFixed(1)}/10` : ""}
        </Text>
        {found.rates.map((r, i) => (
          <TouchableOpacity
            key={`${r.provider}-${i}`}
            style={[styles.rate, { backgroundColor: theme.card, borderColor: i === 0 ? GOLD : theme.border }]}
            onPress={() => {
              onClose()
              router.push(affiliateWebViewHref(r.url, r.provider))
            }}
          >
            {r.logo ? <Image source={{ uri: r.logo }} style={styles.logo} resizeMode="contain" /> : null}
            <View style={{ flex: 1 }}>
              <Text style={[styles.provider, { color: theme.text }]} numberOfLines={1}>
                {r.provider}
              </Text>
              {r.room ? (
                <Text style={[styles.room, { color: theme.textSecondary }]} numberOfLines={1}>
                  {r.room}
                </Text>
              ) : null}
              <View style={styles.tags}>
                {r.freeCancel ? <Text style={styles.tag}>{t("kyFreeCancel")}</Text> : null}
                {r.payLater ? <Text style={styles.tag}>{t("kyPayLater")}</Text> : null}
              </View>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={[styles.price, { color: theme.text }]}>{money(r.total, result.currency)}</Text>
              <Text style={[styles.room, { color: theme.textSecondary }]}>{t("kyTotal")}</Text>
            </View>
          </TouchableOpacity>
        ))}
        {result.sandbox ? <Text style={[styles.note, { color: "#B45309" }]}>{t("kySandbox")}</Text> : null}
      </>
    )
  }

  return (
    <Modal visible={!!hotel} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: theme.background, paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.head}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: theme.text }]}>{t("kyTitle")}</Text>
              <Text style={[styles.room, { color: theme.textSecondary }]} numberOfLines={1}>
                {hotel?.name}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ paddingBottom: 8 }}>{content}</ScrollView>
          <Text style={[styles.powered, { color: theme.textSecondary }]}>{t("kyPowered")}</Text>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingTop: 16, maxHeight: "85%" },
  head: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  title: { fontSize: 18, fontWeight: "800" },
  center: { alignItems: "center", paddingVertical: 28, gap: 10 },
  note: { fontSize: 13, textAlign: "center", lineHeight: 19, marginTop: 6 },
  matched: { fontSize: 12, marginBottom: 6 },
  rate: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 14, padding: 12, marginTop: 8 },
  logo: { width: 44, height: 22 },
  provider: { fontSize: 14, fontWeight: "800" },
  room: { fontSize: 12, marginTop: 1 },
  tags: { flexDirection: "row", gap: 6, marginTop: 4 },
  tag: { fontSize: 10, fontWeight: "700", color: "#15803D", backgroundColor: "rgba(21,128,61,0.12)", borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2, overflow: "hidden" },
  price: { fontSize: 16, fontWeight: "800" },
  mainBtn: { backgroundColor: GOLD, borderRadius: 14, paddingHorizontal: 22, paddingVertical: 12, marginTop: 6 },
  mainBtnText: { color: NAVY, fontWeight: "800" },
  powered: { fontSize: 11, textAlign: "center", marginTop: 8 },
})
