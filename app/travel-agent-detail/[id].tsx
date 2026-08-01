import { AppIcon } from "@/components/AppIcon"
import { useTheme } from "@/context/themeContext"
import {
  GET_FEATURED_URL,
  getTravelAgentCountry,
  loadAgentById,
  toTelHref,
  toWhatsAppNumber,
  TRAVEL_AGENT_CONTACT_EMAIL,
  type TravelAgent,
} from "@/lib/travelAgents"
import { Ionicons } from "@expo/vector-icons"
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"

export default function TravelAgentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const { t } = useTranslation()
  const [agent, setAgent] = useState<TravelAgent | null>(null)
  const [loading, setLoading] = useState(true)

  useFocusEffect(
    useCallback(() => {
      const key = Array.isArray(id) ? id[0] : id
      if (!key) {
        setAgent(null)
        setLoading(false)
        return
      }

      let active = true
      setLoading(true)

      void loadAgentById(key, cached => {
        if (!active) return
        setAgent(cached)
        if (cached) setLoading(false)
      }).then(fresh => {
        if (!active) return
        setAgent(fresh)
        setLoading(false)
      })

      return () => {
        active = false
      }
    }, [id])
  )

  const country = agent ? getTravelAgentCountry(agent.countryId) : null

  if (loading && !agent) {
    return (
      <View style={[styles.notFound, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={GOLD} />
      </View>
    )
  }

  if (!agent) {
    return (
      <View style={[styles.notFound, { backgroundColor: theme.background }]}>
        <Text style={[styles.notFoundText, { color: theme.text }]}>Agent not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>{t("goBack", { defaultValue: "Go back" })}</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const call = (phone: string | null) => {
    const href = toTelHref(phone)
    if (href) Linking.openURL(href)
  }

  const whatsapp = () => {
    const digits = toWhatsAppNumber(agent.whatsapp || agent.phone)
    if (digits) Linking.openURL(`https://wa.me/${digits}`)
  }

  const email = () => {
    if (agent.email) Linking.openURL(`mailto:${agent.email}`)
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>

          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoLetter}>{agent.agencyName.charAt(0)}</Text>
          </View>

          <Text style={styles.heroName}>{agent.agencyName}</Text>
          {agent.featured ? (
            <View style={styles.featuredPill}>
              <Ionicons name="star" size={12} color={NAVY} />
              <Text style={styles.featuredPillText}>Featured Agent</Text>
            </View>
          ) : null}
          <Text style={styles.heroMeta}>
            {country ? country.name : ""} · {agent.city}
          </Text>
        </View>

        <View style={styles.content}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Location</Text>
          <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.infoRow}>
              <AppIcon name="location" size={18} color={GOLD} />
              <Text style={[styles.infoText, { color: theme.text }]}>
                {agent.address || agent.city}
              </Text>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>Contact</Text>
          <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {agent.phone ? (
              <TouchableOpacity style={styles.infoRow} onPress={() => call(agent.phone)}>
                <AppIcon name="call" size={18} color={GOLD} />
                <Text style={[styles.infoText, { color: theme.text }]}>{agent.phone}</Text>
              </TouchableOpacity>
            ) : (
              <Text style={[styles.infoText, { color: theme.textSecondary }]}>No phone listed</Text>
            )}
            {agent.phone2 ? (
              <TouchableOpacity
                style={[styles.infoRow, { marginTop: 12 }]}
                onPress={() => call(agent.phone2 ?? null)}
              >
                <AppIcon name="call" size={18} color={GOLD} />
                <Text style={[styles.infoText, { color: theme.text }]}>{agent.phone2}</Text>
              </TouchableOpacity>
            ) : null}
            {agent.email ? (
              <TouchableOpacity style={[styles.infoRow, { marginTop: 12 }]} onPress={email}>
                <AppIcon name="mail" size={18} color={GOLD} />
                <Text style={[styles.infoText, { color: theme.text }]}>{agent.email}</Text>
              </TouchableOpacity>
            ) : null}
            {agent.website ? (
              <TouchableOpacity
                style={[styles.infoRow, { marginTop: 12 }]}
                onPress={() => Linking.openURL(agent.website!)}
              >
                <AppIcon name="globe" size={18} color={GOLD} />
                <Text style={[styles.infoText, { color: theme.text }]}>{agent.website}</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>Services</Text>
          <View style={styles.tags}>
            {agent.services.map(service => (
              <View key={service} style={styles.tag}>
                <Ionicons name="checkmark-circle" size={14} color={GOLD} />
                <Text style={[styles.tagText, { color: theme.text }]}>{service}</Text>
              </View>
            ))}
          </View>

          {!agent.featured ? (
            <TouchableOpacity
              style={styles.getFeaturedBtn}
              onPress={() => Linking.openURL(GET_FEATURED_URL)}
            >
              <Text style={styles.getFeaturedText}>Get Featured</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.featureLink}
              onPress={() => Linking.openURL(`mailto:${TRAVEL_AGENT_CONTACT_EMAIL}`)}
            >
              <Text style={styles.featureLinkText}>Want your agency listed? Contact us</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <View
        style={[
          styles.actionBar,
          {
            backgroundColor: theme.card,
            borderTopColor: theme.border,
            paddingBottom: Math.max(insets.bottom, 14),
          },
        ]}
      >
        {agent.phone ? (
          <TouchableOpacity style={styles.barCall} onPress={() => call(agent.phone)}>
            <Ionicons name="call" size={16} color="#fff" />
            <Text style={styles.barCallText}>Call</Text>
          </TouchableOpacity>
        ) : null}
        {agent.phone || agent.whatsapp ? (
          <TouchableOpacity style={styles.barWa} onPress={whatsapp}>
            <AppIcon name="whatsapp" size={16} color="#fff" />
            <Text style={styles.barCallText}>WhatsApp</Text>
          </TouchableOpacity>
        ) : null}
        {agent.email ? (
          <TouchableOpacity style={styles.barEmail} onPress={email}>
            <Ionicons name="mail-outline" size={16} color={NAVY} />
            <Text style={styles.barEmailText}>Email</Text>
          </TouchableOpacity>
        ) : null}
        {agent.website ? (
          <TouchableOpacity
            style={styles.barEmail}
            onPress={() => Linking.openURL(agent.website!)}
          >
            <Ionicons name="globe-outline" size={16} color={NAVY} />
            <Text style={styles.barEmailText}>Website</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  notFoundText: { fontSize: 18 },
  backLink: { color: GOLD, marginTop: 10 },
  hero: {
    backgroundColor: NAVY,
    paddingHorizontal: 20,
    paddingBottom: 28,
    alignItems: "center",
  },
  backBtn: {
    alignSelf: "flex-start",
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logoPlaceholder: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "rgba(201,168,76,0.2)",
    borderWidth: 1.5,
    borderColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  logoLetter: { color: GOLD, fontSize: 34, fontWeight: "800" },
  heroName: { color: "#fff", fontSize: 22, fontWeight: "bold", textAlign: "center" },
  featuredPill: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: GOLD,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  featuredPillText: { color: NAVY, fontSize: 12, fontWeight: "800" },
  heroMeta: { color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 10 },
  content: { padding: 20, paddingBottom: 110 },
  sectionTitle: { fontSize: 17, fontWeight: "bold", marginBottom: 10, marginTop: 6 },
  infoCard: { borderRadius: 14, borderWidth: 0.5, padding: 14, marginBottom: 18 },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  infoText: { flex: 1, fontSize: 14, lineHeight: 20 },
  tags: { gap: 8 },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(201,168,76,0.1)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tagText: { fontSize: 14, fontWeight: "600" },
  getFeaturedBtn: {
    marginTop: 22,
    alignSelf: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: GOLD,
  },
  getFeaturedText: { color: GOLD, fontSize: 13, fontWeight: "700" },
  featureLink: { marginTop: 22, alignItems: "center" },
  featureLinkText: { color: GOLD, fontSize: 14, fontWeight: "700" },
  actionBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 0.5,
  },
  barCall: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: NAVY,
    borderRadius: 12,
    paddingVertical: 13,
  },
  barWa: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#25D366",
    borderRadius: 12,
    paddingVertical: 13,
  },
  barEmail: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: GOLD,
    borderRadius: 12,
    paddingVertical: 13,
  },
  barCallText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  barEmailText: { color: NAVY, fontWeight: "700", fontSize: 13 },
})
