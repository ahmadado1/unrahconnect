// Home: "Your trip" card. With trip dates saved, two buttons open Booking.com hotel search for
// Makkah / Madinah on exactly those dates and guests, so the prices shown are the real, live prices.
// Without dates: a quick prompt that opens the short trip form.
import BookingLogo from "@/app/components/BookingLogo"
import TouchableOpacity from "@/app/components/AppPressable"
import TripDetailsSheet, { useTripDetails } from "@/app/components/TripDetailsSheet"
import { useTheme } from "@/context/themeContext"
import { openExternalUrl } from "@/lib/openAffiliateWebView"
import { applyStayToBookingUrl } from "@/lib/stayLinks"
import { Ionicons } from "@expo/vector-icons"
import { useFocusEffect, useRouter } from "expo-router"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, Text, View } from "react-native"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"

/** Booking.com hotel search for a city through our CJ deep link (same link as the hotel cards). */
function citySearch(city: "Makkah" | "Madinah") {
  const dest = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(city === "Makkah" ? "Mecca" : "Medina")}`
  return `https://www.kqzyfj.com/click-101805153-11891539?sid=app-home-trip-${city.toLowerCase()}&url=${encodeURIComponent(dest)}`
}

export default function TripHotelsCard() {
  const router = useRouter()
  const { theme } = useTheme()
  const { t, i18n } = useTranslation()
  const { trip, open, setOpen, close, onSaved, refresh } = useTripDetails(false)

  useFocusEffect(
    useCallback(() => {
      void refresh()
    }, [refresh])
  )

  const fmt = (iso: string) =>
    new Date(`${iso}T12:00:00`).toLocaleDateString(i18n.language, { day: "numeric", month: "short" })
  const nights = trip
    ? Math.max(1, Math.round((new Date(`${trip.checkOut}T12:00:00`).getTime() - new Date(`${trip.checkIn}T12:00:00`).getTime()) / 86_400_000))
    : 0
  // Past trips: ask for the next one instead
  const active = trip && new Date(`${trip.checkOut}T23:59:00`).getTime() > Date.now() ? trip : null

  const go = (city: "Makkah" | "Madinah") =>
    openExternalUrl(router, applyStayToBookingUrl(citySearch(city), active), "Booking.com")

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {active ? (
        <>
          <View style={styles.head}>
            <View style={styles.icon}>
              <Ionicons name="calendar" size={18} color={NAVY} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: theme.text }]}>{t("thTitle")}</Text>
              <Text style={[styles.sub, { color: theme.textSecondary }]} numberOfLines={1}>
                {fmt(active.checkIn)} – {fmt(active.checkOut)} · {t("tripNights", { count: nights })} · {t("thGuests", { count: active.guests })}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setOpen(true)} hitSlop={10}>
              <Text style={styles.edit}>{t("tripEdit")}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.liveRow}>
            <Text style={[styles.live, { color: theme.textSecondary }]}>{t("thLive")}</Text>
            <BookingLogo height={15} />
          </View>
          <View style={styles.btnRow}>
            {(["Makkah", "Madinah"] as const).map(city => (
              <TouchableOpacity key={city} style={styles.btn} onPress={() => go(city)} accessibilityRole="button">
                <Text style={styles.btnText}>{t(city === "Makkah" ? "thMakkah" : "thMadinah")}</Text>
                <Ionicons name="chevron-forward" size={14} color={NAVY} />
              </TouchableOpacity>
            ))}
          </View>
        </>
      ) : (
        <TouchableOpacity style={styles.head} onPress={() => setOpen(true)} accessibilityRole="button">
          <View style={styles.icon}>
            <Ionicons name="calendar-outline" size={18} color={NAVY} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: theme.text }]}>{t("thPlanTitle")}</Text>
            <Text style={[styles.sub, { color: theme.textSecondary }]}>{t("thPlanSub")}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={GOLD} />
        </TouchableOpacity>
      )}
      <TripDetailsSheet visible={open} initial={trip} onClose={close} onSaved={onSaved} />
    </View>
  )
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginBottom: 12, borderRadius: 16, borderWidth: 0.5, padding: 14 },
  head: { flexDirection: "row", alignItems: "center", gap: 12 },
  icon: { width: 38, height: 38, borderRadius: 12, backgroundColor: GOLD, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 15, fontWeight: "700" },
  sub: { fontSize: 12, marginTop: 2 },
  edit: { color: GOLD, fontWeight: "700", fontSize: 13 },
  liveRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 },
  live: { fontSize: 12, flexShrink: 1 },
  btnRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  btn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, backgroundColor: GOLD, borderRadius: 12, paddingVertical: 10 },
  btnText: { color: NAVY, fontWeight: "700", fontSize: 13 },
})
