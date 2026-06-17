import { Ionicons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"
import { NativeModules, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native"

type GateMarker = {
  id: string
  lat: number
  lng: number
  name: string
}

type SiteMapViewProps = {
  lat: number
  lng: number
  title: string
  gates?: GateMarker[]
  onNavigate: (lat: number, lng: number, label: string) => void
}

function loadMapsModule() {
  if (Platform.OS === "web") return null

  const hasNativeModule =
    NativeModules.RNMapsAirModule != null ||
    NativeModules.AIRMapManager != null ||
    NativeModules.AIRGoogleMapManager != null

  if (!hasNativeModule) return null

  try {
    return require("react-native-maps")
  } catch {
    return null
  }
}

const mapsModule = loadMapsModule()
const MapView = mapsModule?.default ?? null
const Marker = mapsModule?.Marker ?? null
const PROVIDER_GOOGLE = mapsModule?.PROVIDER_GOOGLE

export default function SiteMapView({ lat, lng, title, gates, onNavigate }: SiteMapViewProps) {
  const { t } = useTranslation()

  if (!MapView || !Marker) {
    return (
      <TouchableOpacity
        style={styles.fallback}
        onPress={() => onNavigate(lat, lng, title)}
        activeOpacity={0.85}
      >
        <Ionicons name="map-outline" size={28} color="#C9A84C" />
        <Text style={styles.fallbackTitle}>{t("openInMaps")}</Text>
        <Text style={styles.fallbackSub}>{t("mapsNativeBuildRequired")}</Text>
      </TouchableOpacity>
    )
  }

  return (
    <MapView
      provider={PROVIDER_GOOGLE}
      style={styles.map}
      initialRegion={{
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.008,
        longitudeDelta: 0.008,
      }}
      showsUserLocation
    >
      <Marker coordinate={{ latitude: lat, longitude: lng }} title={title} pinColor="#C9A84C" />
      {gates?.map(gate => (
        <Marker
          key={gate.id}
          coordinate={{ latitude: gate.lat, longitude: gate.lng }}
          title={gate.name}
          onPress={() => onNavigate(gate.lat, gate.lng, gate.name)}
        />
      ))}
    </MapView>
  )
}

const styles = StyleSheet.create({
  map: { height: 250, marginHorizontal: 16, borderRadius: 12, marginBottom: 8 },
  fallback: {
    height: 250,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: "#1E3A5F",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 8,
  },
  fallbackTitle: { color: "#C9A84C", fontSize: 15, fontWeight: "bold" },
  fallbackSub: { color: "rgba(255,255,255,0.6)", fontSize: 12, textAlign: "center", lineHeight: 18 },
})
