import { markFeatureSeen } from "@/lib/premiumNew"
// Makkah companion (Premium): Tawaf and Sa'i round counters with the Sunnah words for each
// moment, and "My duas" for Tawaf, the Multazam, Arafah and Zamzam.
//
// Note on the duas: the Sunnah has NO fixed dua for each round. The authentic words are at the
// Black Stone, between the Yemeni Corner and the Black Stone, and on Safa and Marwah. In between,
// the pilgrim makes any dua in any language, so the screen shows the user's own duas there.
import PremiumUpsellCard from "@/app/components/PremiumUpsellCard"
import TouchableOpacity from "@/app/components/AppPressable"
import { useTheme } from "@/context/themeContext"
import {
  DUA_PLACES,
  loadCounter,
  loadMyDuas,
  saveCounter,
  saveMyDuas,
  type DuaPlace,
  type MyDua,
  type RitualKind,
} from "@/lib/makkahCompanion"
import { usePremium } from "@/lib/premium"
import { Ionicons } from "@expo/vector-icons"
import * as Haptics from "expo-haptics"
import { useKeepAwake } from "expo-keep-awake"
import { useLocalSearchParams, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"

type Tab = "tawaf" | "sai" | "duas"

// Arabic words of the Sunnah (meanings are translated in i18n).
const AR = {
  bismillah: "بِسْمِ اللَّهِ، وَاللَّهُ أَكْبَرُ",
  rabbana: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً، وَفِي الْآخِرَةِ حَسَنَةً، وَقِنَا عَذَابَ النَّارِ",
  maqam: "وَاتَّخِذُوا مِن مَّقَامِ إِبْرَاهِيمَ مُصَلًّى",
  safa: "إِنَّ الصَّفَا وَالْمَرْوَةَ مِن شَعَائِرِ اللَّهِ، أَبْدَأُ بِمَا بَدَأَ اللَّهُ بِهِ",
  tahlil:
    "اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ. لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ. لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ، أَنْجَزَ وَعْدَهُ، وَنَصَرَ عَبْدَهُ، وَهَزَمَ الْأَحْزَابَ وَحْدَهُ",
  green: "رَبِّ اغْفِرْ وَارْحَمْ، إِنَّكَ أَنْتَ الْأَعَزُّ الْأَكْرَمُ",
}

function DuaBox({ title, ar, meaning, source }: { title: string; ar?: string; meaning?: string; source?: string }) {
  const { theme } = useTheme()
  return (
    <View style={[styles.box, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={styles.boxTitle}>{title}</Text>
      {ar ? <Text style={[styles.ar, { color: theme.text }]}>{ar}</Text> : null}
      {meaning ? <Text style={[styles.meaning, { color: theme.textSecondary }]}>{meaning}</Text> : null}
      {source ? <Text style={styles.source}>{source}</Text> : null}
    </View>
  )
}

function MyDuaList({ duas, place }: { duas: MyDua[]; place: DuaPlace }) {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const list = duas.filter(d => d.place === place && !d.done)
  if (!list.length) return null
  return (
    <View style={[styles.box, { backgroundColor: "rgba(201,168,76,0.08)", borderColor: GOLD }]}>
      <Text style={styles.boxTitle}>{t("mkYourDuas")}</Text>
      {list.map(d => (
        <Text key={d.id} style={[styles.myDuaLine, { color: theme.text }]}>
          • {d.text}
        </Text>
      ))}
    </View>
  )
}

/** Big round counter for Tawaf (7 rounds) and Sa'i (7 laps). */
function Counter({ kind, duas }: { kind: RitualKind; duas: MyDua[] }) {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const [count, setCount] = useState(0)

  useEffect(() => {
    void loadCounter(kind).then(s => setCount(s.count))
  }, [kind])

  const set = (n: number) => {
    const next = Math.max(0, Math.min(7, n))
    setCount(next)
    void saveCounter(kind, next)
  }

  const add = () => {
    if (count >= 7) return
    const next = count + 1
    set(next)
    void Haptics.impactAsync(next === 7 ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium)
    if (next === 7) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  }

  const reset = () =>
    Alert.alert(t("mkResetTitle"), t("mkResetBody"), [
      { text: t("cancel"), style: "cancel" },
      { text: t("mkReset"), style: "destructive", onPress: () => set(0) },
    ])

  const done = count >= 7
  const current = Math.min(7, count + 1) // the round being walked now
  // Sa'i: odd laps go Safa → Marwah, even laps Marwah → Safa. The 7th ends at Marwah.
  const saiFrom = current % 2 === 1 ? t("mkSafa") : t("mkMarwah")
  const saiTo = current % 2 === 1 ? t("mkMarwah") : t("mkSafa")

  return (
    <>
      {/* Seven dots */}
      <View style={styles.dots}>
        {Array.from({ length: 7 }, (_, i) => (
          <View key={i} style={[styles.dot, i < count && styles.dotOn]}>
            <Text style={[styles.dotText, i < count && { color: NAVY }]}>{i + 1}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={[styles.bigBtn, done && styles.bigBtnDone]} onPress={add} disabled={done} accessibilityLabel={t("mkAddRound")}>
        {done ? (
          <>
            <Ionicons name="checkmark-circle" size={44} color={NAVY} />
            <Text style={styles.bigBtnText}>{t(kind === "tawaf" ? "mkTawafDone" : "mkSaiDone")}</Text>
          </>
        ) : (
          <>
            <Text style={styles.bigNumber}>{count}</Text>
            <Text style={styles.bigBtnSmall}>{t("mkOf7")}</Text>
            <Text style={styles.bigBtnText}>{t("mkTapEnd", { n: current })}</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.counterRow}>
        <TouchableOpacity style={styles.smallBtn} onPress={() => set(count - 1)} disabled={count === 0}>
          <Ionicons name="arrow-undo" size={16} color={GOLD} />
          <Text style={styles.smallBtnText}>{t("mkUndo")}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.smallBtn} onPress={reset} disabled={count === 0}>
          <Ionicons name="refresh" size={16} color={GOLD} />
          <Text style={styles.smallBtnText}>{t("mkReset")}</Text>
        </TouchableOpacity>
      </View>

      {/* What to say now */}
      {kind === "tawaf" ? (
        done ? (
          <>
            <DuaBox title={t("mkAfterTawaf")} ar={AR.maqam} meaning={t("mkAfterTawafBody")} source={t("mkSrcMuslim1218")} />
            <MyDuaList duas={duas} place="multazam" />
            <MyDuaList duas={duas} place="zamzam" />
          </>
        ) : (
          <>
            <Text style={[styles.roundTitle, { color: theme.text }]}>{t("mkRoundNow", { n: current })}</Text>
            <DuaBox title={t("mkAtBlackStone")} ar={AR.bismillah} meaning={t("mkAtBlackStoneBody")} source={t("mkSrcBlackStone")} />
            <DuaBox title={t("mkDuringRound")} meaning={t("mkDuringRoundBody")} />
            <MyDuaList duas={duas} place="tawaf" />
            <DuaBox title={t("mkYemeni")} ar={AR.rabbana} meaning={t("mkRabbanaMeaning")} source={t("mkSrcAbuDawud1892")} />
            {current <= 3 ? <Text style={[styles.note, { color: theme.textSecondary }]}>{t("mkRamlNote")}</Text> : null}
          </>
        )
      ) : done ? (
        <DuaBox title={t("mkAfterSai")} meaning={t("mkAfterSaiBody")} />
      ) : (
        <>
          <Text style={[styles.roundTitle, { color: theme.text }]}>{t("mkLapNow", { n: current, from: saiFrom, to: saiTo })}</Text>
          {current === 1 ? <DuaBox title={t("mkStartSafa")} ar={AR.safa} meaning={t("mkStartSafaBody")} source={t("mkSrcMuslim1218")} /> : null}
          <DuaBox title={t("mkOnHill", { hill: saiFrom })} ar={AR.tahlil} meaning={t("mkTahlilMeaning")} source={t("mkSrcMuslim1218")} />
          <DuaBox title={t("mkGreen")} ar={AR.green} meaning={t("mkGreenMeaning")} source={t("mkSrcGreen")} />
          <DuaBox title={t("mkDuringLap")} meaning={t("mkDuringRoundBody")} />
          <MyDuaList duas={duas} place="anytime" />
        </>
      )}
    </>
  )
}

/** Your own duas, sorted by the place you want to make them. */
function MyDuas({ duas, setDuas }: { duas: MyDua[]; setDuas: (d: MyDua[]) => void }) {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const [text, setText] = useState("")
  const [place, setPlace] = useState<DuaPlace>("tawaf")

  const update = (next: MyDua[]) => {
    setDuas(next)
    void saveMyDuas(next)
  }

  const add = () => {
    const value = text.trim()
    if (!value) return
    update([...duas, { id: `${Date.now()}`, text: value, place }])
    setText("")
  }

  return (
    <>
      <Text style={[styles.lead, { color: theme.textSecondary }]}>{t("mkDuasLead")}</Text>
      <View style={[styles.box, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={t("mkDuaPlaceholder")}
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text, borderColor: theme.border }]}
          multiline
        />
        <View style={styles.placeRow}>
          {DUA_PLACES.map(p => (
            <TouchableOpacity key={p} onPress={() => setPlace(p)} style={[styles.chip, place === p && styles.chipOn]}>
              <Text style={[styles.chipText, { color: place === p ? NAVY : theme.text }]}>{t(`mkPlace_${p}`)}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={[styles.addBtn, !text.trim() && { opacity: 0.5 }]} onPress={add} disabled={!text.trim()}>
          <Ionicons name="add" size={18} color={NAVY} />
          <Text style={styles.addText}>{t("mkAddDua")}</Text>
        </TouchableOpacity>
      </View>

      {DUA_PLACES.map(p => {
        const list = duas.filter(d => d.place === p)
        if (!list.length) return null
        return (
          <View key={p} style={{ marginTop: 14 }}>
            <Text style={[styles.groupTitle, { color: theme.text }]}>{t(`mkPlace_${p}`)}</Text>
            {list.map(d => (
              <View key={d.id} style={[styles.duaRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <TouchableOpacity
                  onPress={() => update(duas.map(x => (x.id === d.id ? { ...x, done: !x.done } : x)))}
                  hitSlop={8}
                  accessibilityLabel={t("mkMarkDone")}
                >
                  <Ionicons name={d.done ? "checkmark-circle" : "ellipse-outline"} size={22} color={GOLD} />
                </TouchableOpacity>
                <Text style={[styles.duaText, { color: theme.text }, d.done && styles.duaDone]}>{d.text}</Text>
                <TouchableOpacity onPress={() => update(duas.filter(x => x.id !== d.id))} hitSlop={8} accessibilityLabel={t("mkDelete")}>
                  <Ionicons name="trash-outline" size={18} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )
      })}
      <Text style={[styles.note, { color: theme.textSecondary, marginTop: 16 }]}>{t("mkArafahInfo")}</Text>
    </>
  )
}

export default function MakkahCompanionScreen() {
  // Opened: stop the "New" glow of this Premium feature.
  useEffect(() => {
    void markFeatureSeen("companion")
  }, [])
  useKeepAwake()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { theme } = useTheme()
  const { t } = useTranslation()
  const { isPremium } = usePremium()
  const params = useLocalSearchParams<{ tab?: string }>()
  const [tab, setTab] = useState<Tab>(params.tab === "sai" || params.tab === "duas" ? params.tab : "tawaf")
  const [duas, setDuas] = useState<MyDua[]>([])

  useEffect(() => {
    void loadMyDuas().then(setDuas)
  }, [])

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{t("mkTitle")}</Text>
            <Text style={styles.subtitle}>{t("mkSubtitle")}</Text>
          </View>
        </View>
        <View style={styles.tabs}>
          {(["tawaf", "sai", "duas"] as Tab[]).map(k => (
            <TouchableOpacity key={k} style={[styles.tab, tab === k && styles.tabOn]} onPress={() => setTab(k)}>
              <Text style={[styles.tabText, tab === k && styles.tabTextOn]}>{t(`mkTab_${k}`)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {!isPremium ? (
        <PremiumUpsellCard variant="locked" />
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
            {tab === "duas" ? <MyDuas duas={duas} setDuas={setDuas} /> : <Counter key={tab} kind={tab} duas={duas} />}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { backgroundColor: NAVY, paddingBottom: 14, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTop: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 12 },
  iconBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  title: { color: "#fff", fontSize: 22, fontWeight: "800" },
  subtitle: { color: GOLD, fontSize: 13, marginTop: 2 },
  tabs: { flexDirection: "row", marginHorizontal: 16, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 14, padding: 4, gap: 4 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: "center" },
  tabOn: { backgroundColor: GOLD },
  tabText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  tabTextOn: { color: NAVY },
  dots: { flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 8 },
  dot: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, borderColor: GOLD, alignItems: "center", justifyContent: "center" },
  dotOn: { backgroundColor: GOLD },
  dotText: { color: GOLD, fontWeight: "800" },
  bigBtn: {
    alignSelf: "center",
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
    shadowColor: GOLD,
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    paddingHorizontal: 20,
  },
  bigBtnDone: { backgroundColor: "#E8D5A3" },
  bigNumber: { color: NAVY, fontSize: 64, fontWeight: "800", lineHeight: 70 },
  bigBtnSmall: { color: NAVY, fontSize: 14, fontWeight: "700", opacity: 0.8 },
  bigBtnText: { color: NAVY, fontSize: 14, fontWeight: "800", textAlign: "center", marginTop: 6 },
  counterRow: { flexDirection: "row", justifyContent: "center", gap: 14, marginTop: 16, marginBottom: 8 },
  smallBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1.2, borderColor: GOLD, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  smallBtnText: { color: GOLD, fontWeight: "700" },
  roundTitle: { fontSize: 18, fontWeight: "800", marginTop: 16, marginBottom: 4 },
  box: { borderWidth: 1, borderRadius: 16, padding: 14, marginTop: 10, gap: 8 },
  boxTitle: { color: GOLD, fontSize: 13, fontWeight: "800" },
  ar: { fontSize: 21, lineHeight: 38, textAlign: "right", writingDirection: "rtl" },
  meaning: { fontSize: 14, lineHeight: 20 },
  source: { color: GOLD, fontSize: 11, fontWeight: "600" },
  note: { fontSize: 13, lineHeight: 19, marginTop: 10 },
  lead: { fontSize: 14, lineHeight: 20, marginBottom: 6 },
  myDuaLine: { fontSize: 15, lineHeight: 22 },
  input: { minHeight: 70, borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 15, textAlignVertical: "top" },
  placeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1.2, borderColor: GOLD, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  chipOn: { backgroundColor: GOLD },
  chipText: { fontSize: 13, fontWeight: "700" },
  addBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: GOLD, borderRadius: 999, paddingVertical: 11 },
  addText: { color: NAVY, fontWeight: "800" },
  groupTitle: { fontSize: 15, fontWeight: "800", marginBottom: 6 },
  duaRow: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 0.5, borderRadius: 14, padding: 12, marginBottom: 8 },
  duaText: { flex: 1, fontSize: 15, lineHeight: 21 },
  duaDone: { textDecorationLine: "line-through", opacity: 0.55 },
})
