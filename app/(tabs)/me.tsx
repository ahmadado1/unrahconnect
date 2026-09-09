import { getIonIconColor } from "@/components/AppIcon";
import { useTheme } from "@/context/themeContext";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { Href, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, View } from "react-native"
import TouchableOpacity from "@/app/components/AppPressable"
import { GOLD, NAVY, tabScrollBottom, ui } from "@/lib/ui"
import { useSafeAreaInsets } from "react-native-safe-area-context";

type MenuItem = {
  icon: keyof typeof Ionicons.glyphMap
  labelKey: string
  route?: Href
  action?: () => void
  danger?: boolean
  agentOnly?: boolean
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
  const isAgent = user?.user_metadata?.user_type === "agent"
  const agencyName = user?.user_metadata?.agency_name

  const menuItems: MenuItem[] = [
    { icon: "person-outline", labelKey: "profile", route: "/profile" },
    { icon: "heart-outline", labelKey: "favorites", route: "/favorites" },
    { icon: "briefcase-outline", labelKey: "agentDashboard", route: "/agent/dashboard", agentOnly: true },
    { icon: "notifications-outline", labelKey: "notifications", route: "/notifications" },
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

  // Filter menu — agents see all, pilgrims don't see agentOnly items
  const visibleMenuItems = menuItems.filter(item => {
    if (item.agentOnly) return isAgent
    return true
  })

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{fullName[0]?.toUpperCase() || "?"}</Text>
        </View>
        <Text style={styles.userName}>{fullName}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>

        {/* Agent badge */}
        {isAgent && (
          <View style={styles.agentBadge}>
            <Ionicons name="briefcase-outline" size={12} color="#1E3A5F" />
            <Text style={styles.agentBadgeText}>
              {agencyName || "Travel Agent"}
            </Text>
          </View>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: tabScrollBottom(insets.bottom) }]}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
      >

        {/* Agent quick stats — only for agents */}
        {isAgent && (
          <TouchableOpacity
            style={styles.agentCard}
            onPress={() => router.push("/agent/dashboard" as any)}
          >
            <View style={styles.agentCardLeft}>
              <Text style={styles.agentCardTitle}>Agency Dashboard</Text>
              <Text style={styles.agentCardSub}>View clients, referral code & bookings</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C9A84C" />
          </TouchableOpacity>
        )}

        {/* Menu */}
        <View style={[styles.menuSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {visibleMenuItems.map((item, index) => (
            <TouchableOpacity
              key={item.labelKey}
              style={[
                styles.menuItem,
                index < visibleMenuItems.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: 0.5 },
              ]}
              onPress={() => {
                if (item.action) item.action()
                else if (item.route) router.push(item.route)
              }}
            >
              <View style={[
                styles.menuIconBg,
                { backgroundColor: `${getIonIconColor(item.icon)}18` },
              ]}>
                <Ionicons
                  name={item.icon}
                  size={20}
                  color={getIonIconColor(item.icon)}
                />
              </View>
              <Text style={[styles.menuText, { color: item.danger ? "#E24B4A" : theme.text }]}>
                {t(item.labelKey)}
              </Text>
              {!item.danger && <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    backgroundColor: NAVY, alignItems: "center",
    paddingBottom: 28, paddingHorizontal: 20,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: GOLD, alignItems: "center", justifyContent: "center",
    marginTop: 16, marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: "bold", color: NAVY },
  userName: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  userEmail: { color: "rgba(255,255,255,0.6)", fontSize: 13, marginTop: 4 },
  agentBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: GOLD, borderRadius: ui.radiusPill,
    paddingHorizontal: 12, paddingVertical: 5, marginTop: 10,
  },
  agentBadgeText: { fontSize: 12, fontWeight: "bold", color: NAVY },
  content: { padding: ui.space },
  agentCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: NAVY, borderRadius: ui.radius,
    padding: ui.cardPad, marginBottom: 16,
    borderWidth: 1, borderColor: "rgba(201,168,76,0.3)",
  },
  agentCardLeft: { flex: 1 },
  agentCardTitle: { color: GOLD, fontSize: 15, fontWeight: "bold", marginBottom: 3 },
  agentCardSub: { color: "rgba(255,255,255,0.6)", fontSize: 12 },
  menuSection: { borderRadius: ui.radius, borderWidth: ui.hairline, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 14, padding: ui.cardPad },
  menuIconBg: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  menuText: { flex: 1, fontSize: 15, fontWeight: "500" },
})