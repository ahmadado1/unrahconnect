// Navigation
import { useRouter } from "expo-router";
// Status bar
import { useTheme } from "@/context/themeContext";
import { StatusBar } from "expo-status-bar";
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
  const { isDark, toggleTheme, theme } = useTheme()
  const [notifications, setNotifications] = useState(true)

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: theme.header }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Preferences section */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Preferences</Text>

          {/* Language */}
          <TouchableOpacity style={[styles.settingRow, { borderBottomColor: theme.border }]}>
            <View style={[styles.settingIcon, { backgroundColor: "#1E3A5F" }]}>
              <Ionicons name="language" size={18} color="#fff" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>Language</Text>
              <Text style={[styles.settingValue, { color: theme.textSecondary }]}>English</Text>
            </View>
            <View style={[styles.comingSoonBadge, { backgroundColor: theme.inputBg }]}>
              <Text style={styles.comingSoonText}>Soon</Text>
            </View>
          </TouchableOpacity>

          {/* Notifications toggle */}
          <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
            <View style={[styles.settingIcon, { backgroundColor: "#C9A84C" }]}>
              <Ionicons name="notifications" size={18} color="#fff" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>Notifications</Text>
              <Text style={[styles.settingValue, { color: theme.textSecondary }]}>Receive app updates</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: "#E0D9CE", true: "#1E3A5F" }}
              thumbColor={notifications ? "#C9A84C" : "#fff"}
            />
          </View>

          {/* Dark mode toggle */}
          <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
            <View style={[styles.settingIcon, { backgroundColor: "#2C5F8A" }]}>
              <Ionicons name="moon" size={18} color="#fff" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>Dark Mode</Text>
              <Text style={[styles.settingValue, { color: theme.textSecondary }]}>
                {isDark ? "Dark theme on" : "Light theme on"}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: "#E0D9CE", true: "#1E3A5F" }}
              thumbColor={isDark ? "#C9A84C" : "#fff"}
            />
          </View>

        </View>

        {/* Legal section */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Legal</Text>

          {/* Privacy Policy */}
          <TouchableOpacity style={[styles.settingRow, { borderBottomColor: theme.border }]} onPress={() => router.push("/privacy")}>
            <View style={[styles.settingIcon, { backgroundColor: "#1B4332" }]}>
              <Ionicons name="shield-checkmark" size={18} color="#fff" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.gold} />
          </TouchableOpacity>

          {/* Terms of Service */}
          <TouchableOpacity style={[styles.settingRow, { borderBottomColor: theme.border }]} onPress={() => router.push("/terms")}>
            <View style={[styles.settingIcon, { backgroundColor: "#1B4332" }]}>
              <Ionicons name="document-text" size={18} color="#fff" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>Terms of Service</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.gold} />
          </TouchableOpacity>

        </View>

        {/* App section */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>App</Text>

          {/* Rate the app */}
          <TouchableOpacity style={[styles.settingRow, { borderBottomColor: theme.border }]}>
            <View style={[styles.settingIcon, { backgroundColor: "#C9A84C" }]}>
              <Ionicons name="star" size={18} color="#1E3A5F" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>Rate UmrahConnect</Text>
              <Text style={[styles.settingValue, { color: theme.textSecondary }]}>Share your feedback</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.gold} />
          </TouchableOpacity>

          {/* Share app */}
          <TouchableOpacity style={[styles.settingRow, { borderBottomColor: theme.border }]} onPress={() => Share.share({ message: "Check out UmrahConnect — the complete Umrah & Hajj companion app! 🕋🌙" })}>
            <View style={[styles.settingIcon, { backgroundColor: "#2C5F8A" }]}>
              <Ionicons name="share-social" size={18} color="#fff" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>Share App</Text>
              <Text style={[styles.settingValue, { color: theme.textSecondary }]}>Tell friends about UmrahConnect</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.gold} />
          </TouchableOpacity>

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
  section: { marginHorizontal: 16, marginTop: 16, borderRadius: 14, padding: 18, borderWidth: 0.5 },
  sectionTitle: { fontSize: 13, fontWeight: "600", marginBottom: 14, textTransform: "uppercase", letterSpacing: 0.5 },
  settingRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 0.5 },
  settingIcon: { width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: "500" },
  settingValue: { fontSize: 12, marginTop: 2 },
  comingSoonBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  comingSoonText: { fontSize: 11, color: "#C9A84C", fontWeight: "600" },
  versionBox: { alignItems: "center", marginTop: 24 },
  versionText: { fontSize: 13 },
  versionSub: { fontSize: 12, color: "#C9A84C", marginTop: 4 },
})