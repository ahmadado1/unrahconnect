import { AnimatedHeroIcon } from "@/components/AnimatedHeroIcon"
import { AppIcon, ICON_GOLD } from "@/components/AppIcon"
import JourneyHelpLinks from "@/app/components/JourneyHelpLinks"
import PhaseStepsSection from "@/app/components/PhaseStepsSection"
import MadinahPlacesSection from "@/app/components/MadinahPlacesSection"
import { useTheme } from "@/context/themeContext"
import phaseStructure from "@/app/data/phaseStructure.json"
import { resolvePhase } from "@/lib/resolvePhase"
import { getUmrahProgress, markPhaseComplete, supabase } from "@/lib/supabase"
import { Ionicons } from "@expo/vector-icons"
import { useFocusEffect } from "@react-navigation/native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { BackHandler, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import Animated, { useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const umrahPhases = phaseStructure.umrah
const phaseOrder = umrahPhases.map((p) => ({
  id: p.id,
  titleKey: `phase_umrah_${p.id}_title` as const,
}))

export default function PhaseDetailScreen() {
  const { phase } = useLocalSearchParams<{ phase?: string | string[] }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { theme } = useTheme()
  const { t } = useTranslation()
  const phaseId = Array.isArray(phase) ? phase[0] : phase
  const rawPhase = umrahPhases.find((p) => p.id === phaseId)
  const data = useMemo(
    () => rawPhase ? resolvePhase(rawPhase, t, `phase_umrah_${rawPhase.id}_title`) : null,
    [rawPhase, t],
  )
  const currentIndex = phaseOrder.findIndex((p) => p.id === phaseId)
  const nextPhase = phaseOrder[currentIndex + 1]
  const [isCompleted, setIsCompleted] = useState(false)
  const [gender, setGender] = useState<"male" | "female">("male")
  const scrollY = useSharedValue(0)
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y
    },
  })

  useEffect(() => {
    const checkProgress = async () => {
      const progress = await getUmrahProgress()
      setIsCompleted(progress.includes(phaseId ?? ""))
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setGender(user.user_metadata?.gender || "male")
    }
    checkProgress()
  }, [phaseId])

  const handleMarkComplete = async () => {
    const newState = await markPhaseComplete(phaseId ?? "")
    setIsCompleted(newState ?? false)
  }

  const goToUmrahGuide = useCallback(() => {
    router.navigate("/umrah-guide")
  }, [router])

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        goToUmrahGuide()
        return true
      }
      const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress)
      return () => sub.remove()
    }, [goToUmrahGuide])
  )

  if (!data) {
    return (
      <View style={styles.notFound}>
        <Text style={{ color: theme.text }}>{t("phaseNotFound")}</Text>
        <TouchableOpacity onPress={goToUmrahGuide}>
          <Text style={{ color: "#C9A84C" }}>{t("goBack")}</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" backgroundColor={data.textColor} />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: data.textColor }]}>
          <TouchableOpacity onPress={goToUmrahGuide} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={[styles.phaseNumBig, { backgroundColor: data.color }]}>
            <Text style={[styles.phaseNumText, { color: data.textColor }]}>{data.id}</Text>
          </View>
          <Text style={styles.headerTitle}>{data.title}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <AppIcon name="timer" size={16} color="rgba(255,255,255,0.85)" />
            <Text style={styles.headerDuration}>{data.duration}</Text>
          </View>
        </View>

        <View style={styles.content}>
          {phaseId !== "4" ? (
            <Text style={[styles.description, { color: theme.textSecondary }]}>{data.description}</Text>
          ) : null}

          {gender === "female" && data.femaleNote && (
            <View style={styles.femaleNote}>
              <Ionicons name="information-circle" size={18} color="#1E3A5F" />
              <Text style={styles.femaleNoteText}>{data.femaleNote}</Text>
            </View>
          )}

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {phaseId === "1" ? (
            <MadinahPlacesSection badgeColor={data.textColor} />
          ) : rawPhase ? (
            <PhaseStepsSection
              journey="umrah"
              phaseId={phaseId ?? ""}
              stepsKeys={rawPhase.stepsKeys}
              data={data}
              scrollY={scrollY}
              showIntro={phaseId === "4"}
            />
          ) : null}

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("duas")}</Text>
          {data.duas.map((dua, index) => (
            <View key={index} style={[styles.duaCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.duaTitle, { color: theme.textSecondary }]}>{dua.title}</Text>
              <Text style={[styles.duaArabic, { color: theme.text }]}>{dua.arabic}</Text>
              <Text style={styles.duaTranslit}>{dua.transliteration}</Text>
              <View style={[styles.duaDivider, { backgroundColor: theme.border }]} />
              <Text style={[styles.duaTranslation, { color: theme.textSecondary }]}>{dua.translation}</Text>
            </View>
          ))}

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("tips")}</Text>
          {data.tips.map((tip, index) => (
            <View key={index} style={styles.tipRow}>
              <Ionicons name="checkmark-circle" size={18} color="#C9A84C" />
              <View style={styles.tipContent}>
                <Text style={[styles.tipText, { color: theme.textSecondary }]}>{tip.text}</Text>
                {tip.arabic ? (
                  <View style={[styles.tipDuaBlock, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    <Text style={styles.tipDuaArabic}>{tip.arabic}</Text>
                    {tip.transliteration ? (
                      <Text style={styles.tipDuaTranslit}>{tip.transliteration}</Text>
                    ) : null}
                    {tip.translation ? (
                      <Text style={[styles.tipDuaTranslation, { color: theme.textSecondary }]}>
                        {tip.translation}
                      </Text>
                    ) : null}
                    {tip.citation ? (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 }}>
                        <AppIcon name="book" size={12} color="#C9A84C" />
                        <Text style={styles.tipCitation}>{tip.citation}</Text>
                      </View>
                    ) : null}
                  </View>
                ) : tip.citation ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 }}>
                    <AppIcon name="book" size={12} color="#C9A84C" />
                    <Text style={styles.tipCitation}>{tip.citation}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          ))}

          {phaseId ? (
            <>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <JourneyHelpLinks journey="umrah" phaseId={phaseId} />
            </>
          ) : null}
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
          {nextPhase ? (
            <TouchableOpacity style={styles.nextBtn} onPress={() => router.push(`/umrah/${nextPhase.id}`)}>
              <View style={styles.nextBtnContent}>
                <View>
                  <Text style={styles.nextBtnLabel}>{t("nextStep")}</Text>
                  <Text style={styles.nextBtnTitle}>{t(nextPhase.titleKey)}</Text>
                </View>
                <Ionicons name="arrow-forward-circle" size={32} color="#C9A84C" />
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.completionBox}>
              <AnimatedHeroIcon name="trophy" size={48} accent="gold" style={{ marginBottom: 8 }} />
              <Text style={styles.completionTitle}>{t("umrahComplete")}</Text>
              <Text style={styles.completionText}>{t("umrahCompleteMsg")}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.completeBtn, isCompleted && styles.completeBtnDone]}
          onPress={handleMarkComplete}
        >
          <Ionicons name={isCompleted ? "checkmark-circle" : "checkmark-circle-outline"} size={22} color={isCompleted ? "#1E3A5F" : "#fff"} />
          <Text style={[styles.completeBtnText, isCompleted && styles.completeBtnTextDone]}>
            {isCompleted ? t("completed") : t("markComplete")}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 50 }} />
      </Animated.ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { padding: 20, paddingBottom: 28 },
  backBtn: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, padding: 8, alignSelf: "flex-start", marginBottom: 16 },
  phaseNumBig: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  phaseNumText: { fontSize: 22, fontWeight: "bold" },
  headerTitle: { color: "#fff", fontSize: 26, fontWeight: "bold", marginBottom: 4 },
  headerDuration: { color: "rgba(255,255,255,0.7)", fontSize: 13 },
  content: { padding: 20 },
  description: { fontSize: 15, lineHeight: 24, marginBottom: 4 },
  divider: { height: 0.5, marginVertical: 20 },
  sectionTitle: { fontSize: 17, fontWeight: "bold", marginBottom: 14 },
  femaleNote: { flexDirection: "row", gap: 8, backgroundColor: "#E6F1FB", borderRadius: 10, padding: 12, marginTop: 12, alignItems: "flex-start" },
  femaleNoteText: { flex: 1, fontSize: 13, color: "#0C447C", lineHeight: 20 },
  duaCard: { borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 0.5 },
  duaTitle: { fontSize: 12, fontWeight: "bold", marginBottom: 10 },
  duaArabic: { fontSize: 20, textAlign: "right", lineHeight: 36, marginBottom: 8 },
  duaTranslit: { fontSize: 13, color: "#C9A84C", fontStyle: "italic", marginBottom: 8 },
  duaDivider: { height: 0.5, marginBottom: 8 },
  duaTranslation: { fontSize: 13, lineHeight: 20 },
  tipRow: { flexDirection: "row", gap: 10, marginBottom: 10, alignItems: "flex-start" },
  tipContent: { flex: 1, gap: 4 },
  tipText: { fontSize: 14, lineHeight: 22 },
  tipDuaBlock: {
    borderRadius: 10,
    borderWidth: 0.5,
    padding: 12,
    gap: 8,
    marginTop: 4,
  },
  tipDuaArabic: {
    fontSize: 20,
    textAlign: "center",
    lineHeight: 34,
    color: "#1E3A5F",
  },
  tipDuaTranslit: {
    fontSize: 13,
    color: "#C9A84C",
    fontStyle: "italic",
    lineHeight: 20,
    textAlign: "center",
  },
  tipDuaTranslation: { fontSize: 13, lineHeight: 20, textAlign: "center" },
  tipCitation: { fontSize: 11, lineHeight: 16, color: "#C9A84C", fontStyle: "italic" },
  completeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "green", marginHorizontal: 20, borderRadius: 25, padding: 14, marginBottom: 12 },
  completeBtnDone: { backgroundColor: "#C9A84C" },
  completeBtnText: { color: "#fff", fontSize: 15, fontWeight: "bold" },
  completeBtnTextDone: { color: "#1E3A5F" },
  nextBtn: { backgroundColor: "#1E3A5F", borderRadius: 14, padding: 16, marginTop: 4 },
  nextBtnContent: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  nextBtnLabel: { color: "#C9A84C", fontSize: 12, fontWeight: "600", marginBottom: 4 },
  nextBtnTitle: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  completionBox: { backgroundColor: "#1E3A5F", borderRadius: 14, padding: 24, alignItems: "center" },
  completionTitle: { color: "#C9A84C", fontSize: 20, fontWeight: "bold", marginBottom: 8 },
  completionText: { color: "rgba(255,255,255,0.8)", fontSize: 14, textAlign: "center", lineHeight: 22 },
})
