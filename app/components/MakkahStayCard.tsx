// Home card shown while you are in Makkah (for your whole stay): Tawaf counter, Sa'i counter,
// My duas. Premium; free users see it with a Premium badge (tapping shows the Premium pop-up).
import TouchableOpacity from "@/app/components/AppPressable"
import { AppIcon } from "@/components/AppIcon"
import { checkMakkahStay, stayDay, type MakkahStay } from "@/lib/makkahCompanion"
import { usePremium } from "@/lib/premium"
import NewGlow from "@/app/components/NewGlow"
import { markFeatureSeen } from "@/lib/premiumNew"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useFocusEffect, useRouter } from "expo-router"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, Text, View } from "react-native"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"

export default function MakkahStayCard() {
  const router = useRouter()
  const { t } = useTranslation()
  const { isPremium } = usePremium()
  const [stay, setStay] = useState<MakkahStay | null>(null)

  useFocusEffect(
    useCallback(() => {
      let active = true
      void checkMakkahStay().then(s => active && setStay(s))
      return () => {
        active = false
      }
    }, [])
  )

  // Premium only (free users see the companion described on the Premium screen).
  if (!stay || !isPremium) return null

  const open = (tab: "tawaf" | "sai" | "duas") => {
    void markFeatureSeen("companion")
    router.push({ pathname: "/makkah-companion", params: { tab } } as any)
  }

  const Action = ({ tab, icon, label }: { tab: "tawaf" | "sai" | "duas"; icon: keyof typeof Ionicons.glyphMap; label: string }) => (
    <TouchableOpacity style={styles.action} onPress={() => open(tab)}>
      <Ionicons name={icon} size={20} color={NAVY} />
      <Text style={styles.actionText} numberOfLines={1}>{label}</Text>
    </TouchableOpacity>
  )

  return (
    <NewGlow id="companion" style={styles.wrap} radius={22}>
      <LinearGradient colors={[NAVY, "#2C5282"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
        <View style={styles.top}>
          <View style={styles.icon}>
            <AppIcon name="kaaba" size={20} color={NAVY} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>{t("mkCardKicker", { day: stayDay(stay) })}</Text>
            <Text style={styles.title}>{t("mkCardTitle")}</Text>
          </View>
        </View>
        <View style={styles.actions}>
          <Action tab="tawaf" icon="sync" label={t("mkTab_tawaf")} />
          <Action tab="sai" icon="swap-horizontal" label={t("mkTab_sai")} />
          <Action tab="duas" icon="heart" label={t("mkTab_duas")} />
        </View>
      </LinearGradient>
    </NewGlow>
  )
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: 16, marginTop: 14, borderRadius: 22 },
  card: { borderRadius: 22, padding: 16, gap: 14, borderWidth: 1, borderColor: "rgba(201,168,76,0.5)" },
  top: { flexDirection: "row", alignItems: "center", gap: 12 },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: GOLD, alignItems: "center", justifyContent: "center" },
  kicker: { color: GOLD, fontSize: 12, fontWeight: "800" },
  title: { color: "#fff", fontSize: 17, fontWeight: "800", marginTop: 1 },
  badge: { backgroundColor: GOLD, color: NAVY, fontSize: 10, fontWeight: "800", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, overflow: "hidden" },
  actions: { flexDirection: "row", gap: 8 },
  action: { flex: 1, backgroundColor: GOLD, borderRadius: 14, paddingVertical: 11, alignItems: "center", gap: 4 },
  actionText: { color: NAVY, fontSize: 13, fontWeight: "800" },
})
