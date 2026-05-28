import { useTheme } from "@/context/themeContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AboutScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { theme, isDark } = useTheme()

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: theme.header }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Us</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Logo section — always navy */}
        <View style={[styles.logoSection, { backgroundColor: theme.header }]}>
          <Text style={styles.logoEmoji}>🌙</Text>
          <Text style={styles.appName}>UmrahConnect</Text>
          <Text style={styles.tagline}>Your complete Umrah & Hajj companion</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color="#C9A84C" />
            <Text style={styles.location}>Based in Egypt</Text>
          </View>
        </View>

        {/* Mission */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Our Mission</Text>
          <Text style={[styles.sectionText, { color: theme.textSecondary }]}>
            UmrahConnect was created to be the most complete digital companion for pilgrims performing Umrah and Hajj. We believe every pilgrim deserves easy access to the best hotels, restaurants, and guidance — all in one place.
          </Text>
        </View>

        {/* What we offer */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>What We Offer</Text>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🏨</Text>
            <View style={styles.featureInfo}>
              <Text style={[styles.featureName, { color: theme.text }]}>Hotels</Text>
              <Text style={[styles.featureDesc, { color: theme.textSecondary }]}>Curated hotels in Makkah and Madinah — from budget to luxury</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🍽️</Text>
            <View style={styles.featureInfo}>
              <Text style={[styles.featureName, { color: theme.text }]}>Restaurants</Text>
              <Text style={[styles.featureDesc, { color: theme.textSecondary }]}>The best halal restaurants near Masjid Al-Haram and Masjid Nabawi</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🕋</Text>
            <View style={styles.featureInfo}>
              <Text style={[styles.featureName, { color: theme.text }]}>Umrah Guide</Text>
              <Text style={[styles.featureDesc, { color: theme.textSecondary }]}>Complete step by step Umrah guide with duas in Arabic and English</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>☪️</Text>
            <View style={styles.featureInfo}>
              <Text style={[styles.featureName, { color: theme.text }]}>Hajj Guide</Text>
              <Text style={[styles.featureDesc, { color: theme.textSecondary }]}>Full Hajj guide covering every step of the pilgrimage</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🛍️</Text>
            <View style={styles.featureInfo}>
              <Text style={[styles.featureName, { color: theme.text }]}>Malls & Shopping</Text>
              <Text style={[styles.featureDesc, { color: theme.textSecondary }]}>Best shopping destinations near the Haram — coming soon</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🕌</Text>
            <View style={styles.featureInfo}>
              <Text style={[styles.featureName, { color: theme.text }]}>Mosques & Ziyarat</Text>
              <Text style={[styles.featureDesc, { color: theme.textSecondary }]}>Historical mosques and sites to visit during your stay — coming soon</Text>
            </View>
          </View>

        </View>

        {/* Social media */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Follow Us</Text>
          <Text style={[styles.comingSoon, { color: theme.textSecondary }]}>🚀 Social media coming soon — stay tuned!</Text>
        </View>

        {/* Version */}
        <View style={styles.versionBox}>
          <Text style={[styles.versionText, { color: theme.textSecondary }]}>UmrahConnect v1.0</Text>
          <Text style={styles.versionSub}>Made with ❤️ in Egypt</Text>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { padding: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, padding: 8 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  logoSection: { alignItems: "center", padding: 32, paddingTop: 24 },
  logoEmoji: { fontSize: 60, marginBottom: 12 },
  appName: { color: "#fff", fontSize: 26, fontWeight: "bold", marginBottom: 6 },
  tagline: { color: "#C9A84C", fontSize: 14, marginBottom: 10 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  location: { color: "rgba(255,255,255,0.6)", fontSize: 13 },
  section: { marginHorizontal: 16, marginTop: 16, borderRadius: 14, padding: 18, borderWidth: 0.5 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 12 },
  sectionText: { fontSize: 14, lineHeight: 22 },
  featureItem: { flexDirection: "row", gap: 12, marginBottom: 14, alignItems: "flex-start" },
  featureIcon: { fontSize: 24 },
  featureInfo: { flex: 1 },
  featureName: { fontSize: 14, fontWeight: "bold", marginBottom: 2 },
  featureDesc: { fontSize: 13, lineHeight: 20 },
  comingSoon: { fontSize: 14, textAlign: "center", padding: 10 },
  versionBox: { alignItems: "center", marginTop: 24 },
  versionText: { fontSize: 13 },
  versionSub: { fontSize: 12, color: "#C9A84C", marginTop: 4 },
})