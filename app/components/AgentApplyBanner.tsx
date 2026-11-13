// Reminder for agencies that signed up but haven't finished their application
// (no agency details yet, or documents missing, or the team asked for more information).
// Shown on Home, the Me tab and the Agent Dashboard. Hidden once everything is sent.
import { Ionicons } from "@expo/vector-icons"
import { useFocusEffect, useRouter } from "expo-router"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, Text, View } from "react-native"
import TouchableOpacity from "@/app/components/AppPressable"
import { applicationGaps, applicationStage, getMyApplication, type MyApplication } from "@/lib/agentApplication"
import { getUserFast } from "@/lib/supabase"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"

export default function AgentApplyBanner({ style }: { style?: object }) {
  const router = useRouter()
  const { t } = useTranslation()
  const [app, setApp] = useState<MyApplication | null>(null)
  const [show, setShow] = useState(false)

  // Re-check every time the screen comes back into view (e.g. after finishing the form)
  useFocusEffect(
    useCallback(() => {
      let cancelled = false
      ;(async () => {
        try {
          const { data: { user } } = await getUserFast()
          if (!user || user.user_metadata?.user_type !== "agent") {
            if (!cancelled) setShow(false)
            return
          }
          const mine = await getMyApplication()
          if (cancelled) return
          setApp(mine)
          const stage = applicationStage(mine)
          setShow(stage === "details" || stage === "documents" || Boolean(mine?.info_request && !mine.verified))
        } catch {
          if (!cancelled) setShow(false)
        }
      })()
      return () => {
        cancelled = true
      }
    }, []),
  )

  if (!show) return null

  const stage = applicationStage(app)
  const missing = applicationGaps(app).length
  const body = app?.info_request
    ? t("applyInfoNeeded")
    : stage === "details"
      ? t("completeBodyDetails")
      : t("completeBodyDocs", { count: missing })

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={() => router.push("/agent/apply?auto=1" as any)}
    >
      <View style={styles.icon}>
        <Ionicons name={app?.info_request ? "chatbubble-ellipses-outline" : "document-text-outline"} size={20} color={NAVY} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{t("completeTitle")}</Text>
        <Text style={styles.body}>{body}</Text>
      </View>
      <View style={styles.btn}>
        <Text style={styles.btnText}>{t("completeBtn")}</Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: NAVY, borderRadius: 16, padding: 14, borderWidth: 1.5, borderColor: GOLD },
  icon: { width: 38, height: 38, borderRadius: 19, backgroundColor: GOLD, alignItems: "center", justifyContent: "center" },
  title: { color: "#fff", fontSize: 15, fontWeight: "bold" },
  body: { color: "#D7DEEA", fontSize: 12, lineHeight: 17, marginTop: 2 },
  btn: { backgroundColor: GOLD, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 12 },
  btnText: { color: NAVY, fontSize: 12, fontWeight: "bold" },
})
