// Home card for a running Quran goal (Premium). Takes the place of the Quran preview card.
// Shows the goal, progress, today's pages, and Continue (opens the next unread page).
import TouchableOpacity from "@/app/components/AppPressable"
import { useTheme } from "@/context/themeContext"
import { goalLabel, goalStats, type QuranGoal } from "@/lib/quranGoals"
import { goalReaderHref } from "@/lib/quranGoalNav"
import { cardShadow } from "@/lib/ui"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { StyleSheet, Text, View } from "react-native"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"

export default function QuranGoalCard({ goal, onEdit }: { goal: QuranGoal; onEdit: () => void }) {
  const router = useRouter()
  const { theme } = useTheme()
  const { t } = useTranslation()
  const s = goalStats(goal)

  const open = async () => {
    if (s.finished) return onEdit()
    router.push((await goalReaderHref(goal)) as any)
  }

  return (
    <View style={[styles.wrap, cardShadow]}>
      <LinearGradient colors={[NAVY, "#2C5282"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
        <View style={styles.top}>
          <View style={styles.flag}>
            <Ionicons name={s.finished ? "trophy" : goal.ramadan ? "moon" : "flag"} size={18} color={NAVY} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>{t("qgTitle")}</Text>
            <Text style={styles.name} numberOfLines={1}>{goalLabel(goal, t)}</Text>
          </View>
          <TouchableOpacity onPress={onEdit} hitSlop={10} accessibilityLabel={t("qgTitle")}>
            <Ionicons name="ellipsis-horizontal-circle" size={24} color={GOLD} />
          </TouchableOpacity>
        </View>

        <View style={styles.bar}>
          <View style={[styles.barFill, { width: `${Math.max(3, s.percent)}%` }]} />
        </View>
        <View style={styles.numbers}>
          <Text style={styles.percent}>{s.percent}%</Text>
          <Text style={styles.small}>
            {s.finished ? t("qgFinished") : t("qgProgress", { read: s.readCount, total: s.total, day: s.day, days: goal.days })}
          </Text>
        </View>

        {!s.finished ? (
          <View style={styles.today}>
            <Ionicons name={s.todayLeft > 0 ? "time-outline" : "checkmark-circle"} size={16} color={s.todayLeft > 0 ? "#E8D5A3" : "#7BD389"} />
            <Text style={styles.todayText}>
              {s.todayLeft > 0 ? t("qgTodayLeft", { count: s.todayLeft }) : t("qgTodayDone")}
            </Text>
          </View>
        ) : null}

        <TouchableOpacity style={styles.btn} onPress={() => void open()}>
          <Text style={styles.btnText}>{s.finished ? t("qgNew") : t("qgContinue")}</Text>
          <Ionicons name="arrow-forward" size={15} color={NAVY} />
        </TouchableOpacity>
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: 16, marginTop: 14, borderRadius: 24 },
  card: { borderRadius: 24, padding: 18, gap: 12, borderWidth: 1, borderColor: "rgba(201,168,76,0.45)" },
  top: { flexDirection: "row", alignItems: "center", gap: 12 },
  flag: { width: 38, height: 38, borderRadius: 19, backgroundColor: GOLD, alignItems: "center", justifyContent: "center" },
  kicker: { color: GOLD, fontSize: 12, fontWeight: "800", letterSpacing: 0.4 },
  name: { color: "#fff", fontSize: 18, fontWeight: "800", marginTop: 1 },
  bar: { height: 10, borderRadius: 5, backgroundColor: "rgba(255,255,255,0.15)", overflow: "hidden" },
  barFill: { height: 10, borderRadius: 5, backgroundColor: GOLD },
  numbers: { flexDirection: "row", alignItems: "baseline", gap: 10 },
  percent: { color: "#fff", fontSize: 22, fontWeight: "800" },
  small: { color: "#E8D5A3", fontSize: 13, flex: 1 },
  today: { flexDirection: "row", alignItems: "center", gap: 6 },
  todayText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  btn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: GOLD, borderRadius: 999, paddingVertical: 12 },
  btnText: { color: NAVY, fontSize: 15, fontWeight: "800" },
})
