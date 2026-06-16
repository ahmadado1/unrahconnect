import { saveReferralCode } from "@/lib/referral"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useEffect } from "react"
import { ActivityIndicator, Text, View } from "react-native"

export default function JoinScreen() {
  const { ref } = useLocalSearchParams<{ ref: string }>()
  const router = useRouter()

  useEffect(() => {
    handleReferral()
  }, [])

  const handleReferral = async () => {
    if (ref) {
      await saveReferralCode(ref)
      console.log("Referral code saved:", ref)
    }
    // Redirect to login/signup
    router.replace("/auth/login")
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#1E3A5F", alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: 60, marginBottom: 20 }}>🌙</Text>
      <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold", marginBottom: 8 }}>
        Welcome to UmrahConnect
      </Text>
      <Text style={{ color: "#C9A84C", fontSize: 14, marginBottom: 24 }}>
        Setting up your referral...
      </Text>
      <ActivityIndicator color="#C9A84C" />
    </View>
  )
}