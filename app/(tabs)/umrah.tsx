import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function GuideScreen() {
  const router = useRouter()

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <SafeAreaView edges={["top"]} style={styles.safeTop} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Guide</Text>
          <Text style={styles.subtitle}>Choose your pilgrimage</Text>
        </View>

        <View style={styles.content}>

          {/* Umrah Card */}
          <TouchableOpacity
            style={styles.guideCard}
            onPress={() => router.push("/umrah-guide")}
          >
            <View style={[styles.cardIcon, { backgroundColor: "#E1F5EE" }]}>
              <Text style={styles.cardEmoji}>🕋</Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Umrah Guide</Text>
              <Text style={styles.cardSub}>7 phases · Complete step by step guide</Text>
              <Text style={styles.cardDesc}>For those performing Umrah — includes duas, tips and progress tracking</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#C9A84C" />
          </TouchableOpacity>

          {/* Hajj Card */}
          <TouchableOpacity
            style={styles.guideCard}
            onPress={() => router.push("/hajj")}
          >
            <View style={[styles.cardIcon, { backgroundColor: "#FAEEDA" }]}>
              <Text style={styles.cardEmoji}>☪️</Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Hajj Guide</Text>
              <Text style={styles.cardSub}>9 phases · Complete Hajj journey</Text>
              <Text style={styles.cardDesc}>For those performing Hajj — covers all days from 8th to 13th Dhul Hijjah</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#C9A84C" />
          </TouchableOpacity>

          {/* Coming soon section */}
          <View style={styles.comingSoon}>
            <Text style={styles.comingSoonTitle}>Coming Soon</Text>
            <View style={styles.comingSoonItem}>
              <Ionicons name="book-outline" size={20} color="#C9A84C" />
              <Text style={styles.comingSoonText}>Full Quran Reader</Text>
            </View>
            <View style={styles.comingSoonItem}>
              <Ionicons name="time-outline" size={20} color="#C9A84C" />
              <Text style={styles.comingSoonText}>Prayer Times</Text>
            </View>
            <View style={styles.comingSoonItem}>
              <Ionicons name="compass-outline" size={20} color="#C9A84C" />
              <Text style={styles.comingSoonText}>Qibla Direction</Text>
            </View>
          </View>

        </View>

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

  content: { padding: 16 },

  guideCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16, flexDirection: "row", alignItems: "center", gap: 14, borderWidth: 0.5, borderColor: "#E0D9CE" },
  cardIcon: { width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  cardEmoji: { fontSize: 28 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: "bold", color: "#1E3A5F", marginBottom: 2 },
  cardSub: { fontSize: 12, color: "#C9A84C", marginBottom: 6 },
  cardDesc: { fontSize: 13, color: "#888", lineHeight: 18 },

  comingSoon: { backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 0.5, borderColor: "#E0D9CE", marginTop: 8 },
  comingSoonTitle: { fontSize: 13, fontWeight: "600", color: "#888", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  comingSoonItem: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  comingSoonText: { fontSize: 14, color: "#1E3A5F" },
})