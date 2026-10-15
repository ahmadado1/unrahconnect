// Opens from an agent QR / link: umrahconnect://a/AGT-123ABC (and https://myumrahconnect.com/a/… once app links are set up).
// Looks up the agency and shows its profile, where the pilgrim can join it.
import { getAgentByCode, normalizeAgentCode } from "@/lib/agents"
import { saveReferralCode } from "@/lib/referral"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, Text, View } from "react-native"
import TouchableOpacity from "@/app/components/AppPressable"

export default function AgentCodeLinkScreen() {
  const { code } = useLocalSearchParams<{ code: string }>()
  const router = useRouter()
  const { t } = useTranslation()
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function open() {
      const normalized = normalizeAgentCode(String(code || ""))
      try {
        const agent = normalized ? await getAgentByCode(normalized) : null
        if (cancelled) return
        if (!agent) {
          setMissing(true)
          return
        }
        await saveReferralCode(normalized)
        router.replace(`/agent/${agent.id}` as any)
      } catch {
        if (!cancelled) setMissing(true)
      }
    }
    open()
    return () => {
      cancelled = true
    }
  }, [code, router])

  return (
    <View style={{ flex: 1, backgroundColor: "#1E3A5F", alignItems: "center", justifyContent: "center", padding: 24 }}>
      {missing ? (
        <>
          <Text style={{ color: "#fff", fontSize: 17, fontWeight: "bold", textAlign: "center", marginBottom: 16 }}>
            {t("agentScanNotFound")}
          </Text>
          <TouchableOpacity onPress={() => router.replace("/agent" as any)} style={{ backgroundColor: "#C9A84C", borderRadius: 25, paddingHorizontal: 24, paddingVertical: 12 }}>
            <Text style={{ color: "#1E3A5F", fontWeight: "bold" }}>{t("findAgent")}</Text>
          </TouchableOpacity>
        </>
      ) : (
        <ActivityIndicator color="#C9A84C" size="large" />
      )}
    </View>
  )
}
