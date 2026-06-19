import { ThemeProvider } from "@/context/themeContext";
import "@/i18n";
import {
  handlePrayerNotificationOpen,
  requestNotificationPermission,
  setupPrayerNotificationChannel,
} from "@/lib/notifications";
import { saveReferralCode } from "@/lib/referral";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ExpoLinking from "expo-linking";
import * as Notifications from "expo-notifications";
import { Redirect, Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, Text, View } from "react-native";
import { clearLocalAuth, getValidSession, supabase } from "../lib/supabase";
import PrayerAlertProvider from "./components/PrayerAlertProvider";
import QuranBackgroundDownload from "./components/QuranBackgroundDownload";

export default function RootLayout() {
  const [status, setStatus] = useState<"loading" | "onboarding" | "login" | "home">("loading")
  const router = useRouter()

  useEffect(() => {
    checkAuth()

    requestNotificationPermission().then(() => {
      setupPrayerNotificationChannel().catch(console.log)
    })

    const handleDeepLink = async (url: string) => {
      const parsed = ExpoLinking.parse(url)
      const ref = parsed.queryParams?.ref as string
      if (ref) {
        await saveReferralCode(ref)
        console.log("Referral code saved:", ref)
      }
    }

    ExpoLinking.getInitialURL().then(url => {
      if (url) handleDeepLink(url)
    })

    const linkingSub = ExpoLinking.addEventListener("url", ({ url }) => {
      handleDeepLink(url)
    })

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

    const openNotification = (identifier: string, data: Record<string, unknown> | undefined) => {
      if (handlePrayerNotificationOpen(identifier, data, () => router.push("/(tabs)/umrah"))) {
        return
      }

      if (identifier === "journey-reminder") {
        if (data?.type === "hajj") {
          router.push("/hajj")
        } else {
          router.push("/umrah-guide")
        }
      } else if (identifier === "daily-verse") {
        router.push("/quran")
      } else if (identifier === "dhikr-reminder") {
        router.push("/duas")
      } else if (identifier.startsWith("islamic-")) {
        router.push("/islamic-calendar")
      }
    }

    Notifications.getLastNotificationResponseAsync().then(response => {
      if (!response) return
      const identifier = response.notification.request.identifier
      const data = response.notification.request.content.data as Record<string, unknown> | undefined
      openNotification(identifier, data)
    })

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      const identifier = response.notification.request.identifier
      const data = response.notification.request.content.data as Record<string, unknown> | undefined
      openNotification(identifier, data)
    })

    return () => {
      authListener.subscription.unsubscribe()
      responseListener.remove()
      linkingSub.remove()
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


  return (
    <ThemeProvider>
      <PrayerAlertProvider>
        <View style={{ flex: 1 }}>
          <QuranBackgroundDownload />
          {status === "loading" ? (
          <View style={{ flex: 1, backgroundColor: "#1E3A5F", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 60 }}>🌙</Text>
            <ActivityIndicator color="#C9A84C" style={{ marginTop: 20 }} />
          </View>
        ) : (
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
              <Stack.Screen name="agent/dashboard" />
              <Stack.Screen name="agent/index" />
              <Stack.Screen name="agent/[id]" />
              <Stack.Screen name="join" />
              <Stack.Screen name="qiblah" />
            </Stack>

            {status === "onboarding" && <Redirect href="/onboarding" />}
            {status === "login" && <Redirect href="/auth/login" />}
            {status === "home" && <Redirect href="/(tabs)" />}
          </View>
        )}
        </View>
      </PrayerAlertProvider>
    </ThemeProvider>
  )
}
