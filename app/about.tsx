// Navigation
import { useRouter } from "expo-router";
// Status bar
import { StatusBar } from "expo-status-bar";
// Opens external links like social media
// UI components
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
// Dynamic island padding
import { useSafeAreaInsets } from "react-native-safe-area-context";
// Icons
import { Ionicons } from "@expo/vector-icons";

export default function AboutScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Us</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Logo section */}
        <View style={styles.logoSection}>
          <Text style={styles.logoEmoji}>🌙</Text>
          <Text style={styles.appName}>UmrahConnect</Text>
          <Text style={styles.tagline}>Your complete Umrah & Hajj companion</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color="#C9A84C" />
            <Text style={styles.location}>Based in Egypt</Text>
          </View>
        </View>

        {/* Mission */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.sectionText}>
            UmrahConnect was created to be the most complete digital companion for pilgrims performing Umrah and Hajj. We believe every pilgrim deserves easy access to the best hotels, restaurants, and guidance — all in one place.
          </Text>
        </View>

        {/* What we offer */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What We Offer</Text>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🏨</Text>
            <View style={styles.featureInfo}>
              <Text style={styles.featureName}>Hotels</Text>
              <Text style={styles.featureDesc}>Curated hotels in Makkah and Madinah — from budget to luxury</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🍽️</Text>
            <View style={styles.featureInfo}>
              <Text style={styles.featureName}>Restaurants</Text>
              <Text style={styles.featureDesc}>The best halal restaurants near Masjid Al-Haram and Masjid Nabawi</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🕋</Text>
            <View style={styles.featureInfo}>
              <Text style={styles.featureName}>Umrah Guide</Text>
              <Text style={styles.featureDesc}>Complete step by step Umrah guide with duas in Arabic and English</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>☪️</Text>
            <View style={styles.featureInfo}>
              <Text style={styles.featureName}>Hajj Guide</Text>
              <Text style={styles.featureDesc}>Full Hajj guide covering every step of the pilgrimage — coming soon</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🛍️</Text>
            <View style={styles.featureInfo}>
              <Text style={styles.featureName}>Malls & Shopping</Text>
              <Text style={styles.featureDesc}>Best shopping destinations near the Haram — coming soon</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🕌</Text>
            <View style={styles.featureInfo}>
              <Text style={styles.featureName}>Mosques & Ziyarat</Text>
              <Text style={styles.featureDesc}>Historical mosques and sites to visit during your stay — coming soon</Text>
            </View>
          </View>

        </View>

        {/* Social media */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Follow Us</Text>
          <Text style={styles.comingSoon}>🚀 Social media coming soon — stay tuned!</Text>
        </View>

        {/* Version */}
        <View style={styles.versionBox}>
          <Text style={styles.versionText}>UmrahConnect v1.0</Text>
          <Text style={styles.versionSub}>Made with ❤️ in Egypt</Text>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F5F0E8" },
  header: { backgroundColor: "#1E3A5F", padding: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, padding: 8 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },

  logoSection: { backgroundColor: "#1E3A5F", alignItems: "center", padding: 32, paddingTop: 24 },
  logoEmoji: { fontSize: 60, marginBottom: 12 },
  appName: { color: "#fff", fontSize: 26, fontWeight: "bold", marginBottom: 6 },
  tagline: { color: "#C9A84C", fontSize: 14, marginBottom: 10 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  location: { color: "rgba(255,255,255,0.6)", fontSize: 13 },

  section: { backgroundColor: "#fff", marginHorizontal: 16, marginTop: 16, borderRadius: 14, padding: 18, borderWidth: 0.5, borderColor: "#E0D9CE" },
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: "#1E3A5F", marginBottom: 12 },
  sectionText: { fontSize: 14, color: "#555", lineHeight: 22 },

  featureItem: { flexDirection: "row", gap: 12, marginBottom: 14, alignItems: "flex-start" },
  featureIcon: { fontSize: 24 },
  featureInfo: { flex: 1 },
  featureName: { fontSize: 14, fontWeight: "bold", color: "#1E3A5F", marginBottom: 2 },
  featureDesc: { fontSize: 13, color: "#888", lineHeight: 20 },

  comingSoon: { fontSize: 14, color: "#888", textAlign: "center", padding: 10 },

  versionBox: { alignItems: "center", marginTop: 24 },
  versionText: { fontSize: 13, color: "#888" },
  versionSub: { fontSize: 12, color: "#C9A84C", marginTop: 4 },
})