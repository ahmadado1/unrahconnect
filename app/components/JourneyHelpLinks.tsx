import { AppIcon, AppIconKey } from "@/components/AppIcon"
import { useTheme } from "@/context/themeContext"
import { Ionicons } from "@expo/vector-icons"
import { Href, useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native"

const GOLD = "#C9A84C"
const SAPTCO_URL = "https://www.saptco.com.sa"

export type JourneyLink = {
  id: string
  icon: AppIconKey
  titleKey: string
  subKey: string
  route?: Href
  url?: string
}

const UMRAH_LINKS: Record<string, JourneyLink[]> = {
  "1": [
    {
      id: "map-nabawi",
      icon: "mosque",
      titleKey: "journeyLinkNabawiMap",
      subKey: "journeyLinkNabawiMapSub",
      route: "/maps/nabawi",
    },
    {
      id: "train-madinah",
      icon: "train",
      titleKey: "journeyLinkMadinahTrain",
      subKey: "journeyLinkMadinahTrainSub",
      route: "/haramain/madinah",
    },
    {
      id: "train-makkah",
      icon: "train",
      titleKey: "journeyLinkMakkahTrain",
      subKey: "journeyLinkMakkahTrainSub",
      route: "/haramain/makkah",
    },
    {
      id: "bus",
      icon: "bus",
      titleKey: "journeyLinkBus",
      subKey: "journeyLinkBusSub",
      url: SAPTCO_URL,
    },
  ],
  "3": [
    {
      id: "map-haram",
      icon: "kaaba",
      titleKey: "journeyLinkHaramMap",
      subKey: "journeyLinkHaramMapSub",
      route: "/maps/haram",
    },
    {
      id: "train-makkah",
      icon: "train",
      titleKey: "journeyLinkMakkahTrain",
      subKey: "journeyLinkMakkahTrainSub",
      route: "/haramain/makkah",
    },
  ],
  "4": [
    {
      id: "map-haram",
      icon: "kaaba",
      titleKey: "journeyLinkHaramMap",
      subKey: "journeyLinkHaramMapSub",
      route: "/maps/haram",
    },
  ],
  "5": [
    {
      id: "map-safa",
      icon: "walk",
      titleKey: "journeyLinkSafaMap",
      subKey: "journeyLinkSafaMapSub",
      route: "/maps/safa",
    },
  ],
  "7": [
    {
      id: "train-makkah",
      icon: "train",
      titleKey: "journeyLinkMakkahTrain",
      subKey: "journeyLinkMakkahTrainSub",
      route: "/haramain/makkah",
    },
    {
      id: "train-madinah",
      icon: "train",
      titleKey: "journeyLinkMadinahTrain",
      subKey: "journeyLinkMadinahTrainSub",
      route: "/haramain/madinah",
    },
    {
      id: "bus",
      icon: "bus",
      titleKey: "journeyLinkBus",
      subKey: "journeyLinkBusSub",
      url: SAPTCO_URL,
    },
    {
      id: "services",
      icon: "car",
      titleKey: "journeyLinkAllTransport",
      subKey: "journeyLinkAllTransportSub",
      route: "/(tabs)/services",
    },
  ],
}

const HAJJ_LINKS: Record<string, JourneyLink[]> = {
  "2": [
    {
      id: "map-haram",
      icon: "kaaba",
      titleKey: "journeyLinkHaramMap",
      subKey: "journeyLinkHaramMapSub",
      route: "/maps/haram",
    },
    {
      id: "train-makkah",
      icon: "train",
      titleKey: "journeyLinkMakkahTrain",
      subKey: "journeyLinkMakkahTrainSub",
      route: "/haramain/makkah",
    },
  ],
  "3": [
    {
      id: "map-mina",
      icon: "camp",
      titleKey: "journeyLinkMinaMap",
      subKey: "journeyLinkMinaMapSub",
      route: "/maps/mina",
    },
  ],
  "4": [
    {
      id: "map-arafah",
      icon: "mountain",
      titleKey: "journeyLinkArafahMap",
      subKey: "journeyLinkArafahMapSub",
      route: "/maps/arafah",
    },
  ],
  "5": [
    {
      id: "map-mina",
      icon: "camp",
      titleKey: "journeyLinkMinaMap",
      subKey: "journeyLinkMinaMapSub",
      route: "/maps/mina",
    },
  ],
  "6": [
    {
      id: "map-mina",
      icon: "camp",
      titleKey: "journeyLinkMinaMap",
      subKey: "journeyLinkMinaMapSub",
      route: "/maps/mina",
    },
  ],
  "8": [
    {
      id: "map-haram",
      icon: "kaaba",
      titleKey: "journeyLinkHaramMap",
      subKey: "journeyLinkHaramMapSub",
      route: "/maps/haram",
    },
  ],
  "9": [
    {
      id: "train-makkah",
      icon: "train",
      titleKey: "journeyLinkMakkahTrain",
      subKey: "journeyLinkMakkahTrainSub",
      route: "/haramain/makkah",
    },
    {
      id: "train-madinah",
      icon: "train",
      titleKey: "journeyLinkMadinahTrain",
      subKey: "journeyLinkMadinahTrainSub",
      route: "/haramain/madinah",
    },
    {
      id: "bus",
      icon: "bus",
      titleKey: "journeyLinkBus",
      subKey: "journeyLinkBusSub",
      url: SAPTCO_URL,
    },
    {
      id: "services",
      icon: "car",
      titleKey: "journeyLinkAllTransport",
      subKey: "journeyLinkAllTransportSub",
      route: "/(tabs)/services",
    },
  ],
}

type Props = {
  journey: "umrah" | "hajj"
  phaseId: string
}

export default function JourneyHelpLinks({ journey, phaseId }: Props) {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const router = useRouter()
  const links = (journey === "umrah" ? UMRAH_LINKS : HAJJ_LINKS)[phaseId]
  if (!links?.length) return null

  const titleKey =
    phaseId === "1" && journey === "umrah"
      ? "journeyHelpAfterMadinah"
      : phaseId === "7" || phaseId === "9"
        ? "journeyHelpLeaving"
        : "journeyHelpNearby"

  return (
    <View style={styles.wrap}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{t(titleKey)}</Text>
      <Text style={[styles.sectionSub, { color: theme.textSecondary }]}>
        {t(`${titleKey}Sub`)}
      </Text>

      {links.map(link => (
        <TouchableOpacity
          key={link.id}
          style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
          activeOpacity={0.85}
          onPress={() => {
            if (link.url) Linking.openURL(link.url)
            else if (link.route) router.push(link.route)
          }}
        >
          <View style={styles.iconWrap}>
            <AppIcon name={link.icon} size={22} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: theme.text }]}>{t(link.titleKey)}</Text>
            <Text style={[styles.sub, { color: theme.textSecondary }]}>{t(link.subKey)}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={GOLD} />
        </TouchableOpacity>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { marginTop: 4, marginBottom: 8 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 0.5,
    padding: 14,
    marginBottom: 10,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "rgba(201,168,76,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 15, fontWeight: "700" },
  sub: { fontSize: 12, marginTop: 2, lineHeight: 16 },
})
