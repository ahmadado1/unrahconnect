// Scan an agent's QR poster with the camera (needs expo-camera).
import { agentCodeFromScan, getAgentByCode } from "@/lib/agents"
import { saveReferralCode } from "@/lib/referral"
import { Ionicons } from "@expo/vector-icons"
import { CameraView, useCameraPermissions } from "expo-camera"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, StyleSheet, Text, View } from "react-native"
import TouchableOpacity from "@/app/components/AppPressable"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"

export default function ScanAgentScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { t } = useTranslation()
  const [permission, requestPermission] = useCameraPermissions()
  const [message, setMessage] = useState("")
  const [checking, setChecking] = useState(false)
  const busy = useRef(false)

  const onScan = async (data: string) => {
    if (busy.current) return
    busy.current = true
    setMessage("")
    const code = agentCodeFromScan(data)
    if (!code) {
      setMessage(t("agentScanInvalid"))
      return
    }
    setChecking(true)
    try {
      const agent = await getAgentByCode(code)
      if (!agent) {
        setMessage(t("agentScanNotFound"))
        return
      }
      await saveReferralCode(code)
      router.replace(`/agent/${agent.id}` as any)
    } catch {
      setMessage(t("somethingWentWrong"))
    } finally {
      setChecking(false)
    }
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("agentScanTitle")}</Text>
        <View style={{ width: 36 }} />
      </View>

      {!permission ? (
        <View style={styles.center}><ActivityIndicator color={GOLD} /></View>
      ) : !permission.granted ? (
        <View style={styles.center}>
          <Ionicons name="camera-outline" size={48} color={GOLD} />
          <Text style={styles.text}>{t("agentCameraPermission")}</Text>
          <TouchableOpacity style={styles.btn} onPress={requestPermission}>
            <Text style={styles.btnText}>{t("agentCameraAllow")}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={message || checking ? undefined : ({ data }: { data: string }) => onScan(data)}
          />
          <View style={styles.frameWrap} pointerEvents="none">
            <View style={styles.frame} />
          </View>
          <View style={[styles.bottom, { paddingBottom: insets.bottom + 20 }]}>
            {checking ? <ActivityIndicator color={GOLD} /> : null}
            <Text style={styles.text}>{message || t("agentScanHint")}</Text>
            {message ? (
              <TouchableOpacity
                style={styles.btn}
                onPress={() => {
                  busy.current = false
                  setMessage("")
                }}
              >
                <Text style={styles.btnText}>{t("agentTryAgain")}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#000" },
  header: { backgroundColor: NAVY, padding: 20, paddingBottom: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", zIndex: 2 },
  backBtn: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, padding: 6 },
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "bold", flex: 1, textAlign: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, padding: 24, backgroundColor: NAVY },
  frameWrap: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  frame: { width: 240, height: 240, borderRadius: 24, borderWidth: 3, borderColor: GOLD },
  bottom: { position: "absolute", left: 0, right: 0, bottom: 0, alignItems: "center", gap: 12, padding: 20, backgroundColor: "rgba(0,0,0,0.55)" },
  text: { color: "#fff", fontSize: 14, textAlign: "center", lineHeight: 20 },
  btn: { backgroundColor: GOLD, borderRadius: 25, paddingHorizontal: 22, paddingVertical: 12 },
  btnText: { color: NAVY, fontWeight: "bold" },
})
