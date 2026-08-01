import { useTheme } from "@/context/themeContext"
import {
  getAgentCountForCountry,
  getCachedAgents,
  prefetchTravelAgents,
  TRAVEL_AGENT_COUNTRIES,
} from "@/lib/travelAgents"
import { Ionicons } from "@expo/vector-icons"
import { useFocusEffect, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
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

export default function FindAgentCountriesScreen() {
  const router = useRouter()
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const { t } = useTranslation()
  const [query, setQuery] = useState("")
  const [counts, setCounts] = useState<Record<string, number>>({})

  useFocusEffect(
    useCallback(() => {
      let active = true

      const refreshCounts = async () => {
        const next: Record<string, number> = {}
        // Prefer cache for instant labels
        const cached = await getCachedAgents()
        for (const c of TRAVEL_AGENT_COUNTRIES) {
          if (c.comingSoon) {
            next[c.id] = 0
          } else if (cached.length) {
            next[c.id] = cached.filter(a => a.countryId === c.id).length
          } else {
            next[c.id] = await getAgentCountForCountry(c.id)
          }
        }
        if (active) setCounts(next)
      }

      void refreshCounts()
      void prefetchTravelAgents().then(() => {
        if (active) void refreshCounts()
      })

      return () => {
        active = false
      }
    }, [])
  )

  const filteredCountries = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return TRAVEL_AGENT_COUNTRIES
    return TRAVEL_AGENT_COUNTRIES.filter(country =>
      country.name.toLowerCase().includes(q)
    )
  }, [query])

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>
          {t("findAgent", { defaultValue: "Find an Agent" })}
        </Text>
        <Text style={styles.subtitle}>
          {t("travelAgentsSub", {
            defaultValue: "Find trusted Umrah & Hajj agents in your country",
          })}
        </Text>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color="rgba(255,255,255,0.55)" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search countries"
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
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          {t("selectCountry", { defaultValue: "Select Country" })}
        </Text>

        {filteredCountries.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              No countries match your search
            </Text>
          </View>
        ) : (
          filteredCountries.map(country => {
            const count = counts[country.id] ?? 0
            return (
              <TouchableOpacity
                key={country.id}
                style={[
                  styles.countryRow,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                  },
                ]}
                activeOpacity={0.88}
                onPress={() => router.push(`/travel-agents/${country.id}` as any)}
              >
                <View style={[styles.flagWrap, { backgroundColor: theme.background }]}>
                  <Text style={styles.flagEmoji}>{country.flag}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.countryName, { color: theme.text }]}>
                    {country.name}
                  </Text>
                  <Text style={styles.countryCount}>
                    {country.comingSoon
                      ? t("comingSoonLabel", { defaultValue: "Coming Soon" })
                      : count >= 40
                        ? "40+ agents"
                        : count > 0
                          ? `${count} agents`
                          : "View agents"}
                  </Text>
                </View>
                {country.comingSoon ? (
                  <View style={styles.soonTag}>
                    <Text style={styles.soonTagText}>Soon</Text>
                  </View>
                ) : (
                  <Ionicons name="chevron-forward" size={20} color={GOLD} />
                )}
              </TouchableOpacity>
            )
          })
        )}

        <View style={[styles.tipCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Ionicons name="information-circle-outline" size={20} color={GOLD} />
          <Text style={[styles.tipText, { color: theme.textSecondary }]}>
            Most countries now have agent directories. France and the UK are coming soon.
          </Text>
        </View>
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
    marginBottom: 14,
  },
  title: { color: "#fff", fontSize: 26, fontWeight: "bold" },
  subtitle: { color: GOLD, fontSize: 13, marginTop: 6, lineHeight: 18 },
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
  content: { padding: 16, paddingBottom: 40 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  countryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 0.5,
    padding: 14,
    marginBottom: 10,
  },
  flagWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "rgba(30,58,95,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  flagEmoji: { fontSize: 26, lineHeight: 32 },
  countryName: {
    fontSize: 15,
    fontWeight: "700",
  },
  countryCount: {
    color: GOLD,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 3,
  },
  soonTag: {
    backgroundColor: "rgba(0,0,0,0.06)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  soonTagText: { fontSize: 10, color: "#888", fontWeight: "700" },
  emptyWrap: { alignItems: "center", paddingVertical: 28 },
  emptyTitle: { fontSize: 15, fontWeight: "600" },
  tipCard: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 0.5,
    padding: 14,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  tipText: { flex: 1, fontSize: 13, lineHeight: 19 },
})
