import { useTheme } from "@/context/themeContext"
import { Ionicons } from "@expo/vector-icons"
import { useLocalSearchParams, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useState } from "react"
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps"
import { useSafeAreaInsets } from "react-native-safe-area-context"


// ─── GATES DATA ───────────────────────────────────────────────────────────────

const HARAM_GATES = [
    {
      id: "fahd",
      number: "1",
      name: "King Fahd Gate",
      arabic: "باب الملك فهد",
      description: "Main entrance, ground floor. Leads directly towards Kaaba.",
      lat: 21.4228,
      lng: 39.8260,
      special: true, // closest to Kaaba
    },
    {
      id: "abdulaziz",
      number: "2",
      name: "King Abdul Aziz Gate",
      arabic: "باب الملك عبدالعزيز",
      description: "Northern entrance. Access to Zamzam Well area.",
      lat: 21.4232,
      lng: 39.8255,
      special: false,
    },
    {
      id: "umrah",
      number: "20",
      name: "Umrah Gate",
      arabic: "باب العمرة",
      description: "Popular gate for those performing Umrah. Women's section nearby.",
      lat: 21.4219,
      lng: 39.8271,
      special: false,
    },
    {
      id: "safa",
      number: "11",
      name: "Safa Gate",
      arabic: "باب الصفا",
      description: "Leads directly to Safa mountain — start of Sa'i walk.",
      lat: 21.4214,
      lng: 39.8267,
      special: false,
    },
    {
      id: "marwah",
      number: "19",
      name: "Marwah Gate",
      arabic: "باب المروة",
      description: "Leads to Marwah mountain — end of Sa'i walk.",
      lat: 21.4223,
      lng: 39.8275,
      special: false,
    },
    {
      id: "ajyad",
      number: "5",
      name: "Ajyad Gate",
      arabic: "باب أجياد",
      description: "Southern entrance near Makkah Clock Tower hotels.",
      lat: 21.4208,
      lng: 39.8260,
      special: false,
    },
    {
      id: "salam",
      number: "16",
      name: "Bab Al-Salam",
      arabic: "باب السلام",
      description: "Historic gate — Prophet ﷺ entered through this gate.",
      lat: 21.4231,
      lng: 39.8268,
      special: true,
    },
  ]
  
  const SITE_INFO: Record<string, {
    name: string
    arabic: string
    emoji: string
    description: string
    lat: number
    lng: number
    hasGates: boolean
    details: string[]
  }> = {
    haram: {
      name: "Masjid Al-Haram",
      arabic: "المسجد الحرام",
      emoji: "🕋",
      description: "The Grand Mosque in Makkah is the holiest site in Islam. It surrounds the Kaaba — the direction Muslims face in prayer worldwide.",
      lat: 21.4225,
      lng: 39.8262,
      hasGates: true,
      details: [
        "Home to the Holy Kaaba",
        "Zamzam Well is inside",
        "Safa and Marwah hills are within",
        "Can hold 2.5 million worshippers",
        "Open 24 hours during Hajj season",
      ]
    },
    nabawi: {
      name: "Masjid Nabawi",
      arabic: "المسجد النبوي",
      emoji: "🕌",
      description: "The Prophet's Mosque in Madinah was built by Prophet Muhammad ﷺ. His tomb is located here — the second holiest site in Islam.",
      lat: 24.4672,
      lng: 39.6111,
      hasGates: true,
      details: [
        "Tomb of Prophet Muhammad ﷺ",
        "Al-Rawdah Al-Sharifah — special area",
        "Originally built by the Prophet ﷺ",
        "Green dome marks the Prophet's tomb",
        "Prayer here equals 1000 prayers elsewhere",
      ]
    },
    mina: {
      name: "Mina",
      arabic: "منى",
      emoji: "⛺",
      description: "A valley near Makkah where pilgrims spend several nights during Hajj. Known as the City of Tents — over 100,000 tents house pilgrims.",
      lat: 21.4133,
      lng: 39.8930,
      hasGates: false,
      details: [
        "Pilgrims stay 8th–13th Dhul Hijjah",
        "Jamarat Bridge — stoning of the devil",
        "Over 100,000 air-conditioned tents",
        "Animal sacrifice performed here",
        "Largest tent city in the world",
      ]
    },
    arafah: {
      name: "Mount Arafah",
      arabic: "جبل عرفات",
      emoji: "⛰️",
      description: "Standing at Arafah on 9th Dhul Hijjah is the most important pillar of Hajj. The Prophet ﷺ delivered his farewell sermon here.",
      lat: 21.3549,
      lng: 39.9845,
      hasGates: false,
      details: [
        "Standing here is the heart of Hajj",
        "9th Dhul Hijjah — Day of Arafah",
        "Jabal Al-Rahmah — Mount of Mercy",
        "Farewell sermon location",
        "Hajj is invalid without this standing",
      ]
    },
    zamzam: {
      name: "Zamzam Well",
      arabic: "بئر زمزم",
      emoji: "💧",
      description: "The sacred well inside Masjid Al-Haram. Water miraculously appeared for Hajar and Ismail. Has been flowing for over 4000 years.",
      lat: 21.4228,
      lng: 39.8261,
      hasGates: false,
      details: [
        "Located 20m east of Kaaba",
        "Over 4000 years old",
        "Appeared for Hajar and Ismail",
        "Scientifically proven pure water",
        "Drinking while standing is Sunnah",
      ]
    },
    safa: {
      name: "Safa & Marwah",
      arabic: "الصفا والمروة",
      emoji: "🚶",
      description: "Two hills inside Masjid Al-Haram where pilgrims perform Sa'i — walking 7 times between them, following Hajar's search for water.",
      lat: 21.4221,
      lng: 39.8268,
      hasGates: false,
      details: [
        "Sa'i — walking 7 times between hills",
        "Follows Hajar's search for water",
        "Safa is starting point, Marwah is end",
        "Now enclosed inside the mosque",
        "Required for both Umrah and Hajj",
      ]
    },
  }


  export default function SiteDetailScreen() {
    const { site } = useLocalSearchParams<{ site: string }>()
    const { theme } = useTheme()
    const insets = useSafeAreaInsets()
    const router = useRouter()
    const [showMap, setShowMap] = useState(false)

    const info = SITE_INFO[site]
    if (!info) return null

    const navigateTo = (lat: number, lng: number, label: string) => {
        Linking.openURL(`https://maps.google.com/?q=${lat},${lng}(${encodeURIComponent(label)})`)
      }

      return (
        <View style={[styles.screen, { backgroundColor: theme.background }]}>
          <StatusBar style="light" />
      
          {/* Header */}
          <View style={[styles.header, { paddingTop: insets.top }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>{info.name}</Text>
              <Text style={styles.headerArabic}>{info.arabic}</Text>
            </View>
            <Text style={styles.emoji}>{info.emoji}</Text>
          </View>
      
          <ScrollView showsVerticalScrollIndicator={false}>
      
            {/* Description */}
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.description, { color: theme.text }]}>{info.description}</Text>
            </View>
      
            {/* Key facts */}
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Key Facts</Text>
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              {info.details.map((detail, i) => (
                <View key={i} style={[styles.factRow, { borderBottomColor: theme.border, borderBottomWidth: i < info.details.length - 1 ? 0.5 : 0 }]}>
                  <View style={styles.factDot} />
                  <Text style={[styles.factText, { color: theme.text }]}>{detail}</Text>
                </View>
              ))}
            </View>
      
            {/* Show on Map button */}
            <TouchableOpacity
              style={[styles.navBtn, { backgroundColor: "#1E3A5F" }]}
              onPress={() => setShowMap(!showMap)}
            >
              <Ionicons name={showMap ? "map" : "map-outline"} size={18} color="#C9A84C" />
              <Text style={[styles.navBtnText, { color: "#C9A84C" }]}>
                {showMap ? "Hide Map" : "Show on Map"}
              </Text>
            </TouchableOpacity>
      
            {/* Map — only visible when showMap is true */}
            {showMap && (
              <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={{
                  latitude: info.lat,
                  longitude: info.lng,
                  latitudeDelta: 0.008,
                  longitudeDelta: 0.008,
                }}
                showsUserLocation
              >
                <Marker
                  coordinate={{ latitude: info.lat, longitude: info.lng }}
                  title={info.name}
                  pinColor="#C9A84C"
                />
                {site === "haram" && HARAM_GATES.map(gate => (
                  <Marker
                    key={gate.id}
                    coordinate={{ latitude: gate.lat, longitude: gate.lng }}
                    title={gate.name}
                    description={gate.description}
                    onPress={() => navigateTo(gate.lat, gate.lng, gate.name)}
                  />
                ))}
              </MapView>
            )}
      
            {/* Navigate button */}
            <TouchableOpacity
              style={styles.navBtn}
              onPress={() => navigateTo(info.lat, info.lng, info.name)}
            >
              <Ionicons name="navigate" size={18} color="#1E3A5F" />
              <Text style={styles.navBtnText}>Navigate to {info.name}</Text>
            </TouchableOpacity>
      
            {/* Gates — only for Haram */}
            {info.hasGates && site === "haram" && (
              <>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Main Gates</Text>
                <Text style={[styles.sectionSub, { color: theme.textSecondary }]}>
                  Tap a gate to navigate directly to it
                </Text>
                {HARAM_GATES.map(gate => (
                  <TouchableOpacity
                    key={gate.id}
                    style={[styles.gateCard, { backgroundColor: theme.card, borderColor: gate.special ? "#C9A84C" : theme.border }]}
                    onPress={() => navigateTo(gate.lat, gate.lng, gate.name)}
                  >
                    <View style={styles.gateLeft}>
                      <View style={[styles.gateNum, { backgroundColor: gate.special ? "#C9A84C" : "#1E3A5F" }]}>
                        <Text style={[styles.gateNumText, { color: gate.special ? "#1E3A5F" : "#C9A84C" }]}>{gate.number}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.gateNameRow}>
                          <Text style={[styles.gateName, { color: theme.text }]}>{gate.name}</Text>
                          {gate.special && (
                            <View style={styles.specialBadge}>
                              <Text style={styles.specialBadgeText}>Notable</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.gateArabic}>{gate.arabic}</Text>
                        <Text style={[styles.gateDesc, { color: theme.textSecondary }]}>{gate.description}</Text>
                      </View>
                    </View>
                    <Ionicons name="navigate-outline" size={20} color="#C9A84C" />
                  </TouchableOpacity>
                ))}
              </>
            )}
      
            <View style={{ height: 100 }} />
          </ScrollView>
        </View>
      )
}

const styles = StyleSheet.create({
    screen: { flex: 1 },
    header: { backgroundColor: "#1E3A5F", padding: 20, paddingBottom: 16, flexDirection: "row", alignItems: "center", gap: 12 },
    backBtn: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, padding: 6 },
    headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
    headerArabic: { color: "#C9A84C", fontSize: 13, marginTop: 2 },
    emoji: { fontSize: 36 },
    card: { marginHorizontal: 16, marginTop: 12, borderRadius: 14, padding: 16, borderWidth: 0.5 },
    description: { fontSize: 14, lineHeight: 22 },
    sectionTitle: { fontSize: 17, fontWeight: "bold", marginHorizontal: 16, marginTop: 20, marginBottom: 4 },
    sectionSub: { fontSize: 12, marginHorizontal: 16, marginBottom: 8 },
    factRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 10 },
    factDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#C9A84C", marginTop: 6, flexShrink: 0 },
    factText: { fontSize: 13, lineHeight: 20, flex: 1 },
    navBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#C9A84C", margin: 16, borderRadius: 25, padding: 14 },
    navBtnText: { color: "#1E3A5F", fontSize: 15, fontWeight: "bold" },
    gateCard: { marginHorizontal: 16, marginBottom: 10, borderRadius: 12, padding: 14, borderWidth: 0.5, flexDirection: "row", alignItems: "center", gap: 10 },
    gateLeft: { flex: 1, flexDirection: "row", gap: 12, alignItems: "flex-start" },
    gateNum: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", flexShrink: 0 },
    gateNumText: { fontSize: 13, fontWeight: "bold" },
    gateNameRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
    gateName: { fontSize: 14, fontWeight: "600" },
    gateArabic: { fontSize: 13, color: "#C9A84C", marginTop: 2 },
    gateDesc: { fontSize: 12, lineHeight: 18, marginTop: 4 },
    specialBadge: { backgroundColor: "rgba(201,168,76,0.2)", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
    specialBadgeText: { fontSize: 10, color: "#C9A84C", fontWeight: "600" },
    map: { height: 250, marginHorizontal: 16, borderRadius: 12, marginBottom: 8 },
  })