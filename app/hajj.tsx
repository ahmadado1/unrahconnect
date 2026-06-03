import { useTheme } from "@/context/themeContext";
import { getHajjProgress } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const phases = [
  { id: "1", title: "Preparation & Ihram", subtitle: "Intention · Ghusl · Ihram garments · Talbiyah", color: "#E6F1FB", textColor: "#0C447C", duration: "1 day" },
  { id: "2", title: "Arriving in Makkah", subtitle: "Tawaf Al-Qudum · Sa'i · Settling in Makkah", color: "#E1F5EE", textColor: "#085041", duration: "1 day" },
  { id: "3", title: "Day of Tarwiyah — Mina", subtitle: "8th Dhul Hijjah · Travel to Mina · Night in Mina", color: "#FAEEDA", textColor: "#633806", duration: "1 day" },
  { id: "4", title: "Day of Arafah", subtitle: "9th Dhul Hijjah · The most important day of Hajj", color: "#FAECE7", textColor: "#712B13", duration: "1 day" },
  { id: "5", title: "Muzdalifah", subtitle: "Night under the sky · Collecting pebbles · Fajr prayer", color: "#EEEDFE", textColor: "#3C3489", duration: "1 night" },
  { id: "6", title: "Day of Eid — Jamarat", subtitle: "10th Dhul Hijjah · Stoning · Sacrifice · Halq · Tawaf Ifadah", color: "#FBEAF0", textColor: "#72243E", duration: "1 day" },
  { id: "7", title: "Days of Tashreeq", subtitle: "11th-13th Dhul Hijjah · Staying in Mina · Stoning Jamarat", color: "#FAECE7", textColor: "#712B13", duration: "2-3 days" },
  { id: "8", title: "Tawaf Al-Wadaa", subtitle: "Farewell Tawaf · Leaving Makkah", color: "#E1F5EE", textColor: "#085041", duration: "Few hours" },
  { id: "9", title: "Hajj Complete", subtitle: "Congratulations · You are now a Hajji 🎉", color: "#E6F1FB", textColor: "#0C447C", duration: "Done!" },
]

export default function HajjGuideScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { theme } = useTheme()
  const [completedPhases, setCompletedPhases] = useState<string[]>([])
  const { t } = useTranslation()

  const loadProgress = async () => {
    const progress = await getHajjProgress()
    setCompletedPhases(progress)
  }

  useFocusEffect(useCallback(() => { loadProgress() }, []))

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      {/* Dynamic island — always navy */}
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header — always navy */}
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <Text style={styles.title}>{t("hajjGuideTitle")}</Text>
          <Text style={styles.subtitle}>{t("completeHajj")}</Text>
        </View>

        {/* Progress bar */}
        {completedPhases.length > 0 && (
          <View style={[styles.progressCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressTitle, { color: theme.text }]}>{t("yourProgress")}</Text>
              <Text style={styles.progressCount}>{completedPhases.length} {t("of")} {phases.length} {t("phases")}</Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
              <View style={[styles.progressFill, { width: `${(completedPhases.length / phases.length) * 100}%` }]} />
            </View>
          </View>
        )}

        {/* Section label */}
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>{t("yourJourney")}</Text>

        {/* Phases list */}
        {phases.map((phase) => {
          const isCompleted = completedPhases.includes(phase.id)
          return (
            <TouchableOpacity
              key={phase.id}
              style={[
                styles.phaseCard,
                { backgroundColor: theme.card, borderColor: theme.border },
                isCompleted && styles.phaseCardCompleted
              ]}
              onPress={() => router.push(`/hajj/${phase.id}`)}
            >
              <View style={styles.phaseRow}>
                {/* Phase number — gold with checkmark if completed */}
                <View style={[styles.phaseNum, { backgroundColor: isCompleted ? "#C9A84C" : phase.color }]}>
                  {isCompleted ? (
                    <Ionicons name="checkmark" size={18} color="#1E3A5F" />
                  ) : (
                    <Text style={[styles.phaseNumText, { color: phase.textColor }]}>{phase.id}</Text>
                  )}
                </View>
                <View style={styles.phaseInfo}>
                  <Text style={[styles.phaseTitle, { color: theme.text }]}>{phase.title}</Text>
                  <Text style={[styles.phaseSub, { color: theme.textSecondary }]}>{phase.subtitle}</Text>
                </View>
                {isCompleted ? (
                  <Ionicons name="checkmark-circle" size={22} color="#C9A84C" />
                ) : (
                  <Text style={styles.phaseArrow}>›</Text>
                )}
              </View>
            </TouchableOpacity>
          )
        })}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeTop: { backgroundColor: "#1E3A5F" },
  header: { backgroundColor: "#1E3A5F", padding: 20, paddingBottom: 34 },
  title: { color: "#fff", fontSize: 26, fontWeight: "bold", marginTop: 40 },
  subtitle: { color: "#C9A84C", fontSize: 13, },
  phaseCardCompleted: { borderColor: "#C9A84C", borderWidth: 1 },
  progressCard: { marginHorizontal: 16, marginTop: 20, borderRadius: 16, padding: 35, borderWidth: 0.5 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  progressTitle: { fontSize: 18, fontWeight: "bold" },
  progressCount: { fontSize: 16, color: "#C9A84C", fontWeight: "600" },
  progressTrack: { height: 8, borderRadius: 8, overflow: "hidden" },
  progressFill: { height: 8, backgroundColor: "#C9A84C", borderRadius: 4 },
  sectionLabel: { fontSize: 11, fontWeight: "500", paddingHorizontal: 16, marginBottom: 8, marginTop: 8, letterSpacing: 0.5 },
  phaseCard: { marginHorizontal: 16, marginBottom: 10, borderRadius: 12, borderWidth: 0.5 },
  phaseRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  phaseNum: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  phaseNumText: { fontSize: 15, fontWeight: "bold" },
  phaseInfo: { flex: 1 },
  phaseTitle: { fontSize: 14, fontWeight: "bold" },
  phaseSub: { fontSize: 11, marginTop: 2 },
  phaseArrow: { fontSize: 20, color: "#C9A84C" },
})