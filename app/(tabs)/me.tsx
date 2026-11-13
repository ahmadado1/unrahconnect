import { getIonIconColor } from "@/components/AppIcon";
import AgentApplyBanner from "@/app/components/AgentApplyBanner"
import AgencyOverviewCard, { shareAgencyQr } from "@/app/components/AgencyOverviewCard"
import { getMyAgentProfile } from "@/lib/agents"
import { useTheme } from "@/context/themeContext";
import { getUserFast, supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { Href, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, View } from "react-native"
import TouchableOpacity from "@/app/components/AppPressable"
import { openStoreListing } from "@/lib/storeReviewPrompt"
import { GOLD, NAVY, tabScrollBottom, ui } from "@/lib/ui"
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePremium } from "@/lib/premium"

type MenuItem = {
  icon: keyof typeof Ionicons.glyphMap
  labelKey: string
  route?: Href
  action?: () => void
  danger?: boolean
  agentOnly?: boolean
  /** Hidden for agency accounts (e.g. Premium) */
  pilgrimOnly?: boolean
}

export default function MeScreen() {
  const router = useRouter()
  const { theme } = useTheme()
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    getUserFast().then(({ data: { user } }) => setUser(user))
  }, [])

  const premium = usePremium()
  const fullName = user?.user_metadata?.full_name || t("pilgrim")
  const isAgent = user?.user_metadata?.user_type === "agent"
  const agencyName = user?.user_metadata?.agency_name

  const menuItems: MenuItem[] = [
    { icon: "star-outline", labelKey: "pw_menu", route: "/premium", pilgrimOnly: true },
    { icon: "person-outline", labelKey: "profile", route: "/profile" },
    { icon: "heart-outline", labelKey: "favorites", route: "/favorites" },
    { icon: "map-outline", labelKey: "sgMenu", route: "/start-guide" },
    { icon: "notifications-outline", labelKey: "notifications", route: "/notifications" },
    { icon: "settings-outline", labelKey: "settings", route: "/settings" },
    { icon: "star-outline", labelKey: "rateApp", action: () => { void openStoreListing() } },
    { icon: "information-circle-outline", labelKey: "aboutUs", route: "/about" },
    { icon: "call-outline", labelKey: "contactUs", route: "/contact" },
    {
      icon: "log-out-outline",
      labelKey: "logout",
      danger: true,
      action: async () => {
        // Go to the login screen at once, then sign out (the server call can take a moment).
        router.replace("/auth/login" as any)
        await AsyncStorage.removeItem("cached_user").catch(() => {})
        await supabase.auth.signOut().catch(() => supabase.auth.signOut({ scope: "local" }))
      },
    },
  ]

  // Filter menu — agents see all, pilgrims don't see agentOnly items
  const visibleMenuItems = menuItems.filter(item => {
    if (item.agentOnly) return isAgent
    // Agencies don't see Premium
    if (item.pilgrimOnly) return !isAgent
    return true
  })

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={[styles.avatar, premium.isPremium && !premium.agency && styles.avatarPremium]}>
          <Text style={styles.avatarText}>{fullName[0]?.toUpperCase() || "?"}</Text>
        </View>
        <Text style={styles.userName}>{fullName}</Text>
        <Text style={styles.userEmail}>{user?.email || (user?.phone ? `+${String(user.phone).replace(/^\+/, "")}` : "")}</Text>

        {/* Premium badge (status only, no prices or links in the app) */}
        {premium.isPremium && !premium.agency && (
          <View style={styles.premiumBadge}>
            <Ionicons name="star" size={12} color="#1E3A5F" />
            <Text style={styles.premiumBadgeText}>{t("premiumBadge")}</Text>
          </View>
        )}

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

      <ScrollView keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: tabScrollBottom(insets.bottom) }]}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
      >

        {/* Agencies that haven't finished their application */}
        {isAgent ? <AgentApplyBanner style={{ marginBottom: 12 }} /> : null}

        {/* ─── My Agency (agencies only): numbers + one-tap actions first ─── */}
        {isAgent ? (
          <>
            <AgencyOverviewCard style={{ marginBottom: 12 }} />
            <View style={[styles.menuSection, { backgroundColor: theme.card, borderColor: theme.border, marginBottom: 16 }]}>
              {[
                { icon: "speedometer-outline" as const, label: t("agentDashboard"), onPress: () => router.push("/agent/dashboard" as any) },
                {
                  icon: "qr-code-outline" as const,
                  label: t("agencyShareQr"),
                  onPress: async () => {
                    const mine = await getMyAgentProfile().catch(() => null)
                    if (mine) await shareAgencyQr(mine)
                  },
                },
                { icon: "megaphone-outline" as const, label: t("agencyPostUpdate"), onPress: () => router.push("/agent/dashboard?focus=announce" as any) },
                {
                  icon: "eye-outline" as const,
                  label: t("agencyPublicProfile"),
                  onPress: async () => {
                    const mine = await getMyAgentProfile().catch(() => null)
                    if (mine) router.push(`/agent/${mine.id}` as any)
                  },
                },
              ].map((row, i, all) => (
                <TouchableOpacity
                  key={row.label}
                  style={[styles.menuItem, i < all.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: 0.5 }]}
                  onPress={row.onPress}
                >
                  <View style={[styles.menuIconBg, { backgroundColor: "rgba(201,168,76,0.15)" }]}>
                    <Ionicons name={row.icon} size={20} color="#C9A84C" />
                  </View>
                  <Text style={[styles.menuText, { color: theme.text }]}>{row.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>{t("agencyPersonal")}</Text>
          </>
        ) : null}

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
  premiumBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#C9A84C", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, marginTop: 8 },
  premiumBadgeText: { color: "#1E3A5F", fontSize: 12, fontWeight: "bold" },
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
  avatarPremium: { borderWidth: 3, borderColor: "#F3E3B5" },
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
  sectionLabel: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 },
})