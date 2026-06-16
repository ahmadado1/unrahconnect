import { useTheme } from "@/context/themeContext"
import { Ionicons } from "@expo/vector-icons"
import { useLocalSearchParams, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps"
import { useSafeAreaInsets } from "react-native-safe-area-context"


const HARAM_GATES = [
  {
    id: "fahd",
    number: "1",
    nameKey: "gateFahdName",
    arabic: "باب الملك فهد",
    descriptionKey: "gateFahdDesc",
    lat: 21.4228,
    lng: 39.8260,
    special: true,
  },
  {
    id: "abdulaziz",
    number: "2",
    nameKey: "gateAbdulazizName",
    arabic: "باب الملك عبدالعزيز",
    descriptionKey: "gateAbdulazizDesc",
    lat: 21.4232,
    lng: 39.8255,
    special: false,
  },
  {
    id: "umrah",
    number: "20",
    nameKey: "gateUmrahName",
    arabic: "باب العمرة",
    descriptionKey: "gateUmrahDesc",
    lat: 21.4219,
    lng: 39.8271,
    special: false,
  },
  {
    id: "safa",
    number: "11",
    nameKey: "gateSafaName",
    arabic: "باب الصفا",
    descriptionKey: "gateSafaDesc",
    lat: 21.4214,
    lng: 39.8267,
    special: false,
  },
  {
    id: "marwah",
    number: "19",
    nameKey: "gateMarwahName",
    arabic: "باب المروة",
    descriptionKey: "gateMarwahDesc",
    lat: 21.4223,
    lng: 39.8275,
    special: false,
  },
  {
    id: "ajyad",
    number: "5",
    nameKey: "gateAjyadName",
    arabic: "باب أجياد",
    descriptionKey: "gateAjyadDesc",
    lat: 21.4208,
    lng: 39.8260,
    special: false,
  },
  {
    id: "salam",
    number: "16",
    nameKey: "gateSalamName",
    arabic: "باب السلام",
    descriptionKey: "gateSalamDesc",
    lat: 21.4231,
    lng: 39.8268,
    special: true,
  },
] as const

const HOSPITALS = [
  {
    id: "abdulaziz",
    nameKey: "hospitalAbdulazizName",
    arabic: "مستشفى الملك عبدالعزيز",
    locationKey: "hospitalAbdulazizLocation",
    erGateKey: "hospitalAbdulazizEr",
    mainGateKey: "hospitalAbdulazizMain",
    lat: 21.4308,
    lng: 39.8436,
    city: "makkah",
  },
  {
    id: "noor",
    nameKey: "hospitalNoorName",
    arabic: "مستشفى النور التخصصي",
    locationKey: "hospitalNoorLocation",
    erGateKey: "hospitalNoorEr",
    mainGateKey: "hospitalNoorMain",
    lat: 21.3892,
    lng: 39.8579,
    city: "makkah",
  },
  {
    id: "faisal",
    nameKey: "hospitalFaisalName",
    arabic: "مستشفى الملك فيصل",
    locationKey: "hospitalFaisalLocation",
    erGateKey: "hospitalFaisalEr",
    mainGateKey: "hospitalFaisalMain",
    lat: 21.4156,
    lng: 39.8234,
    city: "makkah",
  },
  {
    id: "fahd-madinah",
    nameKey: "hospitalFahdMadinahName",
    arabic: "مستشفى الملك فهد",
    locationKey: "hospitalFahdMadinahLocation",
    erGateKey: "hospitalFahdMadinahEr",
    mainGateKey: "hospitalFahdMadinahMain",
    lat: 24.4889,
    lng: 39.6289,
    city: "madinah",
  },
] as const

const WRISTBAND_TIPS = [
  "wristbandTip1",
  "wristbandTip2",
  "wristbandTip3",
  "wristbandTip4",
  "wristbandTip5",
  "wristbandTip6",
] as const

const SITE_INFO: Record<string, {
  nameKey: string
  arabic: string
  emoji: string
  descriptionKey: string
  lat: number
  lng: number
  hasGates: boolean
  detailKeys: readonly string[]
}> = {
  haram: {
    nameKey: "masjidAlHaram",
    arabic: "المسجد الحرام",
    emoji: "🕋",
    descriptionKey: "siteHaramDesc",
    lat: 21.4225,
    lng: 39.8262,
    hasGates: true,
    detailKeys: ["siteHaramDetail1", "siteHaramDetail2", "siteHaramDetail3", "siteHaramDetail4", "siteHaramDetail5"],
  },
  nabawi: {
    nameKey: "masjidNabawi",
    arabic: "المسجد النبوي",
    emoji: "🕌",
    descriptionKey: "siteNabawiDesc",
    lat: 24.4672,
    lng: 39.6111,
    hasGates: true,
    detailKeys: ["siteNabawiDetail1", "siteNabawiDetail2", "siteNabawiDetail3", "siteNabawiDetail4", "siteNabawiDetail5"],
  },
  mina: {
    nameKey: "mina",
    arabic: "منى",
    emoji: "⛺",
    descriptionKey: "siteMinaDesc",
    lat: 21.4133,
    lng: 39.8930,
    hasGates: false,
    detailKeys: ["siteMinaDetail1", "siteMinaDetail2", "siteMinaDetail3", "siteMinaDetail4", "siteMinaDetail5"],
  },
  arafah: {
    nameKey: "arafah",
    arabic: "جبل عرفات",
    emoji: "⛰️",
    descriptionKey: "siteArafahDesc",
    lat: 21.3549,
    lng: 39.9845,
    hasGates: false,
    detailKeys: ["siteArafahDetail1", "siteArafahDetail2", "siteArafahDetail3", "siteArafahDetail4", "siteArafahDetail5"],
  },
  zamzam: {
    nameKey: "zamzamWell",
    arabic: "بئر زمزم",
    emoji: "💧",
    descriptionKey: "siteZamzamDesc",
    lat: 21.4228,
    lng: 39.8261,
    hasGates: false,
    detailKeys: ["siteZamzamDetail1", "siteZamzamDetail2", "siteZamzamDetail3", "siteZamzamDetail4", "siteZamzamDetail5"],
  },
  safa: {
    nameKey: "safaMarwah",
    arabic: "الصفا والمروة",
    emoji: "🚶",
    descriptionKey: "siteSafaDesc",
    lat: 21.4221,
    lng: 39.8268,
    hasGates: false,
    detailKeys: ["siteSafaDetail1", "siteSafaDetail2", "siteSafaDetail3", "siteSafaDetail4", "siteSafaDetail5"],
  },
  "hospital-makkah": {
    nameKey: "siteHospitalsTitle",
    arabic: "مستشفيات مكة والمدينة",
    emoji: "🏥",
    descriptionKey: "siteHospitalsDesc",
    lat: 21.4225,
    lng: 39.8262,
    hasGates: false,
    detailKeys: ["siteHospitalsDetail1", "siteHospitalsDetail2", "siteHospitalsDetail3", "siteHospitalsDetail4", "siteHospitalsDetail5"],
  },
  "lost-found": {
    nameKey: "lostAndFound",
    arabic: "مركز المفقودات",
    emoji: "🔍",
    descriptionKey: "siteLostFoundDesc",
    lat: 21.4225,
    lng: 39.8262,
    hasGates: false,
    detailKeys: ["siteLostFoundDetail1", "siteLostFoundDetail2", "siteLostFoundDetail3", "siteLostFoundDetail4", "siteLostFoundDetail5", "siteLostFoundDetail6", "siteLostFoundDetail7"],
  },
}

export default function SiteDetailScreen() {
  const { site } = useLocalSearchParams<{ site: string }>()
  const { theme } = useTheme()
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [showMap, setShowMap] = useState(false)

  const info = SITE_INFO[site]
  if (!info) return null

  const siteName = t(info.nameKey)

  const navigateTo = (lat: number, lng: number, label: string) => {
    Linking.openURL(`https://maps.google.com/?q=${lat},${lng}(${encodeURIComponent(label)})`)
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{siteName}</Text>
          <Text style={styles.headerArabic}>{info.arabic}</Text>
        </View>
        <Text style={styles.emoji}>{info.emoji}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.description, { color: theme.text }]}>{t(info.descriptionKey)}</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("keyFacts")}</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {info.detailKeys.map((detailKey, i) => (
            <View key={detailKey} style={[styles.factRow, { borderBottomColor: theme.border, borderBottomWidth: i < info.detailKeys.length - 1 ? 0.5 : 0 }]}>
              <View style={styles.factDot} />
              <Text style={[styles.factText, { color: theme.text }]}>{t(detailKey)}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.navBtn, { backgroundColor: "#1E3A5F" }]}
          onPress={() => setShowMap(!showMap)}
        >
          <Ionicons name={showMap ? "map" : "map-outline"} size={18} color="#C9A84C" />
          <Text style={[styles.navBtnText, { color: "#C9A84C" }]}>
            {showMap ? t("hideMap") : t("showOnMap")}
          </Text>
        </TouchableOpacity>

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
              title={siteName}
              pinColor="#C9A84C"
            />
            {site === "haram" && HARAM_GATES.map(gate => (
              <Marker
                key={gate.id}
                coordinate={{ latitude: gate.lat, longitude: gate.lng }}
                title={t(gate.nameKey)}
                description={t(gate.descriptionKey)}
                onPress={() => navigateTo(gate.lat, gate.lng, t(gate.nameKey))}
              />
            ))}
          </MapView>
        )}

        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => navigateTo(info.lat, info.lng, siteName)}
        >
          <Ionicons name="navigate" size={18} color="#1E3A5F" />
          <Text style={styles.navBtnText}>{t("navigateToSite", { name: siteName })}</Text>
        </TouchableOpacity>

        {info.hasGates && site === "haram" && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("mainGates")}</Text>
            <Text style={[styles.sectionSub, { color: theme.textSecondary }]}>
              {t("gatesTip")}
            </Text>
            {HARAM_GATES.map(gate => (
              <TouchableOpacity
                key={gate.id}
                style={[styles.gateCard, { backgroundColor: theme.card, borderColor: gate.special ? "#C9A84C" : theme.border }]}
                onPress={() => navigateTo(gate.lat, gate.lng, t(gate.nameKey))}
              >
                <View style={styles.gateLeft}>
                  <View style={[styles.gateNum, { backgroundColor: gate.special ? "#C9A84C" : "#1E3A5F" }]}>
                    <Text style={[styles.gateNumText, { color: gate.special ? "#1E3A5F" : "#C9A84C" }]}>{gate.number}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.gateNameRow}>
                      <Text style={[styles.gateName, { color: theme.text }]}>{t(gate.nameKey)}</Text>
                      {gate.special && (
                        <View style={styles.specialBadge}>
                          <Text style={styles.specialBadgeText}>{t("notable")}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.gateArabic}>{gate.arabic}</Text>
                    <Text style={[styles.gateDesc, { color: theme.textSecondary }]}>{t(gate.descriptionKey)}</Text>
                  </View>
                </View>
                <Ionicons name="navigate-outline" size={20} color="#C9A84C" />
              </TouchableOpacity>
            ))}
          </>
        )}

        {site === "hospital-makkah" && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("makkahHospitalsSection")}</Text>
            <Text style={[styles.sectionSub, { color: theme.textSecondary }]}>
              {t("hospitalsNavTip")}
            </Text>
            {HOSPITALS.filter(h => h.city === "makkah").map(hospital => (
              <View
                key={hospital.id}
                style={[styles.gateCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              >
                <View style={styles.gateLeft}>
                  <View style={[styles.gateNum, { backgroundColor: "#1E3A5F" }]}>
                    <Text style={{ fontSize: 16 }}>🏥</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.gateName, { color: theme.text }]}>{t(hospital.nameKey)}</Text>
                    <Text style={styles.gateArabic}>{hospital.arabic}</Text>
                    <Text style={[styles.gateDesc, { color: theme.textSecondary }]}>{t(hospital.locationKey)}</Text>
                    <Text style={[styles.gateDesc, { color: theme.textSecondary, marginTop: 4 }]}>
                      {t("erPrefix")} {t(hospital.erGateKey)}
                    </Text>
                    <Text style={[styles.gateDesc, { color: theme.textSecondary, marginTop: 2 }]}>
                      {t("mainPrefix")} {t(hospital.mainGateKey)}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => navigateTo(hospital.lat, hospital.lng, t(hospital.nameKey))}
                >
                  <Ionicons name="navigate-outline" size={20} color="#C9A84C" />
                </TouchableOpacity>
              </View>
            ))}

            <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 20 }]}>{t("madinahHospitalSection")}</Text>
            {HOSPITALS.filter(h => h.city === "madinah").map(hospital => (
              <View
                key={hospital.id}
                style={[styles.gateCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              >
                <View style={styles.gateLeft}>
                  <View style={[styles.gateNum, { backgroundColor: "#1E3A5F" }]}>
                    <Text style={{ fontSize: 16 }}>🏥</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.gateName, { color: theme.text }]}>{t(hospital.nameKey)}</Text>
                    <Text style={styles.gateArabic}>{hospital.arabic}</Text>
                    <Text style={[styles.gateDesc, { color: theme.textSecondary }]}>{t(hospital.locationKey)}</Text>
                    <Text style={[styles.gateDesc, { color: theme.textSecondary, marginTop: 4 }]}>
                      {t("erPrefix")} {t(hospital.erGateKey)}
                    </Text>
                    <Text style={[styles.gateDesc, { color: theme.textSecondary, marginTop: 2 }]}>
                      {t("mainPrefix")} {t(hospital.mainGateKey)}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => navigateTo(hospital.lat, hospital.lng, t(hospital.nameKey))}
                >
                  <Ionicons name="navigate-outline" size={20} color="#C9A84C" />
                </TouchableOpacity>
              </View>
            ))}

            <View style={[styles.card, { backgroundColor: "#1E3A5F", borderColor: "rgba(201,168,76,0.3)", marginTop: 16 }]}>
              <Text style={{ color: "#C9A84C", fontWeight: "bold", marginBottom: 8 }}>{t("emergencyNumbersTitle")}</Text>
              <Text style={{ color: "#fff", fontSize: 13, marginBottom: 4 }}>{t("ambulance911")}</Text>
              <Text style={{ color: "#fff", fontSize: 13, marginBottom: 4 }}>{t("police999")}</Text>
              <Text style={{ color: "#fff", fontSize: 13 }}>{t("civilDefense998")}</Text>
            </View>
          </>
        )}

        {site === "lost-found" && (
          <>
            <View style={[styles.card, { backgroundColor: "#C0392B", borderColor: "rgba(255,0,0,0.3)" }]}>
              <Text style={{ color: "#fff", fontSize: 14, marginBottom: 6 }}>{t("police999")}</Text>
              <Text style={{ color: "#fff", fontSize: 14, marginBottom: 6 }}>{t("ambulance997")}</Text>
              <Text style={{ color: "#fff", fontSize: 14, marginBottom: 6 }}>{t("civilDefense998")}</Text>
              <Text style={{ color: "#fff", fontSize: 14, marginBottom: 6 }}>{t("unifiedEmergency911")}</Text>
              <Text style={{ color: "#fff", fontSize: 14 }}>{t("ministryHajjHotline")}</Text>
            </View>

            <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("lostPilgrimCenters")}</Text>
            <Text style={[styles.sectionSub, { color: theme.textSecondary }]}>{t("lostCentersSub")}</Text>

            <TouchableOpacity
              style={[styles.gateCard, { backgroundColor: theme.card, borderColor: "#C9A84C" }]}
              onPress={() => navigateTo(21.4225, 39.8262, t("lostCenterMakkahNav"))}
            >
              <View style={styles.gateLeft}>
                <View style={[styles.gateNum, { backgroundColor: "#1E3A5F" }]}>
                  <Text style={{ fontSize: 16 }}>🕋</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.gateName, { color: theme.text }]}>{t("makkahLostCenterName")}</Text>
                  <Text style={styles.gateArabic}>مركز ضيوف الرحمن المفقودين</Text>
                  <Text style={[styles.gateDesc, { color: theme.textSecondary }]}>{t("makkahLostCenterLocation")}</Text>
                  <Text style={[styles.gateDesc, { color: theme.textSecondary, marginTop: 4 }]}>{t("makkahChildrenCenterDesc")}</Text>
                </View>
              </View>
              <Ionicons name="navigate-outline" size={20} color="#C9A84C" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.gateCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => navigateTo(24.4672, 39.6111, t("lostCenterMadinahNav"))}
            >
              <View style={styles.gateLeft}>
                <View style={[styles.gateNum, { backgroundColor: "#1E3A5F" }]}>
                  <Text style={{ fontSize: 16 }}>🕌</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.gateName, { color: theme.text }]}>{t("madinahLostCenterName")}</Text>
                  <Text style={styles.gateArabic}>مركز المفقودين المدينة المنورة</Text>
                  <Text style={[styles.gateDesc, { color: theme.textSecondary }]}>{t("madinahLostCenterLocation")}</Text>
                </View>
              </View>
              <Ionicons name="navigate-outline" size={20} color="#C9A84C" />
            </TouchableOpacity>

            <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("childSafetyTitle")}</Text>
            <View style={[styles.card, { backgroundColor: "#1E3A5F", borderColor: "rgba(201,168,76,0.3)" }]}>
              <Text style={{ color: "#C9A84C", fontWeight: "bold", fontSize: 14, marginBottom: 10 }}>{t("wristbandSystemTitle")}</Text>
              <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, lineHeight: 22 }}>
                {t("wristbandSystemDesc")}
              </Text>
            </View>

            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              {WRISTBAND_TIPS.map((tipKey, i) => (
                <View key={tipKey} style={[styles.factRow, { borderBottomColor: theme.border, borderBottomWidth: i < WRISTBAND_TIPS.length - 1 ? 0.5 : 0 }]}>
                  <View style={styles.factDot} />
                  <Text style={[styles.factText, { color: theme.text }]}>{t(tipKey)}</Text>
                </View>
              ))}
            </View>

            <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("wristbandRegistrationTitle")}</Text>
            <TouchableOpacity
              style={[styles.gateCard, { backgroundColor: theme.card, borderColor: "#C9A84C" }]}
              onPress={() => navigateTo(21.4228, 39.8260, t("wristbandRegGate1Nav"))}
            >
              <View style={styles.gateLeft}>
                <View style={[styles.gateNum, { backgroundColor: "#C9A84C" }]}>
                  <Text style={{ fontSize: 13, fontWeight: "bold", color: "#1E3A5F" }}>1</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.gateName, { color: theme.text }]}>{t("wristbandGate1Name")}</Text>
                  <Text style={[styles.gateDesc, { color: theme.textSecondary }]}>{t("wristbandGate1Desc")}</Text>
                </View>
              </View>
              <Ionicons name="navigate-outline" size={20} color="#C9A84C" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.gateCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => navigateTo(21.4214, 39.8267, t("wristbandRegGate79Nav"))}
            >
              <View style={styles.gateLeft}>
                <View style={[styles.gateNum, { backgroundColor: "#1E3A5F" }]}>
                  <Text style={{ color: "#C9A84C", fontSize: 12, fontWeight: "bold" }}>79</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.gateName, { color: theme.text }]}>{t("wristbandGate79Name")}</Text>
                  <Text style={[styles.gateDesc, { color: theme.textSecondary }]}>{t("wristbandGate79Desc")}</Text>
                </View>
              </View>
              <Ionicons name="navigate-outline" size={20} color="#C9A84C" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.gateCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => navigateTo(24.4672, 39.6111, t("wristbandRegMadinahNav"))}
            >
              <View style={styles.gateLeft}>
                <View style={[styles.gateNum, { backgroundColor: "#1E3A5F" }]}>
                  <Text style={{ fontSize: 16 }}>🕌</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.gateName, { color: theme.text }]}>{t("wristbandMadinahName")}</Text>
                  <Text style={[styles.gateDesc, { color: theme.textSecondary }]}>{t("wristbandMadinahDesc")}</Text>
                </View>
              </View>
              <Ionicons name="navigate-outline" size={20} color="#C9A84C" />
            </TouchableOpacity>
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
