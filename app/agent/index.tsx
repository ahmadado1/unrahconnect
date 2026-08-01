import { AnimatedHeroIcon } from "@/components/AnimatedHeroIcon"
import { AppIcon } from "@/components/AppIcon"
import { useTheme } from "@/context/themeContext"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useEffect, useState } from "react"
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { supabase } from "../../lib/supabase"

type Agent = {
    id: string
    agency_name: string
    owner_name: string
    phone: string
    email: string
    nationality: string
    country: string
    bio: string
    years_experience: number
    pilgrims_managed: number
    verified: boolean
    plan: string
  }


  export default function BrowseAgentsScreen() {
    const router = useRouter()
    const insets = useSafeAreaInsets()
    const { theme } = useTheme()
    const [agents, setAgents] = useState<Agent[]>([])
    const [filtered, setFiltered] = useState<Agent[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")

    useEffect(() => {
        fetchAgents()
      }, [])
    
      useEffect(() => {
        if (!search.trim()) {
          setFiltered(agents)
          return
        }
        const q = search.toLowerCase()
        setFiltered(agents.filter(a =>
          a.agency_name.toLowerCase().includes(q) ||
          a.country.toLowerCase().includes(q) ||
          a.nationality.toLowerCase().includes(q)
        ))
      }, [search, agents])

      const fetchAgents = async () => {
        try {
          const { data, error } = await supabase
            .from("agents")
            .select("*")
            .order("created_at", { ascending: false })
          if (data) {
            setAgents(data)
            setFiltered(data)
          }
        } catch (e) {
          console.log("Fetch agents error:", e)
        } finally {
          setLoading(false)
        }
      }
      

      const renderAgent = ({ item }: { item: Agent }) => (
        <TouchableOpacity
          style={[styles.agentCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => router.push(`/agent/${item.id}` as any)}
        >
          {/* Avatar */}
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.agency_name?.charAt(0)?.toUpperCase() || "A"}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
        {/* Agency name + verified badge */}
        <View style={styles.nameRow}>
          <Text style={[styles.agencyName, { color: theme.text }]}>{item.agency_name}</Text>
          {item.verified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#C9A84C" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
        </View>

        <Text style={[styles.ownerName, { color: theme.textSecondary }]}>{item.owner_name}</Text>

        {/* Country + nationality */}
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={12} color="#C9A84C" />
          <Text style={[styles.metaText, { color: theme.textSecondary }]}>{item.country}</Text>
          {item.pilgrims_managed > 0 && (
            <>
              <Text style={[styles.metaDot, { color: theme.textSecondary }]}>·</Text>
              <Ionicons name="people-outline" size={12} color="#C9A84C" />
              <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                {item.pilgrims_managed} pilgrims
              </Text>
            </>
          )}
        </View>

            {/* Plan badge */}
            <View style={styles.planBadge}>
            {item.plan === "pro" ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <AppIcon name="star" size={10} color="#C9A84C" />
                <Text style={styles.planText}>Pro</Text>
              </View>
            ) : (
              <Text style={styles.planText}>
                {item.plan === "basic" ? "Basic" : "Trial"}
              </Text>
            )}
            </View>
        </View>

        <Ionicons name="chevron-forward" size={20} color="#C9A84C" />
        </TouchableOpacity>
    )


    return (
        <View style={[styles.screen, { backgroundColor: theme.background }]}>
          <StatusBar style="light" />
    
          {/* Header */}
          <View style={[styles.header, { paddingTop: insets.top }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Find an Agent</Text>
              <Text style={styles.headerSub}>Browse verified travel agencies</Text>
            </View>
          </View>

          {/* Search */}
        <View style={[styles.searchBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="search" size={16} color={theme.textSecondary} />
            <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search by agency name or country..."
            placeholderTextColor={theme.textSecondary}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            />
            {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
            ) : null}
        </View>

        {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#C9A84C" size="large" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <AnimatedHeroIcon name="business" size={48} accent="gold" />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No agents found</Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            Be the first to register as a travel agent
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderAgent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  )
}


const styles = StyleSheet.create({
    screen: { flex: 1 },
    header: { backgroundColor: "#1E3A5F", padding: 20, paddingBottom: 16, flexDirection: "row", alignItems: "center", gap: 12 },
    backBtn: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, padding: 6 },
    headerTitle: { color: "#fff", fontSize: 20, fontWeight: "bold" },
    headerSub: { color: "#C9A84C", fontSize: 12, marginTop: 1 },
    searchBar: { flexDirection: "row", alignItems: "center", gap: 10, margin: 16, borderRadius: 12, padding: 12, borderWidth: 0.5 },
    searchInput: { flex: 1, fontSize: 14 },
    loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
    list: { padding: 16, gap: 12, paddingBottom: 100 },
    agentCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 16, borderWidth: 0.5 },
    avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#1E3A5F", alignItems: "center", justifyContent: "center", flexShrink: 0 },
    avatarText: { fontSize: 20, fontWeight: "bold", color: "#C9A84C" },
    nameRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
    agencyName: { fontSize: 15, fontWeight: "bold" },
    verifiedBadge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "rgba(201,168,76,0.15)", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
    verifiedText: { fontSize: 10, color: "#C9A84C", fontWeight: "600" },
    ownerName: { fontSize: 12, marginBottom: 4 },
    metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6 },
    metaText: { fontSize: 11 },
    metaDot: { fontSize: 11 },
    planBadge: { backgroundColor: "rgba(201,168,76,0.1)", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, alignSelf: "flex-start" },
    planText: { fontSize: 10, color: "#C9A84C", fontWeight: "600" },
    emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 32 },
    emptyTitle: { fontSize: 18, fontWeight: "bold" },
    emptyText: { fontSize: 14, textAlign: "center", color: "#888" },
  })
  