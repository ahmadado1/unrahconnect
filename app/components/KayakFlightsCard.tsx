// Live flight prices from KAYAK, for the saved trip (home airport, dates, travellers).
// Pilgrims choose where they land (Jeddah or Madinah) and where they fly home from.
import TouchableOpacity from "@/app/components/AppPressable"
import { useTheme } from "@/context/themeContext"
import { kayakFlights, type KayakFlight, type KayakFlightsResult } from "@/lib/kayak"
import { affiliateWebViewHref } from "@/lib/openAffiliateWebView"
import type { TripDetails } from "@/lib/tripDetails"
import { GOLD, NAVY } from "@/lib/ui"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, StyleSheet, Text, View } from "react-native"

type Airport = "JED" | "MED"

export default function KayakFlightsCard({ trip, onNeedTrip }: { trip: TripDetails | null; onNeedTrip: () => void }) {
  const { theme } = useTheme()
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const [arriveAt, setArriveAt] = useState<Airport>("JED")
  const [returnFrom, setReturnFrom] = useState<Airport>("JED")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<KayakFlightsResult | null>(null)
  const [showAll, setShowAll] = useState(false)

  // A new trip or a new choice of airports clears old results.
  useEffect(() => {
    setResult(null)
    setShowAll(false)
  }, [trip, arriveAt, returnFrom])

  const search = async () => {
    if (!trip?.originCode || !trip.checkIn || !trip.checkOut) {
      onNeedTrip()
      return
    }
    setLoading(true)
    setShowAll(false)
    const r = await kayakFlights(trip, arriveAt, returnFrom)
    setResult(r)
    setLoading(false)
  }

  const money = (n: number | null, currency: string) => {
    if (n == null) return ""
    try {
      return new Intl.NumberFormat(i18n.language, { style: "currency", currency, maximumFractionDigits: 0 }).format(n)
    } catch {
      return `${currency} ${Math.round(n)}`
    }
  }
  const clock = (iso: string) => iso.slice(11, 16)
  const day = (iso: string) => {
    try {
      return new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString(i18n.language, { day: "numeric", month: "short" })
    } catch {
      return iso.slice(0, 10)
    }
  }
  const hours = (m: number) => t("kfDuration", { h: Math.floor(m / 60), m: m % 60 })

  const Pick = ({ value, onChange, label }: { value: Airport; onChange: (a: Airport) => void; label: string }) => (
    <View style={{ flex: 1 }}>
      <Text style={[styles.pickLabel, { color: theme.textSecondary }]}>{label}</Text>
      <View style={[styles.pick, { borderColor: theme.border }]}>
        {(["JED", "MED"] as Airport[]).map(a => (
          <TouchableOpacity key={a} style={[styles.pickItem, value === a && styles.pickOn]} onPress={() => onChange(a)}>
            <Text style={[styles.pickText, { color: value === a ? NAVY : theme.text }]}>{t(a === "JED" ? "kfJeddah" : "kfMadinah")}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )

  const FlightRow = ({ f, currency }: { f: KayakFlight; currency: string }) => (
    <TouchableOpacity
      style={[styles.flight, { backgroundColor: theme.background, borderColor: theme.border }]}
      onPress={() => router.push(affiliateWebViewHref(f.url, f.provider || "KAYAK"))}
    >
      <View style={{ flex: 1, gap: 6 }}>
        {f.legs.map((l, i) => (
          <View key={i}>
            <Text style={[styles.legMain, { color: theme.text }]}>
              {day(l.departure)} · {clock(l.departure)} {l.from} → {clock(l.arrival)} {l.to}
            </Text>
            <Text style={[styles.legSub, { color: theme.textSecondary }]} numberOfLines={1}>
              {l.airlines.map(a => a.name).join(", ")} · {hours(l.minutes)} ·{" "}
              {l.stops === 0 ? t("kfDirect") : t("kfStops", { count: l.stops })}
            </Text>
          </View>
        ))}
      </View>
      <View style={{ alignItems: "flex-end", justifyContent: "center", marginLeft: 8 }}>
        <Text style={[styles.price, { color: theme.text }]}>{money(f.price, currency)}</Text>
        <Text style={[styles.legSub, { color: theme.textSecondary }]}>{t("kfTotalAll")}</Text>
        <Text style={styles.view}>{t("kfView")}</Text>
      </View>
    </TouchableOpacity>
  )

  let body: React.ReactNode = null
  if (loading) {
    body = (
      <View style={styles.center}>
        <ActivityIndicator color={GOLD} />
        <Text style={[styles.note, { color: theme.textSecondary }]}>{t("kfSearching")}</Text>
      </View>
    )
  } else if (result && !result.ok) {
    body = (
      <Text style={[styles.note, { color: theme.textSecondary }]}>
        {t(result.reason === "busy" ? "kyBusy" : result.reason === "no_trip" ? "kfNoTrip" : "kyError")}
      </Text>
    )
  } else if (result?.ok && result.flights.length === 0) {
    body = <Text style={[styles.note, { color: theme.textSecondary }]}>{t("kfNone")}</Text>
  } else if (result?.ok) {
    const list = showAll ? result.flights : result.flights.slice(0, 5)
    body = (
      <>
        {list.map(f => (
          <FlightRow key={f.id} f={f} currency={result.currency} />
        ))}
        {!showAll && result.flights.length > 5 ? (
          <TouchableOpacity onPress={() => setShowAll(true)} style={styles.more}>
            <Text style={styles.moreText}>{t("kfShowMore", { count: result.flights.length - 5 })}</Text>
          </TouchableOpacity>
        ) : null}
        {result.sandbox ? <Text style={[styles.note, { color: "#B45309" }]}>{t("kySandbox")}</Text> : null}
      </>
    )
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.head}>
        <Ionicons name="airplane" size={18} color={GOLD} />
        <Text style={[styles.title, { color: theme.text }]}>{t("kfTitle")}</Text>
      </View>
      <Text style={[styles.legSub, { color: theme.textSecondary }]}>
        {trip?.originCode && trip.checkIn
          ? t("kfFor", { from: trip.originCode, out: day(trip.checkIn), back: day(trip.checkOut), count: trip.guests })
          : t("kfNoTrip")}
      </Text>
      <View style={styles.picks}>
        <Pick value={arriveAt} onChange={setArriveAt} label={t("kfLandIn")} />
        <Pick value={returnFrom} onChange={setReturnFrom} label={t("kfFlyHomeFrom")} />
      </View>
      <TouchableOpacity style={styles.searchBtn} onPress={() => void search()} disabled={loading}>
        <Text style={styles.searchText}>{trip?.originCode && trip.checkIn ? t("kfSearch") : t("kySetDates")}</Text>
      </TouchableOpacity>
      {body}
      <Text style={[styles.powered, { color: theme.textSecondary }]}>{t("kfPowered")}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { borderWidth: 0.5, borderRadius: 18, padding: 14, gap: 8 },
  head: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 16, fontWeight: "800" },
  picks: { flexDirection: "row", gap: 10, marginTop: 4 },
  pickLabel: { fontSize: 11, fontWeight: "700", marginBottom: 4 },
  pick: { flexDirection: "row", borderWidth: 1, borderRadius: 12, overflow: "hidden" },
  pickItem: { flex: 1, paddingVertical: 8, alignItems: "center" },
  pickOn: { backgroundColor: GOLD },
  pickText: { fontSize: 12, fontWeight: "800" },
  searchBtn: { backgroundColor: GOLD, borderRadius: 14, paddingVertical: 12, alignItems: "center", marginTop: 4 },
  searchText: { color: NAVY, fontWeight: "800", fontSize: 14 },
  center: { alignItems: "center", paddingVertical: 16, gap: 8 },
  note: { fontSize: 12, textAlign: "center", lineHeight: 18, marginTop: 4 },
  flight: { flexDirection: "row", borderWidth: 1, borderRadius: 14, padding: 12 },
  legMain: { fontSize: 13, fontWeight: "700" },
  legSub: { fontSize: 11, marginTop: 1 },
  price: { fontSize: 17, fontWeight: "800" },
  view: { color: GOLD, fontSize: 11, fontWeight: "800", marginTop: 4 },
  more: { alignItems: "center", paddingVertical: 8 },
  moreText: { color: GOLD, fontWeight: "800", fontSize: 13 },
  powered: { fontSize: 10, textAlign: "center", marginTop: 2 },
})
