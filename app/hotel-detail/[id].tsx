import { AppIcon, ICON_GOLD, StarRating } from "@/components/AppIcon"
import { useTheme } from "@/context/themeContext"
import { HOTEL_IMAGE_PLACEHOLDER } from "@/lib/hotelImages"
import {
  formatPhoneDisplay,
  getHotelById,
  openHotelDirections,
} from "@/lib/hotels"
import { Ionicons } from "@expo/vector-icons"
import { useLocalSearchParams, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import * as WebBrowser from "expo-web-browser"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { isFavorite, toggleFavorite } from "../../lib/supabase"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"

async function openUrl(url: string) {
  try {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      await WebBrowser.openBrowserAsync(url)
      return
    }
    const canOpen = await Linking.canOpenURL(url)
    if (!canOpen) {
      Alert.alert("Unable to open", "This link cannot be opened on this device.")
      return
    }
    await Linking.openURL(url)
  } catch {
    Alert.alert("Unable to open", "Something went wrong opening this link.")
  }
}

export default function HotelDetailScreen() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const { t } = useTranslation()
  const hotelId = Array.isArray(id) ? id[0] : id
  const hotel = getHotelById(hotelId)
  const [favorited, setFavorited] = useState(false)
  const [imageUri, setImageUri] = useState(hotel?.image ?? HOTEL_IMAGE_PLACEHOLDER)
  const isLogo = hotel?.imageType === "logo"

  useEffect(() => {
    if (!hotel) return
    isFavorite(hotel.id, "hotel").then(setFavorited)
    setImageUri(hotel.image)
  }, [hotel])

  const handleFavorite = async () => {
    if (!hotel) return
    const next = await toggleFavorite(hotel.id, "hotel")
    setFavorited(next ?? false)
  }

  const handleImageError = () => {
    if (!hotel) return
    if (imageUri === hotel.image && hotel.imageFallback) {
      setImageUri(hotel.imageFallback)
    } else if (imageUri !== HOTEL_IMAGE_PLACEHOLDER) {
      setImageUri(HOTEL_IMAGE_PLACEHOLDER)
    }
  }

  if (!hotel) {
    return (
      <View style={[styles.notFound, { backgroundColor: theme.background }]}>
        <Text style={[styles.notFoundText, { color: theme.text }]}>{t("hotelNotFound")}</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>{t("goBack")}</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, isLogo && styles.logoHero]}>
          {!isLogo && (
            <>
              <Image
                source={{ uri: imageUri }}
                style={styles.heroImage}
                resizeMode="cover"
                onError={handleImageError}
              />
              <View style={styles.heroOverlay} />
            </>
          )}
          <View
            style={[
              styles.heroContent,
              isLogo && styles.logoHeroContent,
              { paddingTop: insets.top + 8 },
            ]}
          >
            <View style={styles.heroTop}>
              <TouchableOpacity
                style={[styles.circleBtn, isLogo && styles.circleBtnOnLight]}
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={22} color={isLogo ? NAVY : "#fff"} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.circleBtn, isLogo && styles.circleBtnOnLight]}
                onPress={handleFavorite}
              >
                <Ionicons
                  name={favorited ? "heart" : "heart-outline"}
                  size={22}
                  color={favorited ? GOLD : isLogo ? NAVY : "#fff"}
                />
              </TouchableOpacity>
            </View>

            {isLogo ? (
              <View style={styles.logoHeroBody}>
                <View style={styles.logoBox}>
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.logoImage}
                    resizeMode="contain"
                    onError={handleImageError}
                  />
                </View>
                <Text style={[styles.heroName, styles.heroTextOnLight]}>{hotel.name}</Text>
                <StarRating count={hotel.stars} size={18} color={GOLD} style={{ marginBottom: 6 }} />
                <Text style={[styles.heroMeta, styles.heroMetaOnLight]}>
                  {hotel.city} · {hotel.distanceLabel}
                </Text>
              </View>
            ) : (
              <View>
                <Text style={styles.heroName}>{hotel.name}</Text>
                <StarRating count={hotel.stars} size={18} color={GOLD} style={{ marginBottom: 6 }} />
                <Text style={styles.heroMeta}>
                  {hotel.city} · {hotel.distanceLabel}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.content}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("about")}</Text>
          <Text style={[styles.description, { color: theme.textSecondary }]}>{hotel.description}</Text>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("location")}</Text>
          <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.infoRow}>
              <Ionicons name="location" size={18} color={GOLD} />
              <Text style={[styles.infoText, { color: theme.text }]}>{hotel.address}</Text>
            </View>
            <View style={[styles.infoRow, { marginTop: 12 }]}>
              <Ionicons name="walk" size={18} color={GOLD} />
              <Text style={[styles.infoText, { color: theme.text }]}>{hotel.distanceLabel}</Text>
            </View>
            <View style={[styles.infoRow, { marginTop: 12 }]}>
              <Ionicons name="call" size={18} color={GOLD} />
              <Text style={[styles.infoText, { color: theme.text }]}>{formatPhoneDisplay(hotel.phone)}</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("amenities")}</Text>
          <View style={styles.amenitiesGrid}>
            {hotel.amenities.map(item => (
              <View key={item} style={styles.amenityItem}>
                <Ionicons name="checkmark-circle" size={16} color={GOLD} />
                <Text style={[styles.amenityText, { color: theme.textSecondary }]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.actionBar, { backgroundColor: theme.card, borderTopColor: theme.border, paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          style={styles.actionOutline}
          onPress={() => openUrl(`tel:${hotel.phone}`)}
        >
          <Ionicons name="call" size={16} color={NAVY} />
          <Text style={styles.actionOutlineText}>Call Hotel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionOutline}
          onPress={() => openUrl(hotel.website)}
        >
          <Ionicons name="globe-outline" size={16} color={NAVY} />
          <Text style={styles.actionOutlineText}>Visit Website</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionPrimary}
          onPress={() => {
            // Linking (not in-app browser) so Google Maps app opens on iOS/Android
            Linking.openURL(openHotelDirections(hotel)).catch(() => {
              Alert.alert("Unable to open", "Could not open Google Maps.")
            })
          }}
        >
          <Ionicons name="navigate" size={16} color={GOLD} />
          <Text style={styles.actionPrimaryText}>{t("getDirections")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFoundText: { fontSize: 18 },
  backLink: { color: GOLD, marginTop: 10 },
  hero: {
    backgroundColor: NAVY,
    minHeight: 280,
    overflow: "hidden",
  },
  logoHero: {
    backgroundColor: "#E8EEF5",
    minHeight: 0,
  },
  logoBox: {
    width: 120,
    height: 120,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: "rgba(30,58,95,0.12)",
  },
  logoImage: { width: "80%", height: "80%" },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(30,58,95,0.55)",
  },
  heroContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 28,
    justifyContent: "space-between",
    minHeight: 280,
  },
  logoHeroContent: {
    minHeight: 0,
    justifyContent: "flex-start",
    gap: 8,
  },
  logoHeroBody: {
    flexDirection: "column",
    alignItems: "flex-start",
    paddingBottom: 8,
  },
  heroTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  circleBtnOnLight: {
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  heroName: { color: "#fff", fontSize: 24, fontWeight: "bold", lineHeight: 30 },
  heroTextOnLight: { color: NAVY },
  heroMeta: { color: "rgba(255,255,255,0.85)", fontSize: 13, marginTop: 6 },
  heroMetaOnLight: { color: "rgba(30,58,95,0.75)" },
  content: { padding: 20 },
  sectionTitle: { fontSize: 17, fontWeight: "bold", marginBottom: 10 },
  description: { fontSize: 14, lineHeight: 22 },
  divider: { height: 0.5, marginVertical: 20 },
  infoCard: { borderRadius: 14, borderWidth: 0.5, padding: 14 },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  infoText: { flex: 1, fontSize: 14, lineHeight: 20 },
  amenitiesGrid: { gap: 10 },
  amenityItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  amenityText: { fontSize: 14 },
  actionBar: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    borderTopWidth: 0.5,
  },
  actionOutline: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderWidth: 1.5,
    borderColor: NAVY,
    borderRadius: 12,
    paddingVertical: 12,
    backgroundColor: "rgba(201,168,76,0.08)",
  },
  actionOutlineText: { color: NAVY, fontSize: 11, fontWeight: "700" },
  actionPrimary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: NAVY,
    borderRadius: 12,
    paddingVertical: 12,
  },
  actionPrimaryText: { color: GOLD, fontSize: 11, fontWeight: "700" },
})
