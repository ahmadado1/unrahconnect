import { ThemeProvider } from "@/context/themeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function RootLayout() {
  const router = useRouter()

  useEffect(() => {
    checkAuth()

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        router.replace("/auth/login")
      }
      if (event === "SIGNED_IN") {
        router.replace("/(tabs)")
      }
    })

    return () => authListener.subscription.unsubscribe()
  }, [])

  const checkAuth = async () => {
    try {
      // Small delay to let the router mount properly
      await new Promise(resolve => setTimeout(resolve, 300))

      const seen = await AsyncStorage.getItem("onboardingSeen")
      const { data: { session } } = await supabase.auth.getSession()

      if (!seen) {
        router.replace("/onboarding")
      } else if (!session) {
        router.replace("/auth/login")
      } else {
        router.replace("/(tabs)")
      }
    } catch (e) {
      router.replace("/auth/login")
    }
  }

  
    return (
      <ThemeProvider>
        {/* your existing stack/tabs here */}
        <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="auth/login" />
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
    </Stack>
      </ThemeProvider>
    );
  }

 
