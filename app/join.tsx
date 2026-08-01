import { AnimatedHeroIcon } from "@/components/AnimatedHeroIcon"
import { normalizeReferralCode, saveReferralCode } from "@/lib/referral"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, Text, View } from "react-native"

export default function JoinScreen() {
  const { ref } = useLocalSearchParams<{ ref: string }>()
  const router = useRouter()
  const { t } = useTranslation()

  useEffect(() => {
    handleReferral()
  }, [])

  const handleReferral = async () => {
    if (ref) {
      await saveReferralCode(normalizeReferralCode(ref))
    }
    // Redirect to login/signup
    router.replace("/auth/login")
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#1E3A5F", alignItems: "center", justifyContent: "center" }}>
      <AnimatedHeroIcon name="moon" size={60} accent="gold" style={{ marginBottom: 20 }} />
      <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold", marginBottom: 8 }}>
        Welcome to UmrahConnect
      </Text>
      <Text style={{ color: "#C9A84C", fontSize: 14, marginBottom: 24 }}>
        {ref ? `${t("agentCodeApplied")}: ${normalizeReferralCode(ref)}` : "Preparing sign up..."}
      </Text>
      <ActivityIndicator color="#C9A84C" />
    </View>
  )
}