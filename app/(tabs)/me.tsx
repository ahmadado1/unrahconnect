import { useTheme } from "@/context/themeContext";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { Href, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type MenuItem = {
  icon: keyof typeof Ionicons.glyphMap
  labelKey: string
  route?: Href
  action?: () => void
  danger?: boolean
}

export default function MeScreen() {
  const router = useRouter()
  const { theme } = useTheme()
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
  }, [])

  const fullName = user?.user_metadata?.full_name || t("pilgrim")

  const menuItems: MenuItem[] = [
    { icon: "person-outline", labelKey: "profile", route: "/profile" },
    { icon: "heart-outline", labelKey: "favorites", route: "/favorites" },
    { icon: "settings-outline", labelKey: "settings", route: "/settings" },
    { icon: "information-circle-outline", labelKey: "aboutUs", route: "/about" },
    { icon: "call-outline", labelKey: "contactUs", route: "/contact" },
    {
      icon: "log-out-outline",
      labelKey: "logout",
      danger: true,
      action: async () => { await supabase.auth.signOut() },
    },
  ]

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{fullName[0]?.toUpperCase() || "?"}</Text>
        </View>
        <Text style={styles.userName}>{fullName}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={[styles.menuSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.labelKey}
              style={[
                styles.menuItem,
                index < menuItems.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: 0.5 },
              ]}
              onPress={() => {
                if (item.action) item.action()
                else if (item.route) router.push(item.route)
              }}
            >
              <Ionicons name={item.icon} size={22} color={item.danger ? "#E24B4A" : theme.text} />
              <Text style={[styles.menuText, { color: item.danger ? "#E24B4A" : theme.text }]}>
                {t(item.labelKey)}
              </Text>
              {!item.danger && <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />}
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    backgroundColor: "#1E3A5F", alignItems: "center",
    paddingBottom: 28, paddingHorizontal: 20,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "#C9A84C", alignItems: "center", justifyContent: "center",
    marginTop: 16, marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: "bold", color: "#1E3A5F" },
  userName: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  userEmail: { color: "rgba(255,255,255,0.6)", fontSize: 13, marginTop: 4 },
  content: { padding: 16 },
  menuSection: { borderRadius: 14, borderWidth: 0.5, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16 },
  menuText: { flex: 1, fontSize: 15, fontWeight: "500" },
})
