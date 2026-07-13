import { ThemeProvider } from "@/context/themeContext";
import "@/i18n";
import {
  handlePrayerNotificationOpen,
  requestNotificationPermission,
  reschedulePrayerNotificationsFromCache,
  scheduleDailyVerseNotification,
  setupPrayerNotificationChannel,
} from "@/lib/notifications";
import { normalizeReferralCode, saveReferralCode } from "@/lib/referral";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ExpoLinking from "expo-linking";
import * as Notifications from "expo-notifications";
import { Redirect, Stack, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, Text, View } from "react-native";
import { clearLocalAuth, getValidSession, supabase } from "../lib/supabase";
import PrayerAlertProvider from "./components/PrayerAlertProvider";
import QuranBackgroundDownload from "./components/QuranBackgroundDownload";

export default function RootLayout() {
  const [status, setStatus] = useState<"loading" | "onboarding" | "login" | "home">("loading")
  const router = useRouter()
  const statusRef = useRef(status)
  const pendingNotificationRef = useRef<{
    identifier: string
    data: Record<string, unknown> | undefined
    deliveredAt?: Date | number | string | null
  } | null>(null)

  statusRef.current = status

  const navigateFromNotification = (
    identifier: string,
    data: Record<string, unknown> | undefined,
    deliveredAt?: Date | number | string | null
  ) => {
    if (handlePrayerNotificationOpen(identifier, data, () => {
      try {
        router.push("/(tabs)/umrah")
      } catch (e) {
        console.log("Prayer notification navigation error:", e)
      }
    }, deliveredAt)) {
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

  const openNotificationRef = useRef<
    (
      identifier: string,
      data: Record<string, unknown> | undefined,
      deliveredAt?: Date | number | string | null
    ) => void
  >(() => {})

  openNotificationRef.current = (identifier, data, deliveredAt) => {
    if (statusRef.current !== "home") {
      pendingNotificationRef.current = { identifier, data, deliveredAt }
      return
    }

    setTimeout(() => navigateFromNotification(identifier, data, deliveredAt), 300)
  }

  useEffect(() => {
    if (status !== "home" || !pendingNotificationRef.current) return

    const pending = pendingNotificationRef.current
    pendingNotificationRef.current = null
    setTimeout(
      () => navigateFromNotification(pending.identifier, pending.data, pending.deliveredAt),
      300
    )
  }, [status])

  useEffect(() => {
    checkAuth()

    requestNotificationPermission().then(async granted => {
      if (!granted) return
      await setupPrayerNotificationChannel().catch(console.log)
      await reschedulePrayerNotificationsFromCache().catch(console.log)
      const notifEnabled = await AsyncStorage.getItem("notifications_enabled")
      if (notifEnabled !== "false") {
        await scheduleDailyVerseNotification().catch(console.log)
      }
    })

    const handleDeepLink = async (url: string) => {
      const parsed = ExpoLinking.parse(url)
      const ref = parsed.queryParams?.ref as string
      if (ref) {
        await saveReferralCode(normalizeReferralCode(ref))
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

    Notifications.getLastNotificationResponseAsync().then(response => {
      if (!response) return
      const identifier = response.notification.request.identifier
      const data = response.notification.request.content.data as Record<string, unknown> | undefined
      openNotificationRef.current(identifier, data, response.notification.date)
    })

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      const identifier = response.notification.request.identifier
      const data = response.notification.request.content.data as Record<string, unknown> | undefined
      openNotificationRef.current(identifier, data, response.notification.date)
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
              <Stack.Screen name="haramain/[station]" />
              <Stack.Screen name="auth/setup" />
              <Stack.Screen name="auth/plans" />
              <Stack.Screen name="agent/dashboard" />
              <Stack.Screen name="agent/index" />
              <Stack.Screen name="agent/[id]" />
              <Stack.Screen name="join" />
              <Stack.Screen name="qiblah" />
              <Stack.Screen name="AIGuideScreen" />
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
