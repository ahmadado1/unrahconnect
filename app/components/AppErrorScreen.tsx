// Shown instead of closing the app when a screen hits an unexpected error.
// expo-router uses it automatically because app/_layout.tsx exports it as ErrorBoundary.
import i18n from "@/i18n"
import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import { Pressable, StyleSheet, Text, View } from "react-native"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"

export default function AppErrorScreen({ error, retry }: { error: Error; retry: () => Promise<void> }) {
  // Kept in the log so it shows up in crash reports / device logs.
  console.error("[AppError]", error?.message, error?.stack)
  const goHome = () => {
    try {
      router.replace("/(tabs)" as any)
    } catch {
      void retry()
    }
  }
  return (
    <View style={styles.screen}>
      <Ionicons name="moon" size={46} color={GOLD} />
      <Text style={styles.title}>{i18n.t("appErrorTitle")}</Text>
      <Text style={styles.body}>{i18n.t("appErrorBody")}</Text>
      <Pressable style={styles.main} onPress={() => void retry()}>
        <Text style={styles.mainText}>{i18n.t("appErrorRetry")}</Text>
      </Pressable>
      <Pressable style={styles.second} onPress={goHome}>
        <Text style={styles.secondText}>{i18n.t("appErrorHome")}</Text>
      </Pressable>
      <Text style={styles.detail} numberOfLines={2}>
        {String(error?.message ?? "")}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: NAVY, alignItems: "center", justifyContent: "center", padding: 28, gap: 10 },
  title: { color: "#fff", fontSize: 22, fontWeight: "800", textAlign: "center", marginTop: 8 },
  body: { color: "#E8D5A3", fontSize: 14, textAlign: "center", lineHeight: 20 },
  main: { backgroundColor: GOLD, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 13, marginTop: 14 },
  mainText: { color: NAVY, fontWeight: "800", fontSize: 15 },
  second: { paddingVertical: 10 },
  secondText: { color: GOLD, fontWeight: "700", fontSize: 14 },
  detail: { color: "rgba(255,255,255,0.45)", fontSize: 11, textAlign: "center", marginTop: 6 },
})
