import { AnimatedHeroIcon } from "@/components/AnimatedHeroIcon"
import { AppIcon } from "@/components/AppIcon"
import { useTheme } from "@/context/themeContext"
import {
  GET_FEATURED_URL,
  getTravelAgentCountry,
  groupAgentsByCity,
  loadAgentsForCountry,
  TRAVEL_AGENT_CONTACT_EMAIL,
  type TravelAgent,
} from "@/lib/travelAgents"
import { Ionicons } from "@expo/vector-icons"
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  ActivityIndicator,
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
    <View style={[styles.agentCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <TouchableOpacity style={styles.agentCardMain} onPress={onPress} activeOpacity={0.88}>
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

          {!!agent.address && (
            <View style={styles.metaRow}>
              <AppIcon name="location" size={14} color={GOLD} />
              <Text style={[styles.metaText, { color: theme.textSecondary }]} numberOfLines={2}>
                {agent.address}
              </Text>
            </View>
          )}

          {agent.phone ? (
            <View style={styles.metaRow}>
              <AppIcon name="call" size={14} color={GOLD} />
              <Text style={[styles.metaText, { color: theme.text }]}>{agent.phone}</Text>
            </View>
          ) : null}
        </View>

        <Ionicons name="chevron-forward" size={18} color={GOLD} />
      </TouchableOpacity>

      {!agent.featured ? (
        <TouchableOpacity
          style={styles.getFeaturedBtn}
          onPress={() => Linking.openURL(GET_FEATURED_URL)}
          activeOpacity={0.75}
        >
          <Text style={styles.getFeaturedText}>Get Featured</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

export default function CountryAgentsScreen() {
  const { country: countryParam } = useLocalSearchParams<{ country: string }>()
  const router = useRouter()
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const { t } = useTranslation()
  const [query, setQuery] = useState("")
  const [agents, setAgents] = useState<TravelAgent[]>([])
  const [loading, setLoading] = useState(true)
  const country = getTravelAgentCountry(countryParam)

  useFocusEffect(
    useCallback(() => {
      if (!country || country.comingSoon) {
        setAgents([])
        setLoading(false)
        return
      }

      let active = true
      setLoading(true)

      void loadAgentsForCountry(country.id, cached => {
        if (!active) return
        setAgents(cached)
        if (cached.length > 0) setLoading(false)
      }).then(fresh => {
        if (!active) return
        setAgents(fresh)
        setLoading(false)
      })

      return () => {
        active = false
      }
    }, [country])
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

  const cityGroups = useMemo(
    () => groupAgentsByCity(filtered, country?.id),
    [filtered, country?.id]
  )

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
          <Text style={styles.headerTitle}>{country.name}</Text>
        </View>
        <View style={styles.emptyWrap}>
          <AnimatedHeroIcon name="handshake" size={48} accent="gold" style={{ marginBottom: 12 }} />
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

  const count = agents.length

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{country.name}</Text>
        <Text style={styles.headerSub}>
          {count > 0 ? `${count} agents listed` : loading ? "Loading agents…" : "No agents listed"}
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

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.noteCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Ionicons name="mail-outline" size={18} color={GOLD} />
          <Text style={[styles.noteText, { color: theme.textSecondary }]}>
            {t("wantAgencyListed", {
              defaultValue:
                "Want your agency listed here? Contact us at infom@myumrahconnect.com",
            })}
          </Text>
        </View>

        {loading && agents.length === 0 ? (
          <View style={styles.emptyWrap}>
            <ActivityIndicator color={GOLD} />
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              {query.trim()
                ? "No agents match your search"
                : "No agents listed yet for this country."}
            </Text>
          </View>
        ) : (
          cityGroups.map(group => (
            <View key={group.city} style={styles.cityGroup}>
              {cityGroups.length > 1 || group.isFeaturedSection ? (
                <Text
                  style={[
                    styles.cityHeading,
                    { color: group.isFeaturedSection ? GOLD : theme.textSecondary },
                  ]}
                >
                  {group.city}
                </Text>
              ) : null}
              {group.agents.map(agent => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onPress={() => router.push(`/travel-agent-detail/${agent.id}` as any)}
                />
              ))}
            </View>
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
  cityGroup: { marginBottom: 6 },
  cityHeading: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: 8,
    marginTop: 6,
  },
  agentCard: {
    borderRadius: 14,
    borderWidth: 0.5,
    padding: 14,
    marginBottom: 10,
  },
  agentCardMain: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  getFeaturedBtn: {
    alignSelf: "flex-start",
    marginTop: 12,
    marginLeft: 58,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: GOLD,
  },
  getFeaturedText: {
    color: GOLD,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.2,
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
  metaText: { flex: 1, fontSize: 12, lineHeight: 17 },
  emptyWrap: { alignItems: "center", padding: 32 },
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
