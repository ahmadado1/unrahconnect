import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const phases = [
  {
    id: "1",
    title: "Madinah Visit",
    subtitle: "Masjid Nabawi · Ziyarat · Riyad Al Jannah",
    color: "#E6F1FB",
    textColor: "#0C447C",
    duration: "1-3 days",
  },
  {
    id: "2",
    title: "Entering Ihram",
    subtitle: "Miqat · Ghusl · Niyyah · Talbiyah",
    color: "#E1F5EE",
    textColor: "#085041",
    duration: "1-2 hours",
  },
  {
    id: "3",
    title: "Arriving in Makkah",
    subtitle: "Entering Masjid Al-Haram · First Kaaba dua",
    color: "#FAEEDA",
    textColor: "#633806",
    duration: "30 mins",
  },
  {
    id: "4",
    title: "Tawaf",
    subtitle: "7 rounds around the Kaaba",
    color: "#FAECE7",
    textColor: "#712B13",
    duration: "1-2 hours",
  },
  {
    id: "5",
    title: "Sa'i",
    subtitle: "Safa to Marwa · 7 trips",
    color: "#EEEDFE",
    textColor: "#3C3489",
    duration: "1-2 hours",
  },
  {
    id: "6",
    title: "Halq / Taqsir",
    subtitle: "Men shave · Women trim · Exit Ihram",
    color: "#FBEAF0",
    textColor: "#72243E",
    duration: "15 mins",
  },
  {
    id: "7",
    title: "Umrah Complete",
    subtitle: "Congratulations · What comes next",
    color: "#E1F5EE",
    textColor: "#085041",
    duration: "Done!",
  },
]

export default function UmrahGuideScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter()
  return (
    <View style={styles.screen}>
      <View style={[styles.safeTop, { height: insets.top }]} />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: 16 }]}>
          <Text style={styles.title}>Umrah Guide</Text>
          <Text style={styles.subtitle}>Your complete step by step journey</Text>
        </View>

        {/* Stats Bar */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>7</Text>
            <Text style={styles.statLabel}>Phases</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>~5hrs</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>14</Text>
            <Text style={styles.statLabel}>Duas</Text>
          </View>
        </View>

        {/* Section Label */}
        <Text style={styles.sectionLabel}>YOUR JOURNEY</Text>

        {/* Phases List */}
        {phases.map((phase) => (
          <TouchableOpacity key={phase.id} style={styles.phaseCard} onPress={() => router.push(`/umrah/${phase.id}`)}>
            <View style={styles.phaseRow}>
              <View style={[styles.phaseNum, { backgroundColor: phase.color }]}>
                <Text style={[styles.phaseNumText, { color: phase.textColor }]}>{phase.id}</Text>
              </View>
              <View style={styles.phaseInfo}>
                <Text style={styles.phaseTitle}>{phase.title}</Text>
                <Text style={styles.phaseSub}>{phase.subtitle}</Text>
              </View>
              <Text style={styles.phaseArrow}>›</Text>
            </View>
          </TouchableOpacity>
        ))}

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

  statsBar: { flexDirection: "row", backgroundColor: "#fff", marginHorizontal: 16, marginTop: 16, borderRadius: 14, padding: 16, borderWidth: 0.5, borderColor: "#E0D9CE" },
  statItem: { flex: 1, alignItems: "center" },
  statNumber: { fontSize: 18, fontWeight: "bold", color: "#1E3A5F" },
  statLabel: { fontSize: 11, color: "#888", marginTop: 2 },
  statDivider: { width: 0.5, backgroundColor: "#E0D9CE" },

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
