import { ThemeProvider } from "@/context/themeContext";
import "@/i18n";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect, Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { supabase } from "../lib/supabase";

export default function RootLayout() {
  const [status, setStatus] = useState<"loading" | "onboarding" | "login" | "home">("loading")
  const router = useRouter()

  useEffect(() => {
    checkAuth()

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.replace("/auth/login")
      }
    })

    return () => authListener.subscription.unsubscribe()
  }, [])

  const checkAuth = async () => {
    try {
      const seen = await AsyncStorage.getItem("onboardingSeen")
      const { data: { session } } = await supabase.auth.getSession()

      if (!seen) setStatus("onboarding")
      else if (!session) setStatus("login")
      else setStatus("home")
    } catch (e) {
      setStatus("login")
    }
  }

  if (status === "loading") {
    return (
      <ThemeProvider>
        <View style={{ flex: 1, backgroundColor: "#1E3A5F", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 60 }}>🌙</Text>
          <ActivityIndicator color="#C9A84C" style={{ marginTop: 20 }} />
        </View>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider>
      <View style={{ flex: 1, backgroundColor: "#1E3A5F" }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="auth/login" />
          <Stack.Screen name="auth/reset-password" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="favorites" />
          <Stack.Screen name="about" />
          <Stack.Screen name="contact" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="privacy" />
          <Stack.Screen name="terms" />
          <Stack.Screen name="booking" />
          <Stack.Screen name="search" />
          <Stack.Screen name="hajj" />
          <Stack.Screen name="hajj/[hajj]" />
          <Stack.Screen name="umrah-guide" />
          <Stack.Screen name="quran" />
          <Stack.Screen name="quran/[surah]" />
          <Stack.Screen name="quran/bookmark" />
        </Stack>

        {status === "onboarding" && <Redirect href="/onboarding" />}
        {status === "login" && <Redirect href="/auth/login" />}
        {status === "home" && <Redirect href="/(tabs)" />}
      </View>
    </ThemeProvider>
  )
}