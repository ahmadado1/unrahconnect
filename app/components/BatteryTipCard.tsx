// One-time tip for Android phones that "restrict" new apps' battery by default
// (Tecno, Infinix, itel, Xiaomi, Oppo, Vivo, Huawei...). When UmrahConnect is "Restricted",
// prayer alerts can be late or missing and the phone may close the app.
// Shows once on the home screen; "Open settings" goes to UmrahConnect's app page
// (Battery → Unrestricted is there). Hidden forever after "Done" or "Not now".
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as Device from "expo-device"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Linking, Platform, StyleSheet, Text, View } from "react-native"
import TouchableOpacity from "@/app/components/AppPressable"
import { useTheme } from "@/context/themeContext"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"
const SEEN_KEY = "battery_tip_done_v1"

// Brands that limit background apps hard (see dontkillmyapp.com).
const STRICT_BRANDS = ["tecno", "infinix", "itel", "transsion", "xiaomi", "redmi", "poco", "oppo", "realme", "vivo", "iqoo", "huawei", "honor", "oneplus", "meizu", "asus", "nokia", "lenovo", "motorola", "samsung"]

function isStrictPhone() {
  if (Platform.OS !== "android") return false
  const name = `${Device.manufacturer ?? ""} ${Device.brand ?? ""}`.toLowerCase()
  return STRICT_BRANDS.some(b => name.includes(b))
}

export default function BatteryTipCard() {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const [show, setShow] = useState(false)

  // Show only on those phones, and only until the user dismisses it.
  useEffect(() => {
    if (!isStrictPhone()) return
    AsyncStorage.getItem(SEEN_KEY)
      .then(v => setShow(v !== "1"))
      .catch(() => {})
  }, [])

  const close = () => {
    setShow(false)
    AsyncStorage.setItem(SEEN_KEY, "1").catch(() => {})
  }

  if (!show) return null

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: GOLD }]}>
      <View style={styles.row}>
        <View style={styles.icon}>
          <Ionicons name="battery-charging-outline" size={20} color={GOLD} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>{t("batteryTipTitle")}</Text>
      </View>
      <Text style={[styles.body, { color: theme.textSecondary }]}>{t("batteryTipBody")}</Text>
      {/* The exact steps */}
      <Text style={[styles.steps, { color: theme.text }]}>{t("batteryTipSteps")}</Text>
      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.goldBtn}
          onPress={() => {
            void Linking.openSettings()
            close()
          }}
        >
          <Text style={styles.goldBtnText}>{t("batteryTipOpen")}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.textBtn} onPress={close}>
          <Text style={[styles.textBtnText, { color: theme.textSecondary }]}>{t("batteryTipLater")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 16, borderWidth: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  icon: { width: 34, height: 34, borderRadius: 10, backgroundColor: NAVY, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 15, fontWeight: "bold", flex: 1 },
  body: { fontSize: 13, lineHeight: 19 },
  steps: { fontSize: 13, lineHeight: 20, marginTop: 8, fontWeight: "600" },
  buttons: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 12 },
  goldBtn: { backgroundColor: GOLD, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 9 },
  goldBtnText: { color: NAVY, fontWeight: "bold", fontSize: 13 },
  textBtn: { paddingVertical: 9, paddingHorizontal: 6 },
  textBtnText: { fontSize: 13 },
})
