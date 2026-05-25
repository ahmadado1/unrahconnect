import { getHajjProgress } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const phases = [
    {
      id: "1",
      title: "Preparation & Ihram",
      subtitle: "Intention · Ghusl · Ihram garments · Talbiyah",
      color: "#E6F1FB",
      textColor: "#0C447C",
      duration: "1 day",
    },
    {
      id: "2",
      title: "Arriving in Makkah",
      subtitle: "Tawaf Al-Qudum · Sa'i · Settling in Makkah",
      color: "#E1F5EE",
      textColor: "#085041",
      duration: "1 day",
    },
    {
      id: "3",
      title: "Day of Tarwiyah — Mina",
      subtitle: "8th Dhul Hijjah · Travel to Mina · Night in Mina",
      color: "#FAEEDA",
      textColor: "#633806",
      duration: "1 day",
    },
    {
      id: "4",
      title: "Day of Arafah",
      subtitle: "9th Dhul Hijjah · The most important day of Hajj",
      color: "#FAECE7",
      textColor: "#712B13",
      duration: "1 day",
    },
    {
      id: "5",
      title: "Muzdalifah",
      subtitle: "Night under the sky · Collecting pebbles · Fajr prayer",
      color: "#EEEDFE",
      textColor: "#3C3489",
      duration: "1 night",
    },
    {
      id: "6",
      title: "Day of Eid — Jamarat",
      subtitle: "10th Dhul Hijjah · Stoning · Sacrifice · Halq · Tawaf Ifadah",
      color: "#FBEAF0",
      textColor: "#72243E",
      duration: "1 day",
    },
    {
      id: "7",
      title: "Days of Tashreeq",
      subtitle: "11th-13th Dhul Hijjah · Staying in Mina · Stoning Jamarat",
      color: "#FAECE7",
      textColor: "#712B13",
      duration: "2-3 days",
    },
    {
      id: "8",
      title: "Tawaf Al-Wadaa",
      subtitle: "Farewell Tawaf · Leaving Makkah",
      color: "#E1F5EE",
      textColor: "#085041",
      duration: "Few hours",
    },
    {
      id: "9",
      title: "Hajj Complete",
      subtitle: "Congratulations · You are now a Hajji 🎉",
      color: "#E6F1FB",
      textColor: "#0C447C",
      duration: "Done!",
    },
  ]

export default function HajjGuideScreen()  {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  // Stores which phase ids are completed e.g. ["1", "2", "3"]
  const [completedPhases, setCompletedPhases] = useState<string[]>([])


     // Step 3 — load function
  const loadProgress = async () => {
    const progress = await getHajjProgress()
    setCompletedPhases(progress)
  }

  // Step 4 — call it when screen opens
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
        <Text style={styles.title}>Hajj Guide</Text>
        <Text style={styles.subtitle}>Your complete Hajj journey</Text>
        </View>

        

          {/* Progress bar — only shows if user has completed at least one phase */}
        {completedPhases.length > 0 && (
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Your Progress</Text>
              <Text style={styles.progressCount}>
                {completedPhases.length} of {phases.length} phases
              </Text>
            </View>
            {/* The bar track */}
            <View style={styles.progressTrack}>
              {/* The filled part — width changes based on completion */}
              <View style={[styles.progressFill, { 
                width: `${(completedPhases.length / phases.length) * 100}%` 
              }]} />
            </View>
          </View>
        )}

        {/* Section Label */}
        <Text style={styles.sectionLabel}>YOUR JOURNEY</Text>

        {/* Phases List */}
        {phases.map((phase) => {
      // Check if this phase is in the completed list
      const isCompleted = completedPhases.includes(phase.id)

      return (
        <TouchableOpacity key={phase.id} style={[styles.phaseCard, isCompleted && styles.phaseCardCompleted]} onPress={() => router.push(`/hajj/${phase.id}`)}>
          <View style={styles.phaseRow}>
            {/* Phase number circle — shows checkmark if completed */}
            <View style={[styles.phaseNum, { backgroundColor: isCompleted ? "#C9A84C" : phase.color }]}>
              {isCompleted ? (
                // Gold checkmark when done
                <Ionicons name="checkmark" size={18} color="#1E3A5F" />
              ) : (
                // Phase number when not done
                <Text style={[styles.phaseNumText, { color: phase.textColor }]}>{phase.id}</Text>
              )}
            </View>
            <View style={styles.phaseInfo}>
              <Text style={styles.phaseTitle}>{phase.title}</Text>
              <Text style={styles.phaseSub}>{phase.subtitle}</Text>
            </View>
            {/* Gold checkmark on right if completed, arrow if not */}
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
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F5F0E8" },
  safeTop: { backgroundColor: "#1E3A5F" },
  header: { backgroundColor: "#1E3A5F", padding: 20,  paddingBottom: 24 },
  title: { color: "#fff", fontSize: 26, fontWeight: "bold" },
  subtitle: { color: "#C9A84C", fontSize: 13, marginTop: 4 },

  phaseCardCompleted: { borderColor: "#C9A84C", borderWidth: 1 },

  statsBar: { flexDirection: "row", backgroundColor: "#fff", marginHorizontal: 16, marginTop: 16, borderRadius: 14, padding: 16, borderWidth: 0.5, borderColor: "#E0D9CE" },
  statItem: { flex: 1, alignItems: "center" },
  statNumber: { fontSize: 18, fontWeight: "bold", color: "#1E3A5F" },
  statLabel: { fontSize: 11, color: "#888", marginTop: 2 },
  statDivider: { width: 0.5, backgroundColor: "#E0D9CE" },

  progressCard: { backgroundColor: "#fff", marginHorizontal: 16, marginTop: 20, borderRadius: 16, padding: 35, borderWidth: 0.5, borderColor: "#E0D9CE" },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  progressTitle: { fontSize: 18, fontWeight: "bold", color: "#1E3A5F" },
  progressCount: { fontSize: 16, color: "#C9A84C", fontWeight: "600" },
  progressTrack: { height: 8, backgroundColor: "#F5F0E8", borderRadius: 8, overflow: "hidden" },
  progressFill: { height: 8, backgroundColor: "#C9A84C", borderRadius: 4 },

  sectionLabel: { fontSize: 11, fontWeight: "500", color: "#888", paddingHorizontal: 16, marginBottom: 8, marginTop: 8, letterSpacing: 0.5 },
  phaseCard: { backgroundColor: "#fff", marginHorizontal: 16, marginBottom: 10, borderRadius: 12, borderWidth: 0.5, borderColor: "#E0D9CE" },
  phaseRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  phaseNum: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  phaseNumText: { fontSize: 15, fontWeight: "bold" },
  phaseInfo: { flex: 1 },
  phaseTitle: { fontSize: 14, fontWeight: "bold", color: "#1E3A5F" },
  phaseSub: { fontSize: 11, color: "#888", marginTop: 2 },
  phaseArrow: { fontSize: 20, color: "#C9A84C" },
});
