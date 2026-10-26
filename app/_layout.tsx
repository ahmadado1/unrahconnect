import { loginPurchases, logoutPurchases, setupPurchases } from "@/lib/purchases"
import { registerBackgroundRebook } from "@/lib/backgroundRebook"
import { AnimatedHeroIcon } from "@/components/AnimatedHeroIcon";
import { AIGuideProvider } from "@/context/AIGuideContext";
import { ThemeProvider, useTheme } from "@/context/themeContext";
import i18n from "@/i18n";
import {
  handleAdhanAction,
  handlePrayerNotificationForeground,
  handlePrayerNotificationOpen,
  registerAdhanCategory,
  requestNotificationPermission,
  reschedulePrayerNotificationsFromCache,
  scheduleAlKahfReminder,
  scheduleAlMulkReminder,
  scheduleSalawatReminder,
  scheduleQuranGoalReminders,
  scheduleDailyDhikrReminders,
  scheduleDailyVerseNotification,
  scheduleIslamicDateReminders,
  scheduleJourneyReminders,
  setupPrayerNotificationChannel,
} from "@/lib/notifications";
import { getPendingReferral, linkPilgrimToAgent, normalizeReferralCode, saveReferralCode } from "@/lib/referral";
import { agentCodeFromScan } from "@/lib/agents";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ExpoLinking from "expo-linking";
import * as Notifications from "expo-notifications";
import { Redirect, Stack, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, AppState, Dimensions, StyleSheet, Text, View } from "react-native";
import * as ScreenOrientation from "expo-screen-orientation";
import { auditAllMushafPages, purgeEmptyCachedPages } from "../lib/quranPageCache";
import { clearLocalAuth, getValidSession, supabase, syncUserLanguage } from "../lib/supabase";
import StoreReviewPrompt from "@/components/StoreReviewPrompt";
import PrayerAlertProvider from "./components/PrayerAlertProvider";
import QuranBackgroundDownload from "./components/QuranBackgroundDownload";
import PremiumPromptHost from "./components/PremiumPromptHost";

// If a screen crashes, show a friendly "Try again" screen instead of closing the app.
export { default as ErrorBoundary } from "./components/AppErrorScreen"

// Orientation: phones stay upright (portrait). Tablets and big foldables can rotate, as Google
// asks for large screens (Android 16 ignores a portrait-only setting there anyway).
// app.json has "orientation": "default", so the lock lives here instead of in the manifest.
{
  const { width, height } = Dimensions.get("screen")
  if (Math.min(width, height) < 600) {
    void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {})
  }
}

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

    if (identifier === "journey-reminder-hajj" || (identifier === "journey-reminder" && data?.type === "hajj")) {
      router.push("/hajj")
    } else if (
      identifier === "journey-reminder" ||
      identifier === "journey-reminder-umrah"
    ) {
      router.push("/umrah-guide")
    } else if (identifier.startsWith("salawat") || data?.screen === "dhikr") {
      // Friday Salawat reminder → dhikr counter
      router.push({ pathname: "/dhikr", params: { id: String(data?.id ?? "salawat") } } as any)
    } else if (identifier === "daily-verse") {
      router.push("/quran")
    } else if (
      identifier.startsWith("al-kahf") ||
      data?.screen === "al-kahf" ||
      data?.route === "/quran/kahf" ||
      data?.route === "/quran/18"
    ) {
      router.push("/quran/kahf" as any)
    } else if (
      identifier.startsWith("al-mulk") ||
      data?.screen === "al-mulk" ||
      data?.route === "/quran/mulk" ||
      data?.route === "/quran/67"
    ) {
      // Isolated Mulk reader (read or, with Premium, listen).
      router.push("/quran/mulk" as any)
    } else if (
      identifier === "adhkar-reminder-morning" ||
      identifier === "dhikr-reminder-morning" ||
      (data?.screen === "adhkar" && data?.period === "morning") ||
      data?.route === "/MorningAdhkarScreen"
    ) {
      router.push("/MorningAdhkarScreen" as any)
    } else if (
      identifier === "adhkar-reminder-evening" ||
      identifier === "dhikr-reminder-evening" ||
      (data?.screen === "adhkar" && data?.period === "evening") ||
      data?.route === "/EveningAdhkarScreen"
    ) {
      router.push("/EveningAdhkarScreen" as any)
    } else if (
      identifier.startsWith("adhkar-reminder") ||
      identifier.startsWith("dhikr-reminder")
    ) {
      router.push("/MorningAdhkarScreen" as any)
    } else if (identifier.startsWith("islamic-")) {
      router.push("/islamic-calendar")
    } else if (identifier.startsWith("miqat-") || data?.screen === "miqat") {
      router.push("/miqat-alert" as any)
    } else if (identifier === "my-duas-arafah" || data?.screen === "makkah-companion") {
      router.push({ pathname: "/makkah-companion", params: { tab: String(data?.tab ?? "duas") } } as any)
    } else if (identifier.startsWith("quran-goal") || data?.screen === "quran-goal") {
      // Quran goal reminder → the next unread page of the goal
      void (async () => {
        const { loadGoals } = await import("@/lib/quranGoals")
        const { goalReaderHref } = await import("@/lib/quranGoalNav")
        const goals = (await loadGoals()).filter(g => !g.completedAt)
        // The goal the reminder was about, else the most urgent one.
        const goal = goals.find(g => g.id === data?.goalId) ?? goals[0]
        if (goal) router.push((await goalReaderHref(goal)) as any)
        else router.push("/quran")
      })()
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
    void purgeEmptyCachedPages().then(() => {
      if (__DEV__) void auditAllMushafPages()
    })
  }, [])

  useEffect(() => {
    checkAuth()

    // Book every reminder ahead. Runs at start AND every time the app comes back to the screen
    // (at most every 20 minutes): a built app can stay alive in the background for days
    // (e.g. while playing Quran), and Al-Mulk / Kahf / adhkar are only booked a few days ahead.
    let lastBooking = 0
    let booking = false
    const bookReminders = async () => {
      if (booking || Date.now() - lastBooking < 20 * 60 * 1000) return
      booking = true
      lastBooking = Date.now()
      try {
        // Offline map of the Haram areas (Premium): saves itself once, a few MB.
        void import("@/lib/premium").then(async m => {
          if (await m.isPremiumNow()) await (await import("@/lib/offlineMapTiles")).ensureOfflineMapTiles()
        }).catch(() => {})
        // Home-screen widget gets today's prayers even if notifications are off.
        void import("@/lib/prayerWidget").then(m => m.updatePrayerWidget()).catch(() => {})
        const granted = await requestNotificationPermission()
        if (!granted) return
        await setupPrayerNotificationChannel().catch(console.log)
        // Prayers + Adhkar first: they matter most and need no slow network calls.
        await reschedulePrayerNotificationsFromCache().catch(console.log)
        const notifEnabled = await AsyncStorage.getItem("notifications_enabled")
        if (notifEnabled !== "false") {
          await scheduleDailyDhikrReminders().catch(console.log)
          await scheduleAlMulkReminder().catch(console.log)
          await scheduleAlKahfReminder().catch(console.log)
          await scheduleSalawatReminder().catch(console.log)
          await scheduleQuranGoalReminders().catch(console.log)
          await import("@/lib/makkahCompanion").then(m => m.scheduleArafahDuaReminder()).catch(console.log)
          await scheduleDailyVerseNotification().catch(console.log)
          await scheduleJourneyReminders().catch(console.log)
          await scheduleIslamicDateReminders().catch(console.log)
        }
      } finally {
        booking = false
      }
    }
    void bookReminders()
    const bookingSub = AppState.addEventListener("change", state => {
      if (state === "active") void bookReminders()
    })

    const handleDeepLink = async (url: string) => {
      const parsed = ExpoLinking.parse(url)
      // ?ref=AGT-… (old join links) or /a/AGT-… (agent QR posters)
      const ref = (parsed.queryParams?.ref as string) || agentCodeFromScan(url) || ""
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

    // In-app purchases: start RevenueCat for the logged-in account.
    void supabase.auth.getSession().then(({ data }) => {
      void setupPurchases(data.session?.user.id)
    })

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      // Keep RevenueCat on the same account as the app (purchases belong to the account).
      if (event === "SIGNED_IN" && session?.user?.id) setTimeout(() => void loginPurchases(session.user.id), 0)
      // Keep the account's language up to date (used for emails in the user's language).
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) setTimeout(() => void syncUserLanguage(i18n.language), 0)
      if (event === "SIGNED_OUT") setTimeout(() => void logoutPurchases(), 0)
      // A pilgrim who tapped "Join" or scanned an agent QR before signing in gets linked now.
      // Deferred with setTimeout: calling Supabase inside this callback can lock up other auth calls.
      if (event === "SIGNED_IN" && session?.user?.user_metadata?.profile_complete) {
        setTimeout(() => {
          void getPendingReferral().then(code => {
            if (code) void linkPilgrimToAgent(code)
          })
        }, 0)
      }
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

    const onLanguageChanged = (lng: string) => void syncUserLanguage(lng)
    i18n.on("languageChanged", onLanguageChanged)

    void registerAdhanCategory()
    void registerBackgroundRebook()

    Notifications.getLastNotificationResponseAsync().then(async response => {
      if (!response) return
      const identifier = response.notification.request.identifier
      const deliveredAt = response.notification.date
      const responseKey = `${identifier}:${String(deliveredAt ?? "")}`
      const lastHandled = await AsyncStorage.getItem("last_handled_notification_response")
      if (lastHandled === responseKey) return
      await AsyncStorage.setItem("last_handled_notification_response", responseKey)
      if (handleAdhanAction(response)) return
      const data = response.notification.request.content.data as Record<string, unknown> | undefined
      openNotificationRef.current(identifier, data, deliveredAt)
    })

    const receivedListener = Notifications.addNotificationReceivedListener(notification => {
      if (AppState.currentState !== "active") return
      const identifier = notification.request.identifier
      const data = notification.request.content.data as Record<string, unknown> | undefined
      handlePrayerNotificationForeground(identifier, data)
    })

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      const identifier = response.notification.request.identifier
      const deliveredAt = response.notification.date
      const responseKey = `${identifier}:${String(deliveredAt ?? "")}`
      void AsyncStorage.setItem("last_handled_notification_response", responseKey)
      // Stop button / swipe away on the iPhone Adhan: stop the rest of the Adhan, open nothing.
      if (handleAdhanAction(response)) return
      const data = response.notification.request.content.data as Record<string, unknown> | undefined
      openNotificationRef.current(identifier, data, deliveredAt)
    })

    return () => {
      authListener.subscription.unsubscribe()
      i18n.off("languageChanged", onLanguageChanged)
      responseListener.remove()
      linkingSub.remove()
      bookingSub.remove()
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
      <AIGuideProvider>
        <PrayerAlertProvider>
          <View style={{ flex: 1, backgroundColor: "#1E3A5F" }}>
            <QuranBackgroundDownload />
            {/* Always mount Stack so notification/auth navigation never races ahead of the root layout */}
            <AppStack />
            <StoreReviewPrompt />
            {/* Premium card for free users who tap a Premium feature */}
            <PremiumPromptHost />

            {status === "loading" && (
              <View
                style={{
                  ...StyleSheet.absoluteFill,
                  backgroundColor: "#F5F0E8",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 100,
                }}
              >
                <AnimatedHeroIcon name="moon" size={60} accent="navy" />
                <ActivityIndicator color="#C9A84C" style={{ marginTop: 20 }} />
              </View>
            )}

            {status === "onboarding" && <Redirect href="/onboarding" />}
            {status === "login" && <Redirect href="/auth/login" />}
            {status === "home" && <Redirect href="/(tabs)" />}
          </View>
        </PrayerAlertProvider>
      </AIGuideProvider>
    </ThemeProvider>
  )
}

function AppStack() {
  const { theme } = useTheme()
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        animationDuration: 280,
        animationTypeForReplace: "push",
        contentStyle: { backgroundColor: theme.background },
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="auth/login" />
      <Stack.Screen name="auth/reset-password" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="hotels" />
      <Stack.Screen name="hotel-webview" />
      <Stack.Screen name="services/flights" />
      <Stack.Screen name="services/esim" />
      <Stack.Screen name="services/airalo" />
      <Stack.Screen name="services/transport" />
      <Stack.Screen name="services/shopping" />
      <Stack.Screen name="restaurants" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="favorites" />
      <Stack.Screen name="about" />
      <Stack.Screen name="contact" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="terms" />
      <Stack.Screen name="booking" />
      <Stack.Screen name="search" />
      <Stack.Screen name="hajj" />
      <Stack.Screen name="hajj/[hajj]" />
      <Stack.Screen name="umrah-guide" />
      <Stack.Screen name="start-guide" />
      <Stack.Screen name="quran" />
      <Stack.Screen name="quran-listen" />
      <Stack.Screen name="dhikr" />
      <Stack.Screen name="offline-map" />
      <Stack.Screen name="notification-check" />
      <Stack.Screen name="quran-player" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
      <Stack.Screen name="trip-planner" />
      <Stack.Screen name="premium" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
      <Stack.Screen name="quran/[surah]" />
      <Stack.Screen name="quran/kahf" />
      <Stack.Screen name="quran/mulk" />
      <Stack.Screen name="quran/bookmark" />
      <Stack.Screen name="duas" />
      <Stack.Screen name="islamic-calendar" />
      <Stack.Screen name="maps/[site]" />
      <Stack.Screen name="makkah-places" />
      <Stack.Screen name="makkah-companion" />
      <Stack.Screen name="miqat-alert" />
      <Stack.Screen name="premium-welcome" options={{ gestureEnabled: false }} />
      <Stack.Screen name="makkah-place/[id]" />
      <Stack.Screen name="haramain/[station]" />
      <Stack.Screen name="auth/setup" />
      <Stack.Screen name="auth/plans" />
      <Stack.Screen name="agent/dashboard" />
      <Stack.Screen name="agent/index" />
      <Stack.Screen name="agent/[id]" />
      <Stack.Screen name="join" />
      <Stack.Screen name="qiblah" />
      <Stack.Screen name="AIGuideScreen" />
      <Stack.Screen name="MorningAdhkarScreen" />
      <Stack.Screen name="EveningAdhkarScreen" />
    </Stack>
  )
}
