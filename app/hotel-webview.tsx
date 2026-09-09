import { isHttpUrl } from "@/lib/openAffiliateWebView"
import { Ionicons } from "@expo/vector-icons"
import { useLocalSearchParams, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native"
import TouchableOpacity from "@/app/components/AppPressable"
import ScreenState from "@/app/components/ScreenState"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { WebView } from "react-native-webview"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? ""
  return value ?? ""
}

export default function HotelWebViewScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { t } = useTranslation()
  const params = useLocalSearchParams<{ url?: string; title?: string }>()
  const initialUrl = firstParam(params.url).trim()
  const title = firstParam(params.title).trim() || t("bookNow")
  const [loading, setLoading] = useState(true)

  const source = useMemo(() => {
    if (!isHttpUrl(initialUrl)) return null
    return { uri: initialUrl }
  }, [initialUrl])

  const onShouldStartLoadWithRequest = (request: { url: string }) => {
    // Keep http(s) in the WebView so iOS/Android cannot hand off to Booking.com.
    // Block custom schemes (booking://, intent://, market://, etc.).
    return isHttpUrl(request.url)
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={t("goBack")}
        >
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {!source ? (
        <ScreenState kind="error" title={t("bookingLinkUnavailable")} showBack={false} />
      ) : (
        <View style={styles.webWrap}>
          <WebView
            source={source}
            style={styles.webview}
            originWhitelist={["https://*", "http://*"]}
            javaScriptEnabled
            domStorageEnabled
            sharedCookiesEnabled
            thirdPartyCookiesEnabled
            setSupportMultipleWindows={false}
            nestedScrollEnabled
            startInLoadingState
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
          />
          {loading ? (
            <View style={styles.loadingOverlay} pointerEvents="none">
              <ActivityIndicator color={GOLD} size="large" />
            </View>
          ) : null}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: NAVY },
  header: {
    backgroundColor: NAVY,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 10,
    minHeight: 44,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  headerSpacer: { width: 40 },
  webWrap: { flex: 1, backgroundColor: "#fff" },
  webview: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  fallback: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  fallbackText: { fontSize: 15, color: NAVY, textAlign: "center" },
  fallbackBack: { color: GOLD, fontSize: 15, fontWeight: "700" },
})
