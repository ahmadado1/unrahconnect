import { AnimatedHeroIcon } from "@/components/AnimatedHeroIcon"
import { AppIcon, ICON_GOLD } from "@/components/AppIcon"
import { useTheme } from "@/context/themeContext"
import { Ionicons } from "@expo/vector-icons"
import { useLocalSearchParams, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useEffect, useState } from "react"
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
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
    created_at: string
  }


  export default function AgentProfileScreen() {
    const { id } = useLocalSearchParams<{ id: string }>()
    const router = useRouter()
    const insets = useSafeAreaInsets()
    const { theme } = useTheme()
    const [agent, setAgent] = useState<Agent | null>(null)
    const [loading, setLoading] = useState(true)


    useEffect(() => {
        fetchAgent()
      }, [id])
    
      const fetchAgent = async () => {
        try {
          const { data } = await supabase
            .from("agents")
            .select("*")
            .eq("id", id)
            .single()
          if (data) setAgent(data)
        } catch (e) {
          console.log("Fetch agent error:", e)
        } finally {
          setLoading(false)
        }
      }
    
      const callAgent = () => {
        if (agent?.phone) Linking.openURL(`tel:${agent.phone}`)
      }

      const whatsappAgent = () => {
        if (agent?.phone) {
          const phone = agent.phone.replace(/\D/g, "")
          Linking.openURL(`https://wa.me/${phone}`)
        }
      }
    
      const emailAgent = () => {
        if (agent?.email) Linking.openURL(`mailto:${agent.email}`)
      }
    
      if (loading) {
        return (
          <View style={[styles.screen, { backgroundColor: theme.background, alignItems: "center", justifyContent: "center" }]}>
            <ActivityIndicator color="#C9A84C" size="large" />
          </View>
        )
      }
    
      if (!agent) return (
        <View style={[styles.screen, { backgroundColor: theme.background }]}>
          <StatusBar style="light" />
          <View style={[styles.header, { paddingTop: insets.top }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Agency Profile</Text>
            <View style={{ width: 36 }} />
          </View>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 32 }}>
            <AnimatedHeroIcon name="business" size={56} accent="gold" style={{ marginBottom: 8 }} />
            <Text style={{ fontSize: 20, fontWeight: "bold", color: theme.text }}>Agent Not Found</Text>
            <Text style={{ fontSize: 14, color: theme.textSecondary, textAlign: "center", lineHeight: 22 }}>
              This agency profile doesn't exist or may have been removed.
            </Text>
            <TouchableOpacity
              style={{ backgroundColor: "#1E3A5F", borderRadius: 25, paddingVertical: 14, paddingHorizontal: 32, marginTop: 8 }}
              onPress={() => router.back()}
            >
              <Text style={{ color: "#C9A84C", fontWeight: "bold", fontSize: 15 }}>Browse Other Agents</Text>
            </TouchableOpacity>
          </View>
        </View>
      )

    return (
        <View style={[styles.screen, { backgroundColor: theme.background }]}>
          <StatusBar style="light" />
    
          {/* Header */}
          <View style={[styles.header, { paddingTop: insets.top }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Agency Profile</Text>
            <View style={{ width: 36 }} />
          </View>
    
          <ScrollView showsVerticalScrollIndicator={false}>

                {/* Profile hero */}
            <View style={styles.hero}>
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                {agent.agency_name?.charAt(0)?.toUpperCase()}
                </Text>
            </View>
            <Text style={styles.agencyName}>{agent.agency_name}</Text>
            <Text style={styles.ownerName}>{agent.owner_name}</Text>

            {/* Verified + plan badges */}
                <View style={styles.badgesRow}>
                    {agent.verified && (
                    <View style={styles.verifiedBadge}>
                        <Ionicons name="checkmark-circle" size={14} color="#1E3A5F" />
                        <Text style={styles.verifiedText}>Verified</Text>
                    </View>
                    )}
                    <View style={styles.planBadge}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      {agent.plan === "pro" ? (
                        <>
                          <AppIcon name="star" size={12} color="#C9A84C" />
                          <Text style={styles.planText}>Pro Agent</Text>
                        </>
                      ) : (
                        <Text style={styles.planText}>
                          {agent.plan === "basic" ? "Basic" : "Trial"}
                        </Text>
                      )}
                    </View>
                    </View>
                </View>
                </View>

            {/* Stats */}
                <View style={styles.statsRow}>
                <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.statNum, { color: theme.text }]}>{agent.pilgrims_managed || 0}</Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Pilgrims</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.statNum, { color: theme.text }]}>{agent.years_experience || 0}</Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Years exp.</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.statNum, { color: theme.text }]}>{agent.country}</Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Based in</Text>
                </View>
                </View>

                {/* Bio */}
                {agent.bio && (
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>About</Text>
                    <Text style={[styles.bioText, { color: theme.textSecondary }]}>{agent.bio}</Text>
                </View>
                )}

                {/* Details */}
                    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Details</Text>
                    <View style={styles.detailRow}>
                        <Ionicons name="location-outline" size={16} color="#C9A84C" />
                        <Text style={[styles.detailText, { color: theme.text }]}>{agent.country}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Ionicons name="flag-outline" size={16} color="#C9A84C" />
                        <Text style={[styles.detailText, { color: theme.text }]}>{agent.nationality}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Ionicons name="calendar-outline" size={16} color="#C9A84C" />
                        <Text style={[styles.detailText, { color: theme.text }]}>
                        Member since {new Date(agent.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                        </Text>
                    </View>
                    </View>

                    {/* Services */}
                    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Services Offered</Text>
                    {[
                        { icon: "airplane-outline", label: "Flight Packages" },
                        { icon: "bed-outline", label: "Hotel Bookings" },
                        { icon: "document-text-outline", label: "Visa Assistance" },
                        { icon: "people-outline", label: "Group Tours" },
                        { icon: "shield-checkmark-outline", label: "Full Umrah Package" },
                    ].map((service, i) => (
                        <View key={i} style={styles.detailRow}>
                        <Ionicons name={service.icon as any} size={16} color="#C9A84C" />
                        <Text style={[styles.detailText, { color: theme.text }]}>{service.label}</Text>
                        </View>
                    ))}
                    </View>

                    {/* Contact buttons */}
                    <View style={styles.contactSection}>
                    <Text style={[styles.cardTitle, { color: theme.text, marginHorizontal: 16, marginBottom: 12 }]}>
                        Contact Agent
                    </Text>

                    <TouchableOpacity style={styles.whatsappBtn} onPress={whatsappAgent}>
                        <Ionicons name="logo-whatsapp" size={22} color="#fff" />
                        <Text style={styles.whatsappBtnText}>WhatsApp</Text>
                    </TouchableOpacity>

                    <View style={styles.contactRow}>
                        <TouchableOpacity
                        style={[styles.contactBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                        onPress={callAgent}
                        >
                        <Ionicons name="call-outline" size={20} color="#C9A84C" />
                        <Text style={[styles.contactBtnText, { color: theme.text }]}>Call</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                        style={[styles.contactBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                        onPress={emailAgent}
                        >
                    <Ionicons name="mail-outline" size={20} color="#C9A84C" />
                    <Text style={[styles.contactBtnText, { color: theme.text }]}>Email</Text>
                    </TouchableOpacity>
                </View>
                </View>

            <View style={{ height: 100 }} />
        </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
    screen: { flex: 1 },
    header: { backgroundColor: "#1E3A5F", padding: 20, paddingBottom: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    backBtn: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, padding: 6 },
    headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
    hero: { backgroundColor: "#1E3A5F", alignItems: "center", paddingVertical: 24, paddingHorizontal: 20 },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#C9A84C", alignItems: "center", justifyContent: "center", marginBottom: 12 },
    avatarText: { fontSize: 32, fontWeight: "bold", color: "#1E3A5F" },
    agencyName: { fontSize: 22, fontWeight: "bold", color: "#fff", marginBottom: 4 },
    ownerName: { fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 12 },
    badgesRow: { flexDirection: "row", gap: 8 },
    verifiedBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#C9A84C", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
    verifiedText: { fontSize: 11, fontWeight: "bold", color: "#1E3A5F" },
    planBadge: { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
    planText: { fontSize: 11, color: "#C9A84C", fontWeight: "600" },
    statsRow: { flexDirection: "row", gap: 10, padding: 16 },
    statCard: { flex: 1, borderRadius: 12, padding: 12, alignItems: "center", borderWidth: 0.5 },
    statNum: { fontSize: 16, fontWeight: "bold", marginBottom: 2 },
    statLabel: { fontSize: 10 },
    card: { marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 16, borderWidth: 0.5 },
    cardTitle: { fontSize: 15, fontWeight: "bold", marginBottom: 12 },
    bioText: { fontSize: 13, lineHeight: 20 },
    detailRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: "rgba(0,0,0,0.05)" },
    detailText: { fontSize: 14 },
    contactSection: { marginBottom: 12 },
    whatsappBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#25D366", marginHorizontal: 16, borderRadius: 25, padding: 14, marginBottom: 10 },
    whatsappBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
    contactRow: { flexDirection: "row", gap: 10, marginHorizontal: 16 },
    contactBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 25, padding: 14, borderWidth: 0.5 },
    contactBtnText: { fontSize: 15, fontWeight: "600" },
  })