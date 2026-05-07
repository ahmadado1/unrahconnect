import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function RootLayout() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [initialRoute, setInitialRoute] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        router.replace("/auth/login")
      }
    })

    return () => authListener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (ready && initialRoute) {
      router.replace(initialRoute as any)
    }
  }, [ready, initialRoute])

  const checkAuth = async () => {
    try {
      const seen = await AsyncStorage.getItem("onboardingSeen")
      const { data: { session } } = await supabase.auth.getSession()

      if (!seen) {
        setInitialRoute("/onboarding")
      } else if (!session) {
        setInitialRoute("/auth/login")
      } else {
        setInitialRoute("/(tabs)")
      }
    } catch (e) {
      setInitialRoute("/auth/login")
    }
  }

  return (
    <Stack
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="auth/login" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="profile" />
    </Stack>
  )
}