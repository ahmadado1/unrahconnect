import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PrivacyScreen() {
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
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>

        <Text style={styles.lastUpdated}>Last updated: May 2026</Text>

        <Text style={styles.sectionTitle}>Introduction</Text>
        <Text style={styles.body}>
          Welcome to UmrahConnect. We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use and protect your information when you use our app.
        </Text>

        <Text style={styles.sectionTitle}>Information We Collect</Text>
        <Text style={styles.body}>
          We collect information you provide directly to us when you create an account, such as your name, email address, phone number and nationality. We also collect information about how you use our app including hotels and restaurants you view and save to favorites.
        </Text>

        <Text style={styles.sectionTitle}>How We Use Your Information</Text>
        <Text style={styles.body}>
          We use the information we collect to provide and improve our services, personalize your experience, process bookings and reservations, send you updates and notifications, and respond to your inquiries.
        </Text>

        <Text style={styles.sectionTitle}>Data Storage</Text>
        <Text style={styles.body}>
          Your data is stored securely using Supabase, a trusted cloud database provider. We use industry standard security measures to protect your personal information from unauthorized access.
        </Text>

        <Text style={styles.sectionTitle}>Sharing Your Information</Text>
        <Text style={styles.body}>
          We do not sell, trade or rent your personal information to third parties. We may share your information with hotel and restaurant partners only when necessary to complete a booking you have requested.
        </Text>

        <Text style={styles.sectionTitle}>Your Rights</Text>
        <Text style={styles.body}>
          You have the right to access, update or delete your personal information at any time through your Profile screen. You may also contact us directly to request changes to your data.
        </Text>

        <Text style={styles.sectionTitle}>Contact Us</Text>
        <Text style={styles.body}>
          If you have any questions about this Privacy Policy please contact us at ahmadado6002@gmail.com or via WhatsApp at +201222151335.
        </Text>

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
  content: { padding: 20 },
  lastUpdated: { color: "#888", fontSize: 12, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: "#1E3A5F", marginTop: 20, marginBottom: 8 },
  body: { fontSize: 14, color: "#555", lineHeight: 24 },
})