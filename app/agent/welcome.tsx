// Shown after an agent creates an account in the app: "Finish setup on the website" + the steps.
// No prices or payment links here (store rules). We only show the website address with a copy button.
import { useTheme } from "@/context/themeContext"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import * as Clipboard from "expo-clipboard"
import { useState } from "react"
import { StatusBar } from "expo-status-bar"
import { useTranslation } from "react-i18next"
import { ScrollView, StyleSheet, Text, View } from "react-native"
import TouchableOpacity from "@/app/components/AppPressable"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"
const SITE_ADDRESS = "myumrahconnect.com/agents"
const STEP_ICONS = ["person-add", "document-text", "shield-checkmark", "pricetag", "people", "refresh"] as const

export default function AgentWelcomeScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { theme } = useTheme()
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const copyAddress = async () => {
    await Clipboard.setStringAsync(SITE_ADDRESS)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.tick}>
          <Ionicons name="globe-outline" size={28} color={NAVY} />
        </View>
        <Text style={styles.title}>{t("agentReceivedTitle")}</Text>
        <Text style={styles.body}>{t("agentReceivedBody")}</Text>
        <TouchableOpacity style={styles.address} onPress={copyAddress}>
          <Text style={styles.addressText}>{SITE_ADDRESS}</Text>
          <View style={styles.copyChip}>
            <Ionicons name={copied ? "checkmark" : "copy-outline"} size={14} color={NAVY} />
            <Text style={styles.copyText}>{copied ? t("agentCopied") : t("agentCopyAddress")}</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.sameEmail}>{t("agentSameEmail")}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.section, { color: theme.textSecondary }]}>{t("agentStepsTitle")}</Text>
        {STEP_ICONS.map((icon, index) => {
          const n = index + 1
          const done = index === 0
          const next = index === 1
          return (
            <View
              key={icon}
              style={[
                styles.step,
                { backgroundColor: theme.card, borderColor: next ? GOLD : theme.border },
                next && styles.stepNext,
              ]}
            >
              <View style={[styles.num, done && styles.numDone]}>
                <Ionicons name={done ? "checkmark" : icon} size={18} color={done ? "#fff" : GOLD} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.stepHead}>
                  <Text style={[styles.stepTitle, { color: theme.text }]}>
                    {n}. {t(`agentStep${n}Title`)}
                  </Text>
                  {done ? <Text style={[styles.flag, styles.flagDone]}>{t("agentStepDone")}</Text> : null}
                  {next ? <Text style={[styles.flag, styles.flagNext]}>{t("agentStepNext")}</Text> : null}
                </View>
                <Text style={[styles.stepBody, { color: theme.textSecondary }]}>{t(`agentStep${n}Body`)}</Text>
              </View>
            </View>
          )
        })}

        <TouchableOpacity style={styles.btn} onPress={() => router.replace("/(tabs)")}>
          <Text style={styles.btnText}>{t("agentGoToApp")}</Text>
        </TouchableOpacity>
        <View style={{ height: insets.bottom + 24 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { backgroundColor: NAVY, paddingHorizontal: 24, paddingBottom: 24, alignItems: "center" },
  tick: { width: 56, height: 56, borderRadius: 28, backgroundColor: GOLD, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  title: { color: "#fff", fontSize: 24, fontWeight: "bold", textAlign: "center" },
  address: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 16, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14 },
  addressText: { color: "#fff", fontSize: 15, fontWeight: "bold" },
  copyChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: GOLD, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 },
  copyText: { color: NAVY, fontSize: 12, fontWeight: "bold" },
  sameEmail: { color: "#D7DEEA", fontSize: 12, marginTop: 8, textAlign: "center" },
  body: { color: "#D7DEEA", fontSize: 14, lineHeight: 21, textAlign: "center", marginTop: 8 },
  content: { padding: 20, gap: 12 },
  section: { fontSize: 13, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  step: { flexDirection: "row", gap: 14, padding: 14, borderRadius: 16, borderWidth: 0.5 },
  stepNext: { borderWidth: 1.5 },
  num: { width: 38, height: 38, borderRadius: 19, backgroundColor: NAVY, alignItems: "center", justifyContent: "center" },
  numDone: { backgroundColor: "#2F855A" },
  stepHead: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6, marginBottom: 3 },
  stepTitle: { fontSize: 15, fontWeight: "bold" },
  flag: { fontSize: 10, fontWeight: "700", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, overflow: "hidden" },
  flagDone: { backgroundColor: "#E6F4EA", color: "#2F855A" },
  flagNext: { backgroundColor: "#F3EAD2", color: "#8A6D1F" },
  stepBody: { fontSize: 13, lineHeight: 19 },
  btn: { backgroundColor: GOLD, borderRadius: 25, padding: 16, alignItems: "center", marginTop: 12 },
  btnText: { color: NAVY, fontSize: 16, fontWeight: "bold" },
})
