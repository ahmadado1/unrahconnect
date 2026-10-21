// Set a Quran reading goal (Premium): this surah, this juz, the whole Quran, or the Ramadan khatm.
// When a goal is running it shows the progress, with "New goal" and "End goal".
import TouchableOpacity from "@/app/components/AppPressable"
import { useTheme } from "@/context/themeContext"
import { gregorianToHijri } from "@/lib/hijriDate"
import { juzForPage } from "@/lib/mushafJuz"
import { scheduleQuranGoalReminders } from "@/lib/notifications"
import { usePremium } from "@/lib/premium"
import { showPremiumPrompt } from "@/lib/premiumPrompt"
import { endGoal, goalLabel, goalStats, loadGoal, startGoal, type GoalKind, type QuranGoal } from "@/lib/quranGoals"
import { getSurahMeta } from "@/lib/quranSurahMeta"
import { Ionicons } from "@expo/vector-icons"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"

type Choice = { kind: GoalKind; target?: number; ramadan?: boolean; days: number[]; title: string; sub: string; icon: keyof typeof Ionicons.glyphMap }

type Props = {
  visible: boolean
  onClose: () => void
  /** Surah open in the reader (offers "finish this surah") */
  surah?: number
  /** Page open in the reader (offers "finish this juz") */
  page?: number
  onStarted?: (goal: QuranGoal) => void
}

/** Days left in Ramadan (counting today), or null outside Ramadan / the last days of Sha'ban. */
function ramadanDaysLeft(now = new Date()): number | null {
  const h = gregorianToHijri(now)
  if (h.month === 9) return Math.max(1, 30 - h.day + 1)
  if (h.month === 8 && h.day >= 25) return 30
  return null
}

export default function QuranGoalSheet({ visible, onClose, surah, page, onStarted }: Props) {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const { isPremium } = usePremium()
  const [goal, setGoal] = useState<QuranGoal | null>(null)
  const [making, setMaking] = useState(false)
  const [picked, setPicked] = useState<{ index: number; days: number } | null>(null)

  useEffect(() => {
    if (!visible) return
    setPicked(null)
    void loadGoal().then(g => {
      setGoal(g)
      setMaking(!g)
    })
  }, [visible])

  const ramadan = ramadanDaysLeft()
  const juz = page ? juzForPage(page) : undefined
  const surahName = surah ? getSurahMeta(surah)?.englishName : undefined

  const choices: Choice[] = [
    ...(ramadan
      ? [{ kind: "khatm" as const, ramadan: true, days: [ramadan], title: t("qgRamadanKhatm"), sub: t("qgRamadanSub", { count: ramadan }), icon: "moon" as const }]
      : []),
    ...(surah && surahName
      ? [{ kind: "surah" as const, target: surah, days: [1, 3, 7], title: t("qgThisSurah", { name: surahName }), sub: t("qgSurahSub"), icon: "book" as const }]
      : []),
    ...(juz ? [{ kind: "juz" as const, target: juz, days: [1, 3, 7], title: t("qgThisJuz", { number: juz }), sub: t("qgJuzSub"), icon: "layers" as const }] : []),
    { kind: "khatm", days: [7, 15, 30, 60], title: t("qgWholeQuran"), sub: t("qgKhatmSub"), icon: "ribbon" },
  ]

  const start = async () => {
    if (!picked) return
    if (!isPremium) {
      showPremiumPrompt(onClose)
      return
    }
    const c = choices[picked.index]
    const g = await startGoal({ kind: c.kind, target: c.target, days: picked.days, ramadan: c.ramadan })
    void scheduleQuranGoalReminders()
    setGoal(g)
    setMaking(false)
    onStarted?.(g)
    onClose()
  }

  const confirmEnd = () =>
    Alert.alert(t("qgEndTitle"), t("qgEndBody"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("qgEnd"),
        style: "destructive",
        onPress: () => {
          void endGoal().then(() => {
            void scheduleQuranGoalReminders()
            setGoal(null)
            setMaking(true)
          })
        },
      },
    ])

  const stats = goal ? goalStats(goal) : null

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: theme.background, paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.handle} />
        <View style={styles.head}>
          <Ionicons name="flag" size={20} color={GOLD} />
          <Text style={[styles.title, { color: theme.text }]}>{t("qgTitle")}</Text>
          {!isPremium ? <Text style={styles.premiumChip}>★ {t("premiumBadge")}</Text> : null}
          <TouchableOpacity onPress={onClose} style={styles.close} accessibilityLabel={t("close")}>
            <Ionicons name="close" size={20} color={NAVY} />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ maxHeight: 520 }} contentContainerStyle={{ paddingBottom: 6 }}>
          {goal && stats && !making ? (
            /* ─── Current goal ─── */
            <View style={[styles.current, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.currentName, { color: theme.text }]}>{goalLabel(goal, t)}</Text>
              <View style={styles.bar}>
                <View style={[styles.barFill, { width: `${Math.max(3, stats.percent)}%` }]} />
              </View>
              <Text style={[styles.muted, { color: theme.textSecondary }]}>
                {stats.finished
                  ? t("qgFinished")
                  : t("qgProgress", { read: stats.readCount, total: stats.total, day: stats.day, days: goal.days })}
              </Text>
              {!stats.finished ? (
                <Text style={[styles.muted, { color: theme.textSecondary }]}>
                  {stats.todayLeft > 0 ? t("qgTodayLeft", { count: stats.todayLeft }) : t("qgTodayDone")}
                </Text>
              ) : null}
              <View style={styles.row}>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => setMaking(true)}>
                  <Text style={styles.secondaryText}>{t("qgNew")}</Text>
                </TouchableOpacity>
                {!stats.finished ? (
                  <TouchableOpacity style={styles.linkBtn} onPress={confirmEnd}>
                    <Text style={styles.linkDanger}>{t("qgEnd")}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          ) : (
            /* ─── New goal ─── */
            <>
              <Text style={[styles.lead, { color: theme.textSecondary }]}>{t("qgLead")}</Text>
              {choices.map((c, index) => {
                const on = picked?.index === index
                return (
                  <View
                    key={`${c.kind}-${c.target ?? ""}-${c.ramadan ? "r" : ""}`}
                    style={[styles.choice, { backgroundColor: theme.card, borderColor: on ? GOLD : theme.border }, c.ramadan && styles.choiceRamadan]}
                  >
                    <View style={styles.choiceHead}>
                      <View style={styles.choiceIcon}>
                        <Ionicons name={c.icon} size={18} color={GOLD} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.choiceTitle, { color: theme.text }]}>{c.title}</Text>
                        <Text style={[styles.choiceSub, { color: theme.textSecondary }]}>{c.sub}</Text>
                      </View>
                    </View>
                    <View style={styles.chips}>
                      {c.days.map(d => {
                        const chipOn = on && picked?.days === d
                        return (
                          <TouchableOpacity
                            key={d}
                            onPress={() => setPicked({ index, days: d })}
                            style={[styles.chip, chipOn && styles.chipOn]}
                          >
                            <Text style={[styles.chipText, { color: chipOn ? NAVY : theme.text }]}>
                              {d === 1 ? t("qgToday") : t("qgDays", { count: d })}
                            </Text>
                          </TouchableOpacity>
                        )
                      })}
                    </View>
                  </View>
                )
              })}
              <TouchableOpacity style={[styles.startBtn, !picked && { opacity: 0.5 }]} disabled={!picked} onPress={() => void start()}>
                <Text style={styles.startText}>{t("qgStart")}</Text>
              </TouchableOpacity>
              {goal ? (
                <TouchableOpacity style={styles.linkBtn} onPress={() => setMaking(false)}>
                  <Text style={styles.link}>{t("qgBack")}</Text>
                </TouchableOpacity>
              ) : null}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)" },
  sheet: { borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 18, paddingTop: 8 },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(0,0,0,0.15)", marginBottom: 12 },
  head: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  title: { flex: 1, fontSize: 18, fontWeight: "800" },
  premiumChip: { backgroundColor: GOLD, color: NAVY, fontSize: 11, fontWeight: "800", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, overflow: "hidden" },
  close: { backgroundColor: "rgba(201,168,76,0.2)", borderRadius: 18, padding: 6 },
  lead: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  choice: { borderWidth: 1.5, borderRadius: 16, padding: 14, marginBottom: 10 },
  choiceRamadan: { borderStyle: "dashed" },
  choiceHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  choiceIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(201,168,76,0.15)", alignItems: "center", justifyContent: "center" },
  choiceTitle: { fontSize: 15, fontWeight: "800" },
  choiceSub: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  chip: { borderWidth: 1.2, borderColor: GOLD, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
  chipOn: { backgroundColor: GOLD },
  chipText: { fontSize: 13, fontWeight: "700" },
  startBtn: { backgroundColor: GOLD, borderRadius: 16, paddingVertical: 15, alignItems: "center", marginTop: 6 },
  startText: { color: NAVY, fontSize: 16, fontWeight: "800" },
  current: { borderWidth: 0.5, borderRadius: 16, padding: 16, gap: 8 },
  currentName: { fontSize: 17, fontWeight: "800" },
  bar: { height: 8, borderRadius: 4, backgroundColor: "rgba(201,168,76,0.18)", overflow: "hidden" },
  barFill: { height: 8, borderRadius: 4, backgroundColor: GOLD },
  muted: { fontSize: 13, lineHeight: 19 },
  row: { flexDirection: "row", alignItems: "center", gap: 16, marginTop: 6 },
  secondaryBtn: { borderWidth: 1.2, borderColor: GOLD, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 8 },
  secondaryText: { color: GOLD, fontWeight: "800" },
  linkBtn: { alignItems: "center", paddingVertical: 10 },
  link: { color: GOLD, fontWeight: "700" },
  linkDanger: { color: "#C0392B", fontWeight: "700" },
})
