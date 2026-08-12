import { useTheme } from "@/context/themeContext"
import { getMakkahPlace } from "@/lib/makkahPlaces"
import { Ionicons } from "@expo/vector-icons"
import { ResizeMode, Video } from "expo-av"
import { useLocalSearchParams, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useRef } from "react"
import { useTranslation } from "react-i18next"
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const VIDEOS = {
  "clock-tower-museum": require("../../assets/video/clock-tower-museum.mp4"),
} as const

function openMoreInfo(query: string) {
  const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`
  Linking.openURL(url)
}

function openDirections(lat: number, lng: number) {
  Linking.openURL(
    `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`,
  )
}

export default function MakkahPlaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { theme } = useTheme()
  const { t } = useTranslation()
  const videoRef = useRef<Video>(null)

  const place = getMakkahPlace(id || "")

  if (!place) {
    return (
      <View style={[styles.screen, { backgroundColor: theme.background, paddingTop: insets.top + 20 }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 20 }}>
          <Text style={{ color: theme.gold }}>{t("back")}</Text>
        </TouchableOpacity>
        <Text style={{ color: theme.text, paddingHorizontal: 20 }}>{t("somethingWentWrong")}</Text>
      </View>
    )
  }

  const videoSource = place.videoKey ? VIDEOS[place.videoKey] : null

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={2}>
            {t(place.titleKey)}
          </Text>
          <Text style={styles.arabic}>{place.arabic}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {videoSource ? (
          <View style={styles.videoWrap}>
            <Video
              ref={videoRef}
              style={styles.video}
              source={videoSource}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              isLooping
            />
          </View>
        ) : null}

        <Text style={[styles.body, { color: theme.textSecondary }]}>
          {t(place.descriptionKey)}
        </Text>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => openMoreInfo(place.moreInfoQuery)}
        >
          <Ionicons name="globe-outline" size={20} color="#C9A84C" />
          <Text style={[styles.actionText, { color: theme.text }]}>{t("findMoreInfoOnline")}</Text>
          <Ionicons name="open-outline" size={18} color={theme.textSecondary} />
        </TouchableOpacity>

        {place.lat != null && place.lng != null ? (
          <TouchableOpacity
            style={[styles.actionBtn, styles.navBtn]}
            onPress={() => openDirections(place.lat!, place.lng!)}
          >
            <Ionicons name="navigate" size={20} color="#1E3A5F" />
            <Text style={styles.navText}>{t("getDirections")}</Text>
            <Ionicons name="chevron-forward" size={18} color="#1E3A5F" />
          </TouchableOpacity>
        ) : null}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    backgroundColor: "#1E3A5F",
    paddingHorizontal: 16,
    paddingBottom: 18,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  backBtn: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    padding: 8,
    marginTop: 2,
  },
  title: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  arabic: { color: "#C9A84C", fontSize: 13, marginTop: 4 },
  content: { padding: 16, gap: 14 },
  videoWrap: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#000",
    borderWidth: 0.5,
    borderColor: "rgba(201,168,76,0.35)",
  },
  video: { width: "100%", height: "100%" },
  body: { fontSize: 15, lineHeight: 24 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 0.5,
  },
  actionText: { flex: 1, fontSize: 15, fontWeight: "600" },
  navBtn: { backgroundColor: "#C9A84C", borderColor: "#C9A84C" },
  navText: { flex: 1, fontSize: 15, fontWeight: "700", color: "#1E3A5F" },
})
