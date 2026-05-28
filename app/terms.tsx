import { useTheme } from "@/context/themeContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TermsScreen() {
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
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        <Text style={[styles.lastUpdated, { color: theme.textSecondary }]}>Last updated: May 2026</Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Acceptance of Terms</Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          By downloading and using UmrahConnect you agree to be bound by these Terms of Service. If you do not agree to these terms please do not use our app.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Use of the App</Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          UmrahConnect is designed to assist pilgrims performing Umrah and Hajj. You agree to use this app only for lawful purposes and in a manner that does not infringe the rights of others.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>User Accounts</Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account. We reserve the right to terminate accounts that violate these terms.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Hotel and Restaurant Information</Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          We strive to provide accurate and up to date information about hotels and restaurants. However we cannot guarantee that all information is always current. Prices, availability and details may change without notice. Always confirm directly with the establishment before booking.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Bookings and Payments</Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          When you make a booking through UmrahConnect you enter into a direct agreement with the hotel or service provider. UmrahConnect acts as an intermediary and is not responsible for the quality of services provided by third parties.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>External Links</Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          Our app may contain links to external websites and booking platforms. We are not responsible for the content or privacy practices of those external sites.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Limitation of Liability</Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          UmrahConnect shall not be liable for any indirect, incidental or consequential damages arising from your use of the app. Our total liability shall not exceed the amount you paid for the service in question.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Changes to Terms</Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          We reserve the right to modify these terms at any time. We will notify users of significant changes through the app. Continued use of the app after changes constitutes acceptance of the new terms.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Contact Us</Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          If you have any questions about these Terms of Service please contact us at ahmadado6002@gmail.com or via WhatsApp at +201222151335.
        </Text>

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
  content: { padding: 20 },
  lastUpdated: { fontSize: 12, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginTop: 20, marginBottom: 8 },
  body: { fontSize: 14, lineHeight: 24 },
})