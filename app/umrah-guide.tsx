import { getUmrahProgress } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const phases = [
  { id: "1", title: "Madinah Visit", subtitle: "Masjid Nabawi · Ziyarat · Riyad Al Jannah", color: "#E6F1FB", textColor: "#0C447C", duration: "1-3 days" },
  { id: "2", title: "Entering Ihram", subtitle: "Miqat · Ghusl · Niyyah · Talbiyah", color: "#E1F5EE", textColor: "#085041", duration: "1-2 hours" },
  { id: "3", title: "Arriving in Makkah", subtitle: "Entering Masjid Al-Haram · First Kaaba dua", color: "#FAEEDA", textColor: "#633806", duration: "30 mins" },
  { id: "4", title: "Tawaf", subtitle: "7 rounds around the Kaaba", color: "#FAECE7", textColor: "#712B13", duration: "1-2 hours" },
  { id: "5", title: "Sa'i", subtitle: "Safa to Marwa · 7 trips", color: "#EEEDFE", textColor: "#3C3489", duration: "1-2 hours" },
  { id: "6", title: "Halq / Taqsir", subtitle: "Men shave · Women trim · Exit Ihram", color: "#FBEAF0", textColor: "#72243E", duration: "15 mins" },
  { id: "7", title: "Umrah Complete", subtitle: "Congratulations · What comes next", color: "#E1F5EE", textColor: "#085041", duration: "Done!" },
]

export default function UmrahGuideScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [completedPhases, setCompletedPhases] = useState<string[]>([])

  const loadProgress = async () => {
    const progress = await getUmrahProgress()
    setCompletedPhases(progress)
  }

  useFocusEffect(
    useCallback(() => {
      loadProgress()
    }, [])
  )

  return (
    <View style={styles.screen}>
      <View style={[styles.safeTop, { height: insets.top }]} />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={[styles.header, { paddingTop: 16 }]}>
          <Text style={styles.title}>Umrah Guide</Text>
          <Text style={styles.subtitle}>Your complete step by step journey</Text>
        </View>

        {/* Progress bar */}
        {completedPhases.length > 0 && (
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Your Progress</Text>
              <Text style={styles.progressCount}>{completedPhases.length} of {phases.length} phases</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${(completedPhases.length / phases.length) * 100}%` }]} />
            </View>
          </View>
        )}

        {/* Section Label */}
        <Text style={styles.sectionLabel}>YOUR JOURNEY</Text>

        {/* Phases List */}
        {phases.map((phase) => {
          const isCompleted = completedPhases.includes(phase.id)
          return (
            <TouchableOpacity
              key={phase.id}
              style={[styles.phaseCard, isCompleted && styles.phaseCardCompleted]}
              onPress={() => router.push(`/umrah/${phase.id}`)}
            >
              <View style={styles.phaseRow}>
                <View style={[styles.phaseNum, { backgroundColor: isCompleted ? "#C9A84C" : phase.color }]}>
                  {isCompleted ? (
                    <Ionicons name="checkmark" size={18} color="#1E3A5F" />
                  ) : (
                    <Text style={[styles.phaseNumText, { color: phase.textColor }]}>{phase.id}</Text>
                  )}
                </View>
                <View style={styles.phaseInfo}>
                  <Text style={styles.phaseTitle}>{phase.title}</Text>
                  <Text style={styles.phaseSub}>{phase.subtitle}</Text>
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
  screen: { flex: 1, backgroundColor: "#F5F0E8" },
  safeTop: { backgroundColor: "#1E3A5F" },
  header: { backgroundColor: "#1E3A5F", padding: 20, paddingBottom: 24 },
  title: { color: "#fff", fontSize: 26, fontWeight: "bold" },
  subtitle: { color: "#C9A84C", fontSize: 13, marginTop: 4 },
  progressCard: { backgroundColor: "#fff", marginHorizontal: 16, marginTop: 16, borderRadius: 14, padding: 16, borderWidth: 0.5, borderColor: "#E0D9CE" },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  progressTitle: { fontSize: 14, fontWeight: "bold", color: "#1E3A5F" },
  progressCount: { fontSize: 13, color: "#C9A84C", fontWeight: "600" },
  progressTrack: { height: 8, backgroundColor: "#F5F0E8", borderRadius: 4, overflow: "hidden" },
  progressFill: { height: 8, backgroundColor: "#C9A84C", borderRadius: 4 },
  sectionLabel: { fontSize: 11, fontWeight: "500", color: "#888", paddingHorizontal: 16, marginBottom: 8, marginTop: 8, letterSpacing: 0.5 },
  phaseCard: { backgroundColor: "#fff", marginHorizontal: 16, marginBottom: 10, borderRadius: 12, borderWidth: 0.5, borderColor: "#E0D9CE" },
  phaseCardCompleted: { borderColor: "#C9A84C", borderWidth: 1 },
  phaseRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  phaseNum: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  phaseNumText: { fontSize: 15, fontWeight: "bold" },
  phaseInfo: { flex: 1 },
  phaseTitle: { fontSize: 14, fontWeight: "bold", color: "#1E3A5F" },
  phaseSub: { fontSize: 11, color: "#888", marginTop: 2 },
  phaseArrow: { fontSize: 20, color: "#C9A84C" },
})