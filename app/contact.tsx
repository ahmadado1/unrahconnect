import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ContactScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  // Contact details
  const phone = "+201222151335"
  const whatsapp = "+201222151335"
  const email = "ahmadado6002@gmail.com"

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Us</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Top section */}
        <View style={styles.topSection}>
          <Text style={styles.topEmoji}>📞</Text>
          <Text style={styles.topTitle}>Get in touch</Text>
          <Text style={styles.topSub}>We are here to help you with your Umrah journey</Text>
        </View>

        {/* Contact buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reach us directly</Text>

          {/* WhatsApp */}
          <TouchableOpacity
            style={styles.contactBtn}
            onPress={() => Linking.openURL(`https://wa.me/${whatsapp.replace("+", "")}`)}
          >
            <View style={[styles.contactIcon, { backgroundColor: "#25D366" }]}>
              <Ionicons name="logo-whatsapp" size={22} color="#fff" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>WhatsApp</Text>
              <Text style={styles.contactValue}>{whatsapp}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C9A84C" />
          </TouchableOpacity>

          {/* Phone */}
          <TouchableOpacity
            style={styles.contactBtn}
            onPress={() => Linking.openURL(`tel:${phone}`)}
          >
            <View style={[styles.contactIcon, { backgroundColor: "#1E3A5F" }]}>
              <Ionicons name="call" size={22} color="#fff" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Phone</Text>
              <Text style={styles.contactValue}>{phone}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C9A84C" />
          </TouchableOpacity>

          {/* Email */}
          <TouchableOpacity
            style={styles.contactBtn}
            onPress={() => Linking.openURL(`mailto:${email}`)}
          >
            <View style={[styles.contactIcon, { backgroundColor: "#C9A84C" }]}>
              <Ionicons name="mail" size={22} color="#1E3A5F" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Email</Text>
              <Text style={styles.contactValue}>{email}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C9A84C" />
          </TouchableOpacity>

        </View>

        {/* Response time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Response time</Text>
          <View style={styles.responseItem}>
            <Ionicons name="time-outline" size={18} color="#C9A84C" />
            <Text style={styles.responseText}>WhatsApp — Usually within 1 hour</Text>
          </View>
          <View style={styles.responseItem}>
            <Ionicons name="time-outline" size={18} color="#C9A84C" />
            <Text style={styles.responseText}>Email — Within 24 hours</Text>
          </View>
          <View style={styles.responseItem}>
            <Ionicons name="time-outline" size={18} color="#C9A84C" />
            <Text style={styles.responseText}>Phone — Available 9am to 9pm Egypt time</Text>
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Based in</Text>
          <View style={styles.responseItem}>
            <Ionicons name="location" size={18} color="#C9A84C" />
            <Text style={styles.responseText}>Egypt 🇪🇬 — Serving pilgrims worldwide</Text>
          </View>
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

  topSection: { backgroundColor: "#1E3A5F", alignItems: "center", padding: 28 },
  topEmoji: { fontSize: 50, marginBottom: 12 },
  topTitle: { color: "#fff", fontSize: 22, fontWeight: "bold", marginBottom: 6 },
  topSub: { color: "rgba(255,255,255,0.6)", fontSize: 13, textAlign: "center" },

  section: { backgroundColor: "#fff", marginHorizontal: 16, marginTop: 16, borderRadius: 14, padding: 18, borderWidth: 0.5, borderColor: "#E0D9CE" },
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: "#1E3A5F", marginBottom: 14 },

  contactBtn: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: "#E0D9CE" },
  contactIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  contactInfo: { flex: 1 },
  contactLabel: { fontSize: 12, color: "#888" },
  contactValue: { fontSize: 14, fontWeight: "500", color: "#1E3A5F", marginTop: 2 },

  responseItem: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  responseText: { fontSize: 14, color: "#555" },
})