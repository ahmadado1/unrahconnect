// The "Getting started" guide screen: what to do first, how to plan the trip,
// and what to use in Makkah and Madinah. It does not replace the AI guide —
// it just points to the right screens, one step at a time.
import TouchableOpacity from "@/app/components/AppPressable"
import { useTheme } from "@/context/themeContext"
import { GUIDE_SECTIONS, GUIDE_STEP_COUNT, loadGuideDone, markGuideStepDone, type GuideStep } from "@/lib/startGuide"
import { Ionicons } from "@expo/vector-icons"
import { useFocusEffect, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { ScrollView, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"
const GREEN = "#2F855A"

export default function StartGuideScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { theme } = useTheme()
  const { t } = useTranslation()
  const [done, setDone] = useState<Set<string>>(new Set())

  // Reload ticks each time the screen opens (after visiting a step).
  useFocusEffect(
    useCallback(() => {
      let active = true
      loadGuideDone().then(saved => {
        if (active) setDone(saved)
      })
      return () => {
        active = false
      }
    }, [])
  )

  // The first step that is not done yet gets the gold "Next" highlight.
  const allSteps = GUIDE_SECTIONS.flatMap(section => section.steps)
  const nextId = allSteps.find(step => !done.has(step.id))?.id
  const doneCount = allSteps.filter(step => done.has(step.id)).length
  const percent = Math.round((doneCount / GUIDE_STEP_COUNT) * 100)

  const open = async (step: GuideStep) => {
    setDone(await markGuideStepDone(step.id))
    router.push(step.route as any)
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />

      {/* ─── Header with progress ─────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("sgTitle")}</Text>
          <View style={{ width: 34 }} />
        </View>
        <Text style={styles.headerSub}>{t("sgLead")}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${percent}%` }]} />
        </View>
        <Text style={styles.progressText}>{t("sgProgress", { done: doneCount, total: GUIDE_STEP_COUNT })}</Text>
      </View>

      <ScrollView keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>
        {GUIDE_SECTIONS.map(section => (
          <View key={section.id} style={{ marginBottom: 20 }}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{t(`sgSection_${section.id}`)}</Text>
            <Text style={[styles.sectionSub, { color: theme.textSecondary }]}>{t(`sgSection_${section.id}_sub`)}</Text>

            {section.steps.map(step => {
              const isDone = done.has(step.id)
              const isNext = step.id === nextId
              return (
                <TouchableOpacity
                  key={step.id}
                  onPress={() => void open(step)}
                  style={[
                    styles.step,
                    { backgroundColor: theme.card, borderColor: isNext ? GOLD : theme.border },
                    isNext && styles.stepNext,
                  ]}
                >
                  <View style={[styles.stepIcon, isDone && { backgroundColor: GREEN }]}>
                    <Ionicons name={(isDone ? "checkmark" : step.icon) as any} size={18} color={isDone ? "#fff" : GOLD} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.stepHead}>
                      <Text style={[styles.stepTitle, { color: theme.text }]}>{t(`sg_${step.id}_title`)}</Text>
                      {isNext ? <Text style={styles.nextFlag}>{t("agentStepNext")}</Text> : null}
                    </View>
                    <Text style={[styles.stepBody, { color: theme.textSecondary }]}>{t(`sg_${step.id}_body`)}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={GOLD} />
                </TouchableOpacity>
              )
            })}
          </View>
        ))}

        {/* The AI guide is still there for anything else */}
        <TouchableOpacity style={styles.aiCard} onPress={() => router.push("/AIGuideScreen" as any)}>
          <Ionicons name="sparkles" size={20} color={NAVY} />
          <Text style={styles.aiText}>{t("sgAskAi")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { backgroundColor: NAVY, paddingHorizontal: 20, paddingBottom: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, padding: 6 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  headerSub: { color: "#D7DEEA", fontSize: 13, lineHeight: 19, marginTop: 12 },
  progressTrack: { height: 8, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.15)", marginTop: 14, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 999, backgroundColor: GOLD },
  progressText: { color: GOLD, fontSize: 12, fontWeight: "700", marginTop: 6 },
  content: { padding: 16 },
  sectionTitle: { fontSize: 17, fontWeight: "bold" },
  sectionSub: { fontSize: 12, marginTop: 2, marginBottom: 10 },
  step: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 16, borderWidth: 0.5, marginBottom: 10 },
  stepNext: { borderWidth: 1.5 },
  stepIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: NAVY, alignItems: "center", justifyContent: "center" },
  stepHead: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  stepTitle: { fontSize: 15, fontWeight: "600" },
  stepBody: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  nextFlag: { fontSize: 10, fontWeight: "700", color: "#8A6D1F", backgroundColor: "#F3EAD2", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, overflow: "hidden" },
  aiCard: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: GOLD, borderRadius: 16, padding: 16 },
  aiText: { color: NAVY, fontWeight: "bold", fontSize: 14, flex: 1 },
})
