import { AnimatedHeroIcon } from "@/components/AnimatedHeroIcon"
import { AppIcon, ICON_NAVY } from "@/components/AppIcon"
import { useTheme } from "@/context/themeContext"
import {
  SEARCH_CATEGORY_COLORS,
  SEARCH_QUICK_CHIPS,
  SearchResult,
  buildSearchIndex,
  searchCatalog,
} from "@/lib/searchIndex"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
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

export default function SearchScreen() {
  const router = useRouter()
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const { t } = useTranslation()
  const [query, setQuery] = useState("")

  const allItems = useMemo(() => buildSearchIndex(t), [t])

  const results = useMemo(() => searchCatalog(allItems, query), [allItems, query])

  const grouped = useMemo(() => {
    // Preserve ranking order within each category (first occurrence order from scored list)
    const acc: Record<string, SearchResult[]> = {}
    for (const item of results) {
      if (!acc[item.category]) acc[item.category] = []
      acc[item.category].push(item)
    }
    return acc
  }, [results])

  // Category order follows best overall hit ranking
  const categoryOrder = useMemo(() => {
    const order: string[] = []
    for (const item of results) {
      if (!order.includes(item.category)) order.push(item.category)
    }
    return order
  }, [results])

  const handlePress = (item: SearchResult) => {
    if (item.action === "link") {
      Linking.openURL(item.target)
    } else {
      router.push(item.target as any)
    }
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color="rgba(255,255,255,0.5)" />
          <TextInput
            style={styles.searchInput}
            placeholder={t("searchSub", {
              defaultValue: "Hotels, Prophet, Qibla, Tawaf, Quran…",
            })}
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={query}
            onChangeText={setQuery}
            autoFocus
            autoCapitalize="none"
            returnKeyType="search"
          />
          {query ? (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {query.trim().length < 2 ? (
          <View style={styles.emptyState}>
            <AnimatedHeroIcon name="search" size={48} accent="navy" style={{ marginBottom: 16 }} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>{t("search")}</Text>
            <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
              Search anything in the app — hotels, Madinah ziyarat, Umrah steps, services, Quran,
              and more.
            </Text>

            <View style={styles.quickGrid}>
              {SEARCH_QUICK_CHIPS.map(cat => (
                <TouchableOpacity
                  key={cat.label}
                  style={[styles.quickCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                  onPress={() => setQuery(cat.q)}
                >
                  <AppIcon name={cat.icon} size={22} style={{ marginBottom: 6 }} />
                  <Text style={[styles.quickLabel, { color: theme.text }]}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : results.length === 0 ? (
          <View style={styles.emptyState}>
            <AnimatedHeroIcon name="sad" size={48} accent="navy" style={{ marginBottom: 16 }} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No results found</Text>
            <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
              Try "hotel", "muhammad", "qibla", "tawaf", "zamzam", or "prayer"
            </Text>
          </View>
        ) : (
          <View style={styles.results}>
            <Text style={[styles.resultsCount, { color: theme.textSecondary }]}>
              {results.length} results for "{query}"
            </Text>
            {categoryOrder.map(category => {
              const items = grouped[category] || []
              return (
                <View key={category} style={styles.group}>
                  <View style={styles.groupHeader}>
                    <View
                      style={[
                        styles.groupDot,
                        { backgroundColor: SEARCH_CATEGORY_COLORS[category] || "#888" },
                      ]}
                    />
                    <Text style={[styles.groupTitle, { color: theme.textSecondary }]}>
                      {category}
                    </Text>
                  </View>
                  {items.map(item => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.resultCard,
                        { backgroundColor: theme.card, borderColor: theme.border },
                      ]}
                      onPress={() => handlePress(item)}
                    >
                      <View
                        style={[
                          styles.resultIcon,
                          {
                            backgroundColor: `${SEARCH_CATEGORY_COLORS[item.category] || "#888"}15`,
                          },
                        ]}
                      >
                        {item.countryCode ? (
                          <View
                            style={[
                              styles.countryBadge,
                              { borderColor: SEARCH_CATEGORY_COLORS[item.category] },
                            ]}
                          >
                            <Text
                              style={[
                                styles.countryCode,
                                { color: SEARCH_CATEGORY_COLORS[item.category] },
                              ]}
                            >
                              {item.countryCode}
                            </Text>
                          </View>
                        ) : (
                          <AppIcon
                            name={item.icon}
                            size={20}
                            color={SEARCH_CATEGORY_COLORS[item.category] || ICON_NAVY}
                          />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.resultTitle, { color: theme.text }]}>{item.title}</Text>
                        <Text
                          style={[styles.resultSub, { color: theme.textSecondary }]}
                          numberOfLines={2}
                        >
                          {item.subtitle}
                        </Text>
                      </View>
                      <Ionicons
                        name={item.action === "link" ? "open-outline" : "chevron-forward"}
                        size={16}
                        color="#C9A84C"
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              )
            })}
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    backgroundColor: "#1E3A5F",
    padding: 16,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backBtn: { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 20, padding: 6 },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, color: "#fff", fontSize: 15 },

  emptyState: { alignItems: "center", paddingTop: 40, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  emptySub: { fontSize: 13, textAlign: "center", lineHeight: 20, marginBottom: 28 },

  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  quickCard: {
    width: "28%",
    minWidth: 96,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    borderWidth: 0.5,
  },
  quickLabel: { fontSize: 12, fontWeight: "600" },

  results: { padding: 16 },
  resultsCount: { fontSize: 12, marginBottom: 16, fontWeight: "500" },
  group: { marginBottom: 20 },
  groupHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  groupDot: { width: 8, height: 8, borderRadius: 4 },
  groupTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  resultCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 0.5,
    marginBottom: 8,
  },
  resultIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  countryBadge: {
    minWidth: 28,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  countryCode: { fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  resultTitle: { fontSize: 14, fontWeight: "600", marginBottom: 2 },
  resultSub: { fontSize: 12, lineHeight: 16 },
})
