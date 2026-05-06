import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";

export default function RootLayout() {
  const router = useRouter()

  useEffect(() => {
    checkOnboarding()
  }, [])

  const checkOnboarding = async () => {
    const seen = await AsyncStorage.getItem("onboardingSeen")
    if (!seen) {
      router.replace("/onboarding")
    }
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  )
}