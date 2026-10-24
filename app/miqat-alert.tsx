import { markFeatureSeen } from "@/lib/premiumNew"
// Miqat alert screen (Premium). Choose how you travel, enter the time, and get reminders:
// get ready in Ihram, the Miqat is close, and "make your intention now" with the Talbiyah.
import PremiumUpsellCard from "@/app/components/PremiumUpsellCard"
import TouchableOpacity from "@/app/components/AppPressable"
import { useTheme } from "@/context/themeContext"
import { loadMiqatTrip, miqatPlan, saveMiqatTrip, type MiqatTrip } from "@/lib/miqatAlert"
import { usePremium } from "@/lib/premium"
import DateTimePicker from "@/app/components/ThemedDateTimePicker"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"

const TALBIYAH =
  "لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيكَ لَكَ"
const NIYYAH = "لَبَّيْكَ عُمْرَةً"

/** The times are entered in Saudi time (UTC+3, no summer time), like on the plane ticket. */
const SAUDI_OFFSET_MS = 3 * 60 * 60 * 1000
/** Picker date (its clock numbers = Saudi time) → real moment. */
function saudiToMoment(d: Date) {
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()) - SAUDI_OFFSET_MS
}
/** Real moment → picker date showing the Saudi clock numbers. */
function momentToSaudi(ts: number) {
  const u = new Date(ts + SAUDI_OFFSET_MS)
  return new Date(u.getUTCFullYear(), u.getUTCMonth(), u.getUTCDate(), u.getUTCHours(), u.getUTCMinutes())
}

const MIQATS: { key: string; place: string }[] = [
  { key: "mqDhulHulayfah", place: "mqDhulHulayfahPlace" },
  { key: "mqJuhfah", place: "mqJuhfahPlace" },
  { key: "mqQarn", place: "mqQarnPlace" },
  { key: "mqYalamlam", place: "mqYalamlamPlace" },
  { key: "mqDhatIrq", place: "mqDhatIrqPlace" },
]

export default function MiqatAlertScreen() {
  // Opened: stop the "New" glow of this Premium feature.
  useEffect(() => {
    void markFeatureSeen("miqat")
  }, [])
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { theme } = useTheme()
  const { t, i18n } = useTranslation()
  const { isPremium } = usePremium()
  const [mode, setMode] = useState<"plane" | "madinah">("plane")
  const [when, setWhen] = useState(() => new Date(Date.now() + 24 * 60 * 60 * 1000))
  const [saved, setSaved] = useState<MiqatTrip | null>(null)
  const [picker, setPicker] = useState<"date" | "time" | null>(null)

  useEffect(() => {
    void loadMiqatTrip().then(trip => {
      setSaved(trip)
      if (trip) {
        setMode(trip.mode)
        setWhen(momentToSaudi(trip.mode === "plane" ? trip.landingAt : trip.departAt))
      }
    })
  }, [])

  // Shown in Saudi time, like the time the user entered.
  const fmt = (ts: number) => {
    const d = momentToSaudi(ts)
    return d.toLocaleString(i18n.language, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
  }
  const moment = saudiToMoment(when)

  const save = async () => {
    const trip: MiqatTrip = mode === "plane" ? { mode, landingAt: moment } : { mode, departAt: moment }
    const n = await saveMiqatTrip(trip)
    setSaved(trip)
    Alert.alert(t("mqSavedTitle"), n > 0 ? t("mqSavedBody", { count: n }) : t("mqSavedNone"))
  }

  const remove = async () => {
    await saveMiqatTrip(null)
    setSaved(null)
  }

  const plan = miqatPlan(mode === "plane" ? { mode, landingAt: moment } : { mode, departAt: moment })

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{t("mqTitle")}</Text>
          <Text style={styles.subtitle}>{t("mqSubtitle")}</Text>
        </View>
      </View>

      <ScrollView keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}>
        {!isPremium ? <PremiumUpsellCard variant="banner" /> : null}

        {/* How do you travel? */}
        <Text style={[styles.section, { color: theme.text }]}>{t("mqHow")}</Text>
        <View style={styles.modes}>
          {(["plane", "madinah"] as const).map(m => (
            <TouchableOpacity
              key={m}
              style={[styles.mode, { backgroundColor: theme.card, borderColor: mode === m ? GOLD : theme.border }]}
              onPress={() => setMode(m)}
            >
              <Ionicons name={m === "plane" ? "airplane" : "bus"} size={22} color={GOLD} />
              <Text style={[styles.modeTitle, { color: theme.text }]}>{t(m === "plane" ? "mqPlane" : "mqMadinah")}</Text>
              <Text style={[styles.modeSub, { color: theme.textSecondary }]}>{t(m === "plane" ? "mqPlaneSub" : "mqMadinahSub")}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* When? */}
        <Text style={[styles.section, { color: theme.text }]}>{t(mode === "plane" ? "mqLandingTime" : "mqDepartTime")}</Text>
        <View style={styles.row}>
          <TouchableOpacity style={[styles.pickBtn, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => setPicker("date")}>
            <Ionicons name="calendar-outline" size={18} color={GOLD} />
            <Text style={[styles.pickText, { color: theme.text }]}>{when.toLocaleDateString(i18n.language, { day: "numeric", month: "short", year: "numeric" })}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.pickBtn, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => setPicker("time")}>
            <Ionicons name="time-outline" size={18} color={GOLD} />
            <Text style={[styles.pickText, { color: theme.text }]}>{when.toLocaleTimeString(i18n.language, { hour: "2-digit", minute: "2-digit" })}</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.hint, { color: theme.textSecondary }]}>{t("mqTimeHint")}</Text>
        {picker ? (
          <DateTimePicker
            value={when}
            mode={picker}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            minimumDate={picker === "date" ? new Date() : undefined}
            onChange={(event, date) => {
              if (Platform.OS === "android") setPicker(null)
              if (event.type === "set" && date) {
                const next = new Date(when)
                if (picker === "date") next.setFullYear(date.getFullYear(), date.getMonth(), date.getDate())
                else next.setHours(date.getHours(), date.getMinutes(), 0, 0)
                setWhen(next)
              }
            }}
          />
        ) : null}
        {picker && Platform.OS === "ios" ? (
          <TouchableOpacity style={styles.doneBtn} onPress={() => setPicker(null)}>
            <Text style={styles.doneText}>{t("done")}</Text>
          </TouchableOpacity>
        ) : null}

        {/* Reminders you will get */}
        <View style={[styles.box, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={styles.boxTitle}>{t("mqYouGet")}</Text>
          {plan.map((p, i) => (
            <View key={i} style={styles.planRow}>
              <Text style={styles.planTime}>{fmt(p.at)}</Text>
              <Text style={[styles.planText, { color: theme.text }]}>{t(p.body)}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={() => void save()}>
          <Ionicons name="notifications" size={18} color={NAVY} />
          <Text style={styles.saveText}>{saved ? t("mqUpdate") : t("mqSave")}</Text>
        </TouchableOpacity>
        {saved ? (
          <TouchableOpacity style={styles.linkBtn} onPress={() => void remove()}>
            <Text style={styles.linkDanger}>{t("mqRemove")}</Text>
          </TouchableOpacity>
        ) : null}

        {/* At the Miqat */}
        <View style={[styles.box, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={styles.boxTitle}>{t("mqAtMiqat")}</Text>
          <Text style={[styles.body, { color: theme.textSecondary }]}>{t("mqAtMiqatBody")}</Text>
          <Text style={[styles.ar, { color: theme.text }]}>{NIYYAH}</Text>
          <Text style={[styles.ar, { color: theme.text }]}>{TALBIYAH}</Text>
          <Text style={[styles.body, { color: theme.textSecondary }]}>{t("mqTalbiyahMeaning")}</Text>
          <Text style={styles.source}>{t("mqTalbiyahSource")}</Text>
        </View>

        {/* The five Miqats */}
        <View style={[styles.box, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={styles.boxTitle}>{t("mqFive")}</Text>
          {MIQATS.map(m => (
            <View key={m.key} style={styles.miqatRow}>
              <Ionicons name="location" size={16} color={GOLD} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.miqatName, { color: theme.text }]}>{t(m.key)}</Text>
                <Text style={[styles.miqatPlace, { color: theme.textSecondary }]}>{t(m.place)}</Text>
              </View>
            </View>
          ))}
          <Text style={styles.source}>{t("mqFiveSource")}</Text>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { backgroundColor: NAVY, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 16, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  iconBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  title: { color: "#fff", fontSize: 22, fontWeight: "800" },
  subtitle: { color: GOLD, fontSize: 13, marginTop: 2 },
  section: { fontSize: 16, fontWeight: "800", marginTop: 18, marginBottom: 8 },
  modes: { flexDirection: "row", gap: 10 },
  mode: { flex: 1, borderWidth: 1.5, borderRadius: 16, padding: 14, gap: 4 },
  modeTitle: { fontSize: 15, fontWeight: "800" },
  modeSub: { fontSize: 12, lineHeight: 16 },
  row: { flexDirection: "row", gap: 10 },
  pickBtn: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 14, padding: 14 },
  pickText: { fontSize: 15, fontWeight: "700" },
  hint: { fontSize: 12, lineHeight: 17, marginTop: 6 },
  doneBtn: { alignSelf: "flex-end", paddingVertical: 6, paddingHorizontal: 12 },
  doneText: { color: GOLD, fontWeight: "800" },
  box: { borderWidth: 1, borderRadius: 16, padding: 14, marginTop: 14, gap: 8 },
  boxTitle: { color: GOLD, fontSize: 13, fontWeight: "800" },
  planRow: { gap: 2 },
  planTime: { color: GOLD, fontSize: 12, fontWeight: "700" },
  planText: { fontSize: 14, lineHeight: 20 },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: GOLD, borderRadius: 16, paddingVertical: 15, marginTop: 16 },
  saveText: { color: NAVY, fontSize: 16, fontWeight: "800" },
  linkBtn: { alignItems: "center", paddingVertical: 12 },
  linkDanger: { color: "#C0392B", fontWeight: "700" },
  body: { fontSize: 14, lineHeight: 20 },
  ar: { fontSize: 21, lineHeight: 38, textAlign: "right", writingDirection: "rtl" },
  source: { color: GOLD, fontSize: 11, fontWeight: "600" },
  miqatRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  miqatName: { fontSize: 15, fontWeight: "700" },
  miqatPlace: { fontSize: 13, lineHeight: 18 },
})
