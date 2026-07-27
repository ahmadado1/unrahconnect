import { getAdhkarList } from "@/lib/adhkarData"
import { useTheme } from "@/context/themeContext"
import {
  ScheherazadeNew_400Regular,
  ScheherazadeNew_700Bold,
  useFonts,
} from "@expo-google-fonts/scheherazade-new"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Ionicons } from "@expo/vector-icons"
import * as Haptics from "expo-haptics"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"
const GREEN = "#2D6A4F"

function todayKey() {
  return new Date().toDateString()
}

function storageKey(period) {
  return `adhkar_progress_${period}_${todayKey()}`
}

/**
 * Shared Morning / Evening Adhkar UI
 * @param {"morning"|"evening"} period
 */
export default function AdhkarScreen({ period }) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { theme, isDark } = useTheme()
  const { t } = useTranslation()
  const list = useMemo(() => getAdhkarList(period), [period])

  const [fontsLoaded] = useFonts({
    ScheherazadeNew_400Regular,
    ScheherazadeNew_700Bold,
  })

  /** remaining taps per id; 0 = completed */
  const [remaining, setRemaining] = useState(null)

  const loadProgress = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(storageKey(period))
      if (raw) {
        setRemaining(JSON.parse(raw))
        return
      }
    } catch {}
    const initial = {}
    list.forEach((item) => {
      initial[item.id] = item.count
    })
    setRemaining(initial)
  }, [period, list])

  useEffect(() => {
    loadProgress()
  }, [loadProgress])

  const persist = async (next) => {
    setRemaining(next)
    try {
      await AsyncStorage.setItem(storageKey(period), JSON.stringify(next))
    } catch {}
  }

  const completedCount = useMemo(() => {
    if (!remaining) return 0
    return list.filter((item) => (remaining[item.id] ?? item.count) <= 0).length
  }, [remaining, list])

  const allComplete = remaining && completedCount === list.length
  const progress = list.length ? completedCount / list.length : 0

  const handleTap = async (item) => {
    if (!remaining) return
    const left = remaining[item.id] ?? item.count
    if (left <= 0) {
      await Haptics.selectionAsync()
      return
    }

    const nextLeft = left - 1
    const next = { ...remaining, [item.id]: nextLeft }
    await persist(next)

    if (nextLeft <= 0) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
  }

  const resetAll = async () => {
    const initial = {}
    list.forEach((item) => {
      initial[item.id] = item.count
    })
    await persist(initial)
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
  }

  const titleAr = period === "evening" ? "أذكار المساء" : "أذكار الصباح"
  const titleEn =
    period === "evening" ? t("eveningAdhkar") : t("morningAdhkar")
  const headerEmoji = period === "evening" ? "🌙" : "🌅"

  if (!fontsLoaded || !remaining) {
    return (
      <View style={[styles.screen, styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={GOLD} />
      </View>
    )
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerEmoji}>{headerEmoji}</Text>
            <Text style={styles.headerTitleAr}>{titleAr}</Text>
            <Text style={styles.headerTitleEn}>{titleEn}</Text>
          </View>
          <TouchableOpacity onPress={resetAll} style={styles.backBtn} accessibilityLabel={t("reset")}>
            <Ionicons name="refresh" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.progressLabel}>
          {t("adhkarProgress", { done: completedCount, total: list.length })}
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {allComplete && (
          <View style={styles.completeBanner}>
            <Text style={styles.completeBannerText}>{t("adhkarAllComplete")}</Text>
          </View>
        )}

        {list.map((item) => {
          const left = remaining[item.id] ?? item.count
          const done = left <= 0
          return (
            <View
              key={item.id}
              style={[
                styles.card,
                {
                  backgroundColor: done
                    ? isDark
                      ? "rgba(45,106,79,0.25)"
                      : "rgba(45,106,79,0.08)"
                    : theme.card,
                  borderColor: done ? GREEN : theme.border,
                },
              ]}
            >
              <View style={[styles.goldBar, { backgroundColor: done ? GREEN : GOLD }]} />

              <View style={styles.cardBody}>
                <Text
                  style={[
                    styles.arabic,
                    { color: theme.text },
                    fontsLoaded && { fontFamily: "ScheherazadeNew_700Bold" },
                  ]}
                >
                  {item.arabic}
                </Text>

                <Text style={styles.source}>{item.source}</Text>
                <Text style={[styles.benefit, { color: theme.textSecondary }]}>
                  {item.benefit}
                </Text>
                <Text style={[styles.translit, { color: theme.textSecondary }]}>
                  {item.transliteration}
                </Text>
                <Text style={[styles.translation, { color: theme.text }]}>
                  {item.translation}
                </Text>

                <View style={styles.cardFooter}>
                  <Text style={[styles.doneLabel, { color: done ? GREEN : theme.textSecondary }]}>
                    {done ? t("adhkarCompleted") : t("adhkarTapToCount")}
                  </Text>

                  <TouchableOpacity
                    onPress={() => handleTap(item)}
                    activeOpacity={0.85}
                    style={[
                      styles.countBtn,
                      { backgroundColor: done ? GREEN : GOLD },
                    ]}
                  >
                    {done ? (
                      <Ionicons name="checkmark" size={28} color="#fff" />
                    ) : (
                      <Text style={styles.countBtnText}>×{left}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )
        })}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: { alignItems: "center", justifyContent: "center" },
  header: {
    backgroundColor: NAVY,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerEmoji: { fontSize: 22, marginBottom: 2 },
  headerTitleAr: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  headerTitleEn: {
    color: GOLD,
    fontSize: 13,
    marginTop: 2,
    textAlign: "center",
  },
  progressLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    marginBottom: 8,
    textAlign: "center",
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.15)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: GOLD,
    borderRadius: 3,
  },
  content: { padding: 16 },
  completeBanner: {
    backgroundColor: "rgba(45,106,79,0.12)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GREEN,
    padding: 14,
    marginBottom: 14,
    alignItems: "center",
  },
  completeBannerText: {
    color: GREEN,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  card: {
    borderRadius: 16,
    borderWidth: 0.5,
    marginBottom: 14,
    overflow: "hidden",
    flexDirection: "row",
  },
  goldBar: { width: 4 },
  cardBody: { flex: 1, padding: 16 },
  arabic: {
    fontSize: 22,
    lineHeight: 40,
    textAlign: "right",
    writingDirection: "rtl",
    marginBottom: 10,
  },
  source: {
    color: GOLD,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "right",
    writingDirection: "rtl",
    marginBottom: 4,
  },
  benefit: {
    fontSize: 12,
    fontStyle: "italic",
    textAlign: "right",
    writingDirection: "rtl",
    marginBottom: 10,
    lineHeight: 18,
  },
  translit: {
    fontSize: 13,
    marginBottom: 4,
    lineHeight: 18,
  },
  translation: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  doneLabel: { fontSize: 12, fontWeight: "500", flex: 1, paddingRight: 12 },
  countBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  countBtnText: {
    color: NAVY,
    fontSize: 18,
    fontWeight: "800",
  },
})
