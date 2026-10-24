// Quran reading goals (Premium): this surah, this juz, the whole Quran, or the Ramadan khatm.
// Shows ALL goals (several can run at once), each with its progress, Continue and End,
// plus "New goal". With no goal yet it opens straight on the "new goal" choices.
import TouchableOpacity from "@/app/components/AppPressable"
import { useTheme } from "@/context/themeContext"
import { gregorianToHijri } from "@/lib/hijriDate"
import { juzForPage } from "@/lib/mushafJuz"
import { scheduleQuranGoalReminders } from "@/lib/notifications"
import { usePremium } from "@/lib/premium"
import { showPremiumPrompt } from "@/lib/premiumPrompt"
import PremiumPromptHost from "@/app/components/PremiumPromptHost"
import {
  endGoal,
  goalLabel,
  goalPlanLine,
  goalStats,
  goalStatusLine,
  loadGoals,
  MAX_GOALS,
  startGoal,
  type DailyTime,
  type GoalKind,
  type QuranGoal,
} from "@/lib/quranGoals"
import { goalReaderHref } from "@/lib/quranGoalNav"
import { useRouter } from "expo-router"
import { getSurahMeta } from "@/lib/quranSurahMeta"
import { Ionicons } from "@expo/vector-icons"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"

type Choice = {
  kind: GoalKind
  target?: number
  ramadan?: boolean
  /** Chips: number of days to finish it. 0 = "Every day" (a daily goal). */
  days: number[]
  /** Daily surah card: the chips are these surahs instead of days. */
  dailySurahs?: number[]
  title: string
  sub: string
  icon: keyof typeof Ionicons.glyphMap
}

/**
 * Surahs many people choose to read every day (the "A surah every day" card):
 * Yasin, Ar-Rahman, Al-Waqi'ah, As-Sajdah.
 * Al-Kahf (Friday) and Al-Mulk (every night) are NOT here: the app already has their own routine.
 */
const DAILY_SURAHS = [36, 55, 56, 32]
/** Surahs with their own routine in the app: no "Every day" chip for them. */
const ROUTINE_SURAHS = new Set([18, 67])
/** Days chip value meaning "every day". */
const EVERY_DAY = 0

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
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { isPremium } = usePremium()
  const [goals, setGoals] = useState<QuranGoal[]>([])
  const [making, setMaking] = useState(false)
  const [picked, setPicked] = useState<{ index: number; days: number; target?: number } | null>(null)
  // Daily goals: remind in the morning or the evening.
  const [dailyTime, setDailyTime] = useState<DailyTime>("morning")

  useEffect(() => {
    if (!visible) return
    setPicked(null)
    void loadGoals().then(list => {
      setGoals(list)
      setMaking(list.length === 0)
    })
  }, [visible])

  const running = goals.filter(g => !g.completedAt)
  const full = running.length >= MAX_GOALS

  const ramadan = ramadanDaysLeft()
  const juz = page ? juzForPage(page) : undefined
  const surahName = surah ? getSurahMeta(surah)?.englishName : undefined

  const choices: Choice[] = [
    ...(ramadan
      ? [{ kind: "khatm" as const, ramadan: true, days: [ramadan], title: t("qgRamadanKhatm"), sub: t("qgRamadanSub", { count: ramadan }), icon: "moon" as const }]
      : []),
    ...(surah && surahName
      ? [{
          kind: "surah" as const,
          target: surah,
          days: ROUTINE_SURAHS.has(surah) ? [1, 3, 7] : [1, 3, 7, EVERY_DAY],
          title: t("qgThisSurah", { name: surahName }),
          sub: t("qgSurahSub"),
          icon: "book" as const,
        }]
      : []),
    { kind: "surah", days: [EVERY_DAY], dailySurahs: DAILY_SURAHS, title: t("qgDailyTitle"), sub: t("qgDailySub"), icon: "repeat" },
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
    const daily = picked.days === EVERY_DAY
    const g = await startGoal({
      kind: c.kind,
      target: picked.target ?? c.target,
      days: daily ? 1 : picked.days,
      ramadan: c.ramadan,
      dailyTime: daily ? dailyTime : undefined,
    })
    void scheduleQuranGoalReminders()
    setGoals(await loadGoals())
    setMaking(false)
    onStarted?.(g)
    onClose()
  }

  const continueGoal = async (goal: QuranGoal) => {
    const href = await goalReaderHref(goal)
    onClose()
    setTimeout(() => router.push(href as any), 250)
  }

  const confirmEnd = (goal: QuranGoal) =>
    Alert.alert(t("qgEndTitle"), t("qgEndBody"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("qgEnd"),
        style: "destructive",
        onPress: () => {
          void endGoal(goal.id).then(async () => {
            void scheduleQuranGoalReminders()
            const list = await loadGoals()
            setGoals(list)
            if (!list.length) setMaking(true)
          })
        },
      },
    ])

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: theme.background, paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.handle} />
        <View style={styles.head}>
          <Ionicons name="flag" size={20} color={GOLD} />
          <Text style={[styles.title, { color: theme.text }]}>{goals.length > 1 && !making ? t("qgMyGoals") : t("qgTitle")}</Text>
          {!isPremium ? <Text style={styles.premiumChip}>★ {t("premiumBadge")}</Text> : null}
          <TouchableOpacity onPress={onClose} style={styles.close} accessibilityLabel={t("close")}>
            <Ionicons name="close" size={20} color={NAVY} />
          </TouchableOpacity>
        </View>

        <ScrollView keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled" style={{ maxHeight: 540 }} contentContainerStyle={{ paddingBottom: 6 }}>
          {goals.length && !making ? (
            /* ─── All goals ─── */
            <>
              {goals.map(goal => {
                const s = goalStats(goal)
                const warn = s.overdue || s.behind
                return (
                  <View
                    key={goal.id}
                    style={[styles.current, { backgroundColor: theme.card, borderColor: warn ? "#F6AD55" : theme.border }]}
                  >
                    <View style={styles.goalHead}>
                      <Ionicons name={s.finished ? "trophy" : goal.daily ? "repeat" : goal.ramadan ? "moon" : "flag"} size={16} color={GOLD} />
                      <Text style={[styles.currentName, { color: theme.text }]} numberOfLines={1}>{goalLabel(goal, t)}</Text>
                      <Text style={[styles.percent, { color: GOLD }]}>{s.percent}%</Text>
                      {/* Delete this goal */}
                      <TouchableOpacity
                        onPress={() => confirmEnd(goal)}
                        hitSlop={10}
                        style={styles.trash}
                        accessibilityLabel={t("qgEnd")}
                      >
                        <Ionicons name="trash-outline" size={18} color="#C0392B" />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.bar}>
                      <View style={[styles.barFill, { width: `${Math.max(3, s.percent)}%` }]} />
                    </View>
                    {!s.finished ? (
                      <Text style={[styles.muted, { color: theme.textSecondary }]}>{goalPlanLine(goal, t)}</Text>
                    ) : null}
                    <View style={styles.statusRow}>
                      <Ionicons
                        name={s.finished ? "checkmark-circle" : warn ? "alert-circle" : s.todayLeft > 0 ? "time-outline" : "checkmark-circle"}
                        size={15}
                        color={s.finished || (!warn && s.todayLeft <= 0) ? "#38A169" : warn ? "#DD6B20" : GOLD}
                      />
                      <Text style={[styles.muted, { color: warn ? "#DD6B20" : theme.textSecondary, flex: 1 }]}>{goalStatusLine(goal, t)}</Text>
                    </View>
                    {!s.finished ? (
                      <View style={styles.row}>
                        <TouchableOpacity style={styles.continueBtn} onPress={() => void continueGoal(goal)}>
                          <Text style={styles.continueText}>{t("qgContinue")}</Text>
                          <Ionicons name="arrow-forward" size={14} color={NAVY} />
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </View>
                )
              })}
              {running.length ? (
                <View style={styles.remindRow}>
                  <Ionicons name="notifications-outline" size={14} color={GOLD} />
                  <Text style={[styles.muted, { color: theme.textSecondary, flex: 1 }]}>{t("qgRemindNote")}</Text>
                </View>
              ) : null}
              {full ? (
                <Text style={[styles.muted, { color: theme.textSecondary, textAlign: "center", marginTop: 10 }]}>
                  {t("qgFull", { count: MAX_GOALS })}
                </Text>
              ) : (
                <TouchableOpacity style={styles.addBtn} onPress={() => setMaking(true)}>
                  <Ionicons name="add-circle" size={18} color={NAVY} />
                  <Text style={styles.startText}>{t("qgAddGoal")}</Text>
                </TouchableOpacity>
              )}
            </>
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
                      {c.dailySurahs
                        ? /* A surah every day: pick the surah */
                          c.dailySurahs.map(n => {
                            const chipOn = on && picked?.target === n
                            return (
                              <TouchableOpacity
                                key={n}
                                onPress={() => setPicked({ index, days: EVERY_DAY, target: n })}
                                style={[styles.chip, chipOn && styles.chipOn]}
                              >
                                <Text style={[styles.chipText, { color: chipOn ? NAVY : theme.text }]}>
                                  {getSurahMeta(n)?.englishName ?? n}
                                </Text>
                              </TouchableOpacity>
                            )
                          })
                        : /* Finish in N days, or every day */
                          c.days.map(d => {
                            const chipOn = on && picked?.days === d
                            return (
                              <TouchableOpacity
                                key={d}
                                onPress={() => setPicked({ index, days: d })}
                                style={[styles.chip, chipOn && styles.chipOn, d === EVERY_DAY && styles.chipDaily]}
                              >
                                {d === EVERY_DAY ? <Ionicons name="repeat" size={13} color={chipOn ? NAVY : GOLD} /> : null}
                                <Text style={[styles.chipText, { color: chipOn ? NAVY : theme.text }]}>
                                  {d === EVERY_DAY ? t("qgEveryDay") : d === 1 ? t("qgToday") : t("qgDays", { count: d })}
                                </Text>
                              </TouchableOpacity>
                            )
                          })}
                    </View>
                    {/* Daily goal picked on this card: morning or evening reminder */}
                    {on && picked?.days === EVERY_DAY ? (
                      <View style={styles.timeRow}>
                        <Text style={[styles.choiceSub, { color: theme.textSecondary }]}>{t("qgWhen")}</Text>
                        <View style={styles.chips}>
                          {(["morning", "evening"] as const).map(time => {
                            const timeOn = dailyTime === time
                            return (
                              <TouchableOpacity
                                key={time}
                                onPress={() => setDailyTime(time)}
                                style={[styles.chip, timeOn && styles.chipOn]}
                              >
                                <Ionicons name={time === "morning" ? "sunny-outline" : "moon-outline"} size={13} color={timeOn ? NAVY : GOLD} />
                                <Text style={[styles.chipText, { color: timeOn ? NAVY : theme.text }]}>
                                  {time === "morning" ? t("qgMorning") : t("qgEvening")}
                                </Text>
                              </TouchableOpacity>
                            )
                          })}
                        </View>
                      </View>
                    ) : null}
                  </View>
                )
              })}
              <TouchableOpacity style={[styles.startBtn, !picked && { opacity: 0.5 }]} disabled={!picked} onPress={() => void start()}>
                <Text style={styles.startText}>{t("qgStart")}</Text>
              </TouchableOpacity>
              {goals.length ? (
                <TouchableOpacity style={styles.linkBtn} onPress={() => setMaking(false)}>
                  <Text style={styles.link}>{t("qgBack")}</Text>
                </TouchableOpacity>
              ) : null}
            </>
          )}
        </ScrollView>
      </View>
      {/* Premium card shows on top of this pop-up */}
      <PremiumPromptHost overlay />
    </Modal>
  )
}

const styles = StyleSheet.create({
  remindRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
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
  chip: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1.2, borderColor: GOLD, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
  chipDaily: { borderStyle: "dashed" },
  timeRow: { marginTop: 12, gap: 2 },
  chipOn: { backgroundColor: GOLD },
  chipText: { fontSize: 13, fontWeight: "700" },
  startBtn: { backgroundColor: GOLD, borderRadius: 16, paddingVertical: 15, alignItems: "center", marginTop: 6 },
  startText: { color: NAVY, fontSize: 16, fontWeight: "800" },
  current: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 8, marginBottom: 10 },
  currentName: { flex: 1, fontSize: 16, fontWeight: "800" },
  goalHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  percent: { fontSize: 15, fontWeight: "800" },
  trash: { padding: 4, marginStart: 2 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  continueBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: GOLD, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9 },
  continueText: { color: NAVY, fontWeight: "800" },
  addBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: GOLD, borderRadius: 16, paddingVertical: 14, marginTop: 8 },
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
