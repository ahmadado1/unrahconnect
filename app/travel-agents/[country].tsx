import { useTheme } from "@/context/themeContext"
import {
  getAgentCountForCountry,
  getAgentsForCountry,
  getTravelAgentCountry,
  TRAVEL_AGENT_CONTACT_EMAIL,
  type TravelAgent,
} from "@/lib/travelAgents"
import { Ionicons } from "@expo/vector-icons"
import { useLocalSearchParams, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"

function AgentCard({ agent, onPress }: { agent: TravelAgent; onPress: () => void }) {
  const { theme } = useTheme()

  return (
    <TouchableOpacity
      style={[styles.agentCard, { backgroundColor: theme.card, borderColor: theme.border }]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{agent.agencyName.charAt(0)}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <View style={styles.nameRow}>
          <Text style={[styles.agencyName, { color: theme.text }]} numberOfLines={2}>
            {agent.agencyName}
          </Text>
          {agent.featured ? (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredText}>Featured</Text>
            </View>
          ) : null}
        </View>

        <Text style={[styles.city, { color: theme.textSecondary }]}>{agent.city}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaIcon}>📍</Text>
          <Text style={[styles.metaText, { color: theme.textSecondary }]} numberOfLines={2}>
            {agent.address}
          </Text>
        </View>

        {agent.phone ? (
          <View style={styles.metaRow}>
            <Text style={styles.metaIcon}>📞</Text>
            <Text style={[styles.metaText, { color: theme.text }]}>{agent.phone}</Text>
          </View>
        ) : null}
      </View>

      <Ionicons name="chevron-forward" size={18} color={GOLD} />
    </TouchableOpacity>
  )
}

export default function CountryAgentsScreen() {
  const { country: countryParam } = useLocalSearchParams<{ country: string }>()
  const router = useRouter()
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const { t } = useTranslation()
  const [query, setQuery] = useState("")
  const country = getTravelAgentCountry(countryParam)

  const agents = useMemo(
    () => (country && !country.comingSoon ? getAgentsForCountry(country.id) : []),
    [country]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return agents
    return agents.filter(
      a =>
        a.agencyName.toLowerCase().includes(q) ||
        a.city.toLowerCase().includes(q) ||
        a.address.toLowerCase().includes(q)
    )
  }, [agents, query])

  if (!country) {
    return (
      <View style={[styles.screen, { backgroundColor: theme.background }]}>
        <StatusBar style="light" />
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Travel Agents</Text>
        </View>
        <View style={styles.emptyWrap}>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Country not found</Text>
        </View>
      </View>
    )
  }

  if (country.comingSoon) {
    return (
      <View style={[styles.screen, { backgroundColor: theme.background }]}>
        <StatusBar style="light" />
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {country.flag} {country.name}
          </Text>
        </View>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyEmoji}>🤝</Text>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            {t("noAgentsYet", {
              defaultValue: "No agents listed yet for this country.",
            })}
          </Text>
          <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
            {t("areYouAnAgent", {
              defaultValue: "Are you an agent? Contact us to get listed.",
            })}
          </Text>
          <TouchableOpacity
            style={styles.emailBtn}
            onPress={() => Linking.openURL(`mailto:${TRAVEL_AGENT_CONTACT_EMAIL}`)}
          >
            <Ionicons name="mail-outline" size={16} color={NAVY} />
            <Text style={styles.emailBtnText}>{TRAVEL_AGENT_CONTACT_EMAIL}</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const count = getAgentCountForCountry(country.id)

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {country.flag} {country.name}
        </Text>
        <Text style={styles.headerSub}>
          {count}+ agents listed
        </Text>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color="rgba(255,255,255,0.55)" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name or city"
            placeholderTextColor="rgba(255,255,255,0.45)"
            style={styles.searchInput}
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={[styles.noteCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Ionicons name="mail-outline" size={18} color={GOLD} />
          <Text style={[styles.noteText, { color: theme.textSecondary }]}>
            {t("wantAgencyListed", {
              defaultValue:
                "Want your agency listed here? Contact us at ahmadado6002@gmail.com",
            })}
          </Text>
        </View>

        {filtered.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No agents match your search</Text>
          </View>
        ) : (
          filtered.map(agent => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onPress={() => router.push(`/travel-agent-detail/${agent.id}` as any)}
            />
          ))
        )}

        <View style={[styles.footerNote, { borderColor: theme.border }]}>
          <Text style={[styles.footerTitle, { color: theme.text }]}>
            Is your agency not listed? Contact us:
          </Text>
          <TouchableOpacity onPress={() => Linking.openURL(`mailto:${TRAVEL_AGENT_CONTACT_EMAIL}`)}>
            <Text style={styles.footerEmail}>{TRAVEL_AGENT_CONTACT_EMAIL}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    backgroundColor: NAVY,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  headerTitle: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  headerSub: { color: GOLD, fontSize: 13, marginTop: 4 },
  searchBar: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, color: "#fff", fontSize: 14, padding: 0 },
  content: { padding: 16 },
  noteCard: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    padding: 14,
    borderRadius: 14,
    borderWidth: 0.5,
    marginBottom: 14,
  },
  noteText: { flex: 1, fontSize: 13, lineHeight: 19 },
  agentCard: {
    borderRadius: 14,
    borderWidth: 0.5,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: NAVY,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: GOLD, fontSize: 18, fontWeight: "700" },
  nameRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  agencyName: { flex: 1, fontSize: 14, fontWeight: "700" },
  featuredBadge: {
    backgroundColor: GOLD,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  featuredText: { color: NAVY, fontSize: 10, fontWeight: "800" },
  city: { fontSize: 12, fontWeight: "600", marginTop: 2 },
  metaRow: { flexDirection: "row", alignItems: "flex-start", gap: 4, marginTop: 4 },
  metaIcon: { fontSize: 12, marginTop: 1 },
  metaText: { flex: 1, fontSize: 12, lineHeight: 17 },
  emptyWrap: { alignItems: "center", padding: 32 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "700", textAlign: "center" },
  emptySub: { fontSize: 13, textAlign: "center", marginTop: 8, lineHeight: 19 },
  emailBtn: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: GOLD,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  emailBtnText: { color: NAVY, fontWeight: "700", fontSize: 13 },
  footerNote: {
    marginTop: 10,
    paddingTop: 18,
    borderTopWidth: 0.5,
    alignItems: "center",
  },
  footerTitle: { fontSize: 13, fontWeight: "600", textAlign: "center" },
  footerEmail: { color: GOLD, fontSize: 14, fontWeight: "700", marginTop: 6 },
})
