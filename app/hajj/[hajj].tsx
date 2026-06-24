import { useTheme } from "@/context/themeContext"
import phaseStructure from "@/app/data/phaseStructure.json"
import { resolvePhase } from "@/lib/resolvePhase"
import { getHajjProgress, markHajjPhaseComplete } from "@/lib/supabase"
import { Ionicons } from "@expo/vector-icons"
import { useLocalSearchParams, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const hajjPhases = phaseStructure.hajj
const phaseOrder = hajjPhases.map((p) => ({
  id: p.id,
  titleKey: `phase_hajj_${p.id}_title` as const,
}))

export default function HajjPhaseDetailScreen() {
  const { hajj } = useLocalSearchParams<{ hajj?: string | string[] }>()
  const phaseId = Array.isArray(hajj) ? hajj[0] : hajj
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { theme } = useTheme()
  const { t } = useTranslation()
  const rawPhase = hajjPhases.find((p) => p.id === phaseId)
  const data = useMemo(
    () => rawPhase ? resolvePhase(rawPhase, t, `phase_hajj_${rawPhase.id}_title`) : null,
    [rawPhase, t],
  )
  const currentIndex = phaseOrder.findIndex((p) => p.id === phaseId)
  const nextPhase = phaseOrder[currentIndex + 1]
  const [isCompleted, setIsCompleted] = useState(false)

  useEffect(() => {
    const checkProgress = async () => {
      const progress = await getHajjProgress()
      setIsCompleted(progress.includes(phaseId ?? ""))
    }
    checkProgress()
  }, [phaseId])

  const handleMarkComplete = async () => {
    const newState = await markHajjPhaseComplete(phaseId ?? "")
    setIsCompleted(newState ?? false)
  }

  if (!data) {
    return (
      <View style={styles.notFound}>
        <Text style={{ color: theme.text }}>{t("phaseNotFound")}</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: "#C9A84C" }}>{t("goBack")}</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" backgroundColor={data.textColor} />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: data.textColor }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={[styles.phaseNumBig, { backgroundColor: data.color }]}>
            <Text style={[styles.phaseNumText, { color: data.textColor }]}>{data.id}</Text>
          </View>
          <Text style={styles.headerTitle}>{data.title}</Text>
          <Text style={styles.headerDuration}>⏱ {data.duration}</Text>
        </View>

        <View style={styles.content}>
          <Text style={[styles.description, { color: theme.textSecondary }]}>{data.description}</Text>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("whatToDo")}</Text>
          {data.steps.map((step, index) => (
            <View key={index} style={styles.stepRow}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{index + 1}</Text>
              </View>
              <Text style={[styles.stepText, { color: theme.textSecondary }]}>{step}</Text>
            </View>
          ))}

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("duas")}</Text>
          {data.duas.map((dua, index) => (
            <View key={index} style={[styles.duaCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.duaTitle, { color: theme.textSecondary }]}>{dua.title}</Text>
              <Text style={[styles.duaArabic, { color: theme.text }]}>{dua.arabic}</Text>
              <Text style={styles.duaTranslit}>{dua.transliteration}</Text>
              <View style={[styles.duaDivider, { backgroundColor: theme.border }]} />
              <Text style={[styles.duaTranslation, { color: theme.textSecondary }]}>{dua.translation}</Text>
            </View>
          ))}

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("tips")}</Text>
          {data.tips.map((tip, index) => (
            <View key={index} style={styles.tipRow}>
              <Ionicons name="checkmark-circle" size={18} color="#C9A84C" />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[styles.tipText, { color: theme.textSecondary }]}>{tip.text}</Text>
                {tip.citation && !tip.arabic ? (
                  <Text style={{ fontSize: 11, lineHeight: 16, color: "#C9A84C", fontStyle: "italic" }}>
                    📖 {tip.citation}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
          {nextPhase ? (
            <TouchableOpacity style={styles.nextBtn} onPress={() => router.push(`/hajj/${nextPhase.id}`)}>
              <View style={styles.nextBtnContent}>
                <View>
                  <Text style={styles.nextBtnLabel}>{t("nextStep")}</Text>
                  <Text style={styles.nextBtnTitle}>{t(nextPhase.titleKey)}</Text>
                </View>
                <Ionicons name="arrow-forward-circle" size={32} color="#C9A84C" />
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.completionBox}>
              <Text style={styles.completionEmoji}>🎉</Text>
              <Text style={styles.completionTitle}>{t("hajjComplete")}</Text>
              <Text style={styles.completionText}>{t("hajjCompleteMsg")}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.completeBtn, isCompleted && styles.completeBtnDone]}
          onPress={handleMarkComplete}
        >
          <Ionicons name={isCompleted ? "checkmark-circle" : "checkmark-circle-outline"} size={22} color={isCompleted ? "#1E3A5F" : "#fff"} />
          <Text style={[styles.completeBtnText, isCompleted && styles.completeBtnTextDone]}>
            {isCompleted ? t("completed") : t("markComplete")}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { padding: 20, paddingBottom: 28 },
  backBtn: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, padding: 8, alignSelf: "flex-start", marginBottom: 16 },
  phaseNumBig: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  phaseNumText: { fontSize: 22, fontWeight: "bold" },
  headerTitle: { color: "#fff", fontSize: 26, fontWeight: "bold", marginBottom: 4 },
  headerDuration: { color: "rgba(255,255,255,0.7)", fontSize: 13 },
  content: { padding: 20 },
  description: { fontSize: 15, lineHeight: 24, marginBottom: 4 },
  divider: { height: 0.5, marginVertical: 20 },
  sectionTitle: { fontSize: 17, fontWeight: "bold", marginBottom: 14 },
  stepRow: { flexDirection: "row", gap: 12, marginBottom: 12, alignItems: "flex-start" },
  stepNum: { width: 26, height: 26, borderRadius: 13, backgroundColor: "#1E3A5F", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 },
  stepNumText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  stepText: { flex: 1, fontSize: 14, lineHeight: 22 },
  duaCard: { borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 0.5 },
  duaTitle: { fontSize: 12, fontWeight: "bold", marginBottom: 10 },
  duaArabic: { fontSize: 20, textAlign: "right", lineHeight: 36, marginBottom: 8 },
  duaTranslit: { fontSize: 13, color: "#C9A84C", fontStyle: "italic", marginBottom: 8 },
  duaDivider: { height: 0.5, marginBottom: 8 },
  duaTranslation: { fontSize: 13, lineHeight: 20 },
  tipRow: { flexDirection: "row", gap: 10, marginBottom: 10, alignItems: "flex-start" },
  tipText: { flex: 1, fontSize: 14, lineHeight: 22 },
  completeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "green", marginHorizontal: 20, borderRadius: 25, padding: 14, marginBottom: 12 },
  completeBtnDone: { backgroundColor: "#C9A84C" },
  completeBtnText: { color: "#fff", fontSize: 15, fontWeight: "bold" },
  completeBtnTextDone: { color: "#1E3A5F" },
  nextBtn: { backgroundColor: "#1E3A5F", borderRadius: 14, padding: 16, marginTop: 4 },
  nextBtnContent: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  nextBtnLabel: { color: "#C9A84C", fontSize: 12, fontWeight: "600", marginBottom: 4 },
  nextBtnTitle: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  completionBox: { backgroundColor: "#1E3A5F", borderRadius: 14, padding: 24, alignItems: "center" },
  completionEmoji: { fontSize: 48, marginBottom: 12 },
  completionTitle: { color: "#C9A84C", fontSize: 20, fontWeight: "bold", marginBottom: 8 },
  completionText: { color: "rgba(255,255,255,0.8)", fontSize: 14, textAlign: "center", lineHeight: 22 },
})
