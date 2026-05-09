// Navigation
import { useRouter } from "expo-router";
// Status bar
import { StatusBar } from "expo-status-bar";
// useState for toggles
import { useState } from "react";
// Opens external links
import { ScrollView, Share, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
// Dynamic island padding
import { useSafeAreaInsets } from "react-native-safe-area-context";
// Icons
import { Ionicons } from "@expo/vector-icons";


export default function SettingsScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  // Toggle states
  const [notifications, setNotifications] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Preferences section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          {/* Language */}
          <TouchableOpacity style={styles.settingRow}>
            <View style={[styles.settingIcon, { backgroundColor: "#1E3A5F" }]}>
              <Ionicons name="language" size={18} color="#fff" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Language</Text>
              <Text style={styles.settingValue}>English</Text>
            </View>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Soon</Text>
            </View>
          </TouchableOpacity>

          {/* Notifications toggle */}
          <View style={styles.settingRow}>
            <View style={[styles.settingIcon, { backgroundColor: "#C9A84C" }]}>
              <Ionicons name="notifications" size={18} color="#fff" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Notifications</Text>
              <Text style={styles.settingValue}>Receive app updates</Text>
            </View>
            {/* Switch toggles between true/false */}
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: "#E0D9CE", true: "#1E3A5F" }}
              thumbColor={notifications ? "#C9A84C" : "#fff"}
            />
          </View>

          {/* Dark mode toggle */}
          <View style={styles.settingRow}>
            <View style={[styles.settingIcon, { backgroundColor: "#2C5F8A" }]}>
              <Ionicons name="moon" size={18} color="#fff" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Dark Mode</Text>
              <Text style={styles.settingValue}>Coming soon</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: "#E0D9CE", true: "#1E3A5F" }}
              thumbColor={darkMode ? "#C9A84C" : "#fff"}
              disabled
            />
          </View>

        </View>

        {/* Legal section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>

          {/* Privacy Policy */}
          <TouchableOpacity style={styles.settingRow} onPress={() => router.push("/privacy")}>
            <View style={[styles.settingIcon, { backgroundColor: "#1B4332" }]}>
              <Ionicons name="shield-checkmark" size={18} color="#fff" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C9A84C" />
          </TouchableOpacity>

          {/* Terms of Service */}
          <TouchableOpacity style={styles.settingRow} onPress={() => router.push("/terms")}>
            <View style={[styles.settingIcon, { backgroundColor: "#1B4332" }]}>
              <Ionicons name="document-text" size={18} color="#fff" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Terms of Service</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C9A84C" />
          </TouchableOpacity>

        </View>

        {/* App section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App</Text>

          {/* Rate the app */}
          <TouchableOpacity style={styles.settingRow}>
            <View style={[styles.settingIcon, { backgroundColor: "#C9A84C" }]}>
              <Ionicons name="star" size={18} color="#1E3A5F" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Rate UmrahConnect</Text>
              <Text style={styles.settingValue}>Share your feedback</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C9A84C" />
          </TouchableOpacity>

          {/* Share app */}
          <TouchableOpacity style={styles.settingRow}  onPress={() => Share.share({ message: "Check out UmrahConnect — the complete Umrah & Hajj companion app! 🕋🌙" })}>
            <View style={[styles.settingIcon, { backgroundColor: "#2C5F8A" }]}>
              <Ionicons name="share-social" size={18} color="#fff" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Share App</Text>
              <Text style={styles.settingValue}>Tell friends about UmrahConnect</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C9A84C" />
          </TouchableOpacity>

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
  // Full screen cream background
  screen: { flex: 1, backgroundColor: "#F5F0E8" },
  // Navy header
  header: { backgroundColor: "#1E3A5F", padding: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  // Back button
  backBtn: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, padding: 8 },
  // Header title
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },

  // White card section
  section: { backgroundColor: "#fff", marginHorizontal: 16, marginTop: 16, borderRadius: 14, padding: 18, borderWidth: 0.5, borderColor: "#E0D9CE" },
  // Section title
  sectionTitle: { fontSize: 13, fontWeight: "600", color: "#888", marginBottom: 14, textTransform: "uppercase", letterSpacing: 0.5 },

  // Each setting row
  settingRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: "#E0D9CE" },
  // Colored icon circle
  settingIcon: { width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  // Text info
  settingInfo: { flex: 1 },
  // Setting name
  settingLabel: { fontSize: 15, color: "#1E3A5F", fontWeight: "500" },
  // Setting current value
  settingValue: { fontSize: 12, color: "#888", marginTop: 2 },

  // Coming soon badge
  comingSoonBadge: { backgroundColor: "#F5F0E8", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  comingSoonText: { fontSize: 11, color: "#C9A84C", fontWeight: "600" },

  // Version info at bottom
  versionBox: { alignItems: "center", marginTop: 24 },
  versionText: { fontSize: 13, color: "#888" },
  versionSub: { fontSize: 12, color: "#C9A84C", marginTop: 4 },
})