import { ThemeProvider } from "@/context/themeContext";
import "@/i18n";
import { requestNotificationPermission } from "@/lib/notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Redirect, Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, Text, View } from "react-native";
import { clearLocalAuth, getValidSession, supabase } from "../lib/supabase";

export default function RootLayout() {
  const [status, setStatus] = useState<"loading" | "onboarding" | "login" | "home">("loading")
  const router = useRouter()

  useEffect(() => {
  checkAuth()

  // Request notification permissions
  requestNotificationPermission()
  if (Platform.OS === "android") {
    Notifications.requestPermissionsAsync()
  }

  const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") {
      setStatus("login")
      router.replace("/auth/login")
    }
    if (event === "TOKEN_REFRESHED" && !session) {
      clearLocalAuth()
      setStatus("login")
      router.replace("/auth/login")
    }
  })

  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
  const identifier = response.notification.request.identifier
  const data = response.notification.request.content.data

  if (identifier === "journey-reminder") {
    if (data?.type === "hajj") {
      router.push("/hajj")
    } else {
      router.push("/umrah-guide")
    }
  } else if (identifier === "daily-verse") {
    router.push("/quran")
  } else if (identifier.startsWith("prayer-")) {
    router.push("/(tabs)/umrah")   // or wherever your prayer times tab is
  } else if (identifier === "dhikr-reminder") {
    router.push("/duas")
  } else if (identifier.startsWith("islamic-")) {
    router.push("/islamic-calendar")
  }
})

  return () => {
    authListener.subscription.unsubscribe()
    responseListener.remove()
  }
}, [])

const checkAuth = async () => {
  try {
    const seen = await AsyncStorage.getItem("onboardingSeen")

    let session = null
    try {
      const timeoutPromise = new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), 5000)
      )
      session = await Promise.race([getValidSession(), timeoutPromise])
    } catch {
      session = null
    }

    // Offline fallback — use cached user only when network timed out
    if (!session) {
      const cachedUser = await AsyncStorage.getItem("cached_user")
      if (cachedUser) {
        session = { user: JSON.parse(cachedUser) } as any
      }
    }

    if (!seen) setStatus("onboarding")
    else if (!session) setStatus("login")
    else setStatus("home")
  } catch {
    await clearLocalAuth()
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
          <Stack.Screen name="hotels" />
          <Stack.Screen name="restaurants" />
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
          <Stack.Screen name="duas" />
          <Stack.Screen name="islamic-calendar" />
          <Stack.Screen name="maps/[site]" />
          <Stack.Screen name="auth/setup" />
          <Stack.Screen name="auth/plans" />
        </Stack>

        {status === "onboarding" && <Redirect href="/onboarding" />}
        {status === "login" && <Redirect href="/auth/login" />}
        {status === "home" && <Redirect href="/(tabs)" />}
      </View>
    </ThemeProvider>
  )
}