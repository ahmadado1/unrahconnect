import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "@/context/themeContext"
import { Platform, Image, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { useTranslation } from "react-i18next"

const NUSUK_IOS = "https://apps.apple.com/app/id6469515422"
const NUSUK_ANDROID = "https://play.google.com/store/apps/details?id=com.moh.nusukapp&hl=en"
const NUSUK_WEB = "https://services.nusuk.sa/nusuk-svc/app"

export function getNusukStoreUrl() {
  if (Platform.OS === "ios") return NUSUK_IOS
  if (Platform.OS === "android") return NUSUK_ANDROID
  return NUSUK_WEB
}

export async function openNusukApp() {
  const storeUrl = getNusukStoreUrl()
  try {
    await Linking.openURL(storeUrl)
  } catch {
    await Linking.openURL(NUSUK_WEB)
  }
}

type Props = {
  compact?: boolean
}

/** Visiting Rawdah: early morning & night free; daytime requires Nusuk permit */
export default function RawdahVisitCard({ compact }: Props) {
  const { theme } = useTheme()
  const { t } = useTranslation()

  return (
    <View
      style={[
        styles.card,
        compact && styles.cardCompact,
        { backgroundColor: theme.card, borderColor: theme.border },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.iconBadge}>
          <Text style={styles.iconEmoji}>🌿</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.text }]}>{t("rawdahVisitTitle")}</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {t("rawdahVisitSub")}
          </Text>
        </View>
      </View>

      <View style={styles.tipRow}>
        <View style={[styles.tipPill, { backgroundColor: "rgba(45,106,79,0.12)" }]}>
          <Text style={styles.tipPillIcon}>🌅</Text>
          <Text style={[styles.tipPillText, { color: theme.text }]}>{t("rawdahMorningTip")}</Text>
        </View>
        <View style={[styles.tipPill, { backgroundColor: "rgba(30,58,95,0.1)" }]}>
          <Text style={styles.tipPillIcon}>🌙</Text>
          <Text style={[styles.tipPillText, { color: theme.text }]}>{t("rawdahNightTip")}</Text>
        </View>
      </View>

      <View style={[styles.dayBox, { backgroundColor: "rgba(201,168,76,0.1)", borderColor: "rgba(201,168,76,0.45)" }]}>
        <Text style={[styles.dayTitle, { color: theme.text }]}>{t("rawdahDayTitle")}</Text>
        <Text style={[styles.dayBody, { color: theme.textSecondary }]}>{t("rawdahDayBody")}</Text>
      </View>

      <TouchableOpacity style={styles.nusukBtn} onPress={openNusukApp} activeOpacity={0.85}>
        <Image
          source={require("../../assets/images/nusuk-app-icon.jpg")}
          style={styles.nusukLogo}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.nusukName}>{t("nusukAppName")}</Text>
          <Text style={styles.nusukHint}>{t("nusukOpenApp")}</Text>
        </View>
        <Ionicons name="open-outline" size={18} color="#C9A84C" />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 0.5,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  cardCompact: { marginTop: 8, marginBottom: 0 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(201,168,76,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconEmoji: { fontSize: 22 },
  title: { fontSize: 16, fontWeight: "700" },
  subtitle: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  tipRow: { gap: 8 },
  tipPill: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tipPillIcon: { fontSize: 16, marginTop: 1 },
  tipPillText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: "500" },
  dayBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  dayTitle: { fontSize: 13, fontWeight: "700" },
  dayBody: { fontSize: 12, lineHeight: 18 },
  nusukBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#1E3A5F",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  nusukLogo: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  nusukName: { color: "#fff", fontSize: 15, fontWeight: "700" },
  nusukHint: { color: "#C9A84C", fontSize: 12, marginTop: 2 },
})
