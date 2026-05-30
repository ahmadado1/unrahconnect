import { useTheme } from "@/context/themeContext"
import { getHajjProgress, markHajjPhaseComplete } from "@/lib/supabase"
import { Ionicons } from "@expo/vector-icons"
import { useLocalSearchParams, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const phasesData = [
  {
    id: "1", title: "Preparation & Ihram", color: "#E6F1FB", textColor: "#0C447C", duration: "1 day",
    description: "Prepare yourself spiritually and physically for Hajj. Enter the state of Ihram at the Miqat with full intention and begin reciting the Talbiyah.",
    steps: ["Make sincere intention for Hajj", "Perform Ghusl (full body purification bath)", "Men wear two white unstitched sheets. Women wear normal modest clothing", "Pray 2 rakats of Ihram sunnah prayer", "Make the Niyyah for Hajj at the Miqat", "Begin reciting the Talbiyah"],
    duas: [{ title: "Niyyah for Hajj", arabic: "لَبَّيْكَ اللَّهُمَّ حَجًّا", transliteration: "Labbayka Allahumma Hajjan", translation: "Here I am O Allah, for Hajj" }, { title: "Talbiyah", arabic: "لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ", transliteration: "Labbayk Allahumma labbayk, labbayk la sharika laka labbayk", translation: "Here I am O Allah, here I am. You have no partner, here I am." }],
    tips: ["Keep reciting Talbiyah throughout Hajj until you stone the Jamarat", "Prepare mentally — Hajj is physically and spiritually demanding", "Travel light and wear comfortable shoes"],
  },
  {
    id: "2", title: "Arriving in Makkah", color: "#E1F5EE", textColor: "#085041", duration: "1 day",
    description: "Upon arriving in Makkah perform Tawaf Al-Qudum (arrival Tawaf) and Sa'i if you are performing Hajj Qiran or Ifrad.",
    steps: ["Enter Makkah reciting the dua for entering a city", "Proceed to Masjid Al-Haram", "Perform Tawaf Al-Qudum — 7 rounds around the Kaaba", "Drink Zamzam water", "Perform Sa'i between Safa and Marwa if applicable", "Settle in your accommodation and rest"],
    duas: [{ title: "Dua upon entering Makkah", arabic: "اللَّهُمَّ هَذَا حَرَمُكَ وَأَمْنُكَ فَحَرِّمْنِي عَلَى النَّارِ", transliteration: "Allahumma hadha haramuka wa amnuka faharrimni alan-nar", translation: "O Allah this is Your sanctuary, so forbid my flesh to the Hellfire" }],
    tips: ["Rest well — the hardest days are ahead", "Stay hydrated and keep water with you at all times", "Familiarize yourself with the area around the Haram"],
  },
  {
    id: "3", title: "Day of Tarwiyah — Mina", color: "#FAEEDA", textColor: "#633806", duration: "1 day",
    description: "On the 8th of Dhul Hijjah travel to Mina and spend the night there in worship and preparation for the Day of Arafah.",
    steps: ["After Fajr on 8th Dhul Hijjah travel to Mina", "Pray Dhuhr, Asr, Maghrib, Isha and Fajr in Mina", "Shorten prayers to 2 rakats (Qasr) but do not combine them", "Spend the night in Mina in worship and dua", "Prepare mentally and spiritually for the Day of Arafah"],
    duas: [{ title: "Talbiyah — continue reciting", arabic: "لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ", transliteration: "Labbayk Allahumma labbayk", translation: "Here I am O Allah, here I am" }],
    tips: ["Sleep early — the Day of Arafah is the most important day", "Keep making dhikr and Talbiyah throughout", "Stay in your tent and avoid unnecessary movement"],
  },
  {
    id: "4", title: "Day of Arafah", color: "#FAECE7", textColor: "#712B13", duration: "1 day",
    description: "The 9th of Dhul Hijjah — the most important day of Hajj. Standing at Arafah is the pillar of Hajj. Missing it means missing Hajj entirely.",
    steps: ["Travel to Arafah after Fajr prayer", "Combine and shorten Dhuhr and Asr prayers", "Stand at Arafah from after Dhuhr until sunset — make constant dua", "Face the Qibla and raise your hands in supplication", "After sunset travel to Muzdalifah — do not leave before sunset", "Pray Maghrib and Isha combined at Muzdalifah"],
    duas: [{ title: "Best dua on Day of Arafah", arabic: "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ", transliteration: "La ilaha illallah wahdahu la sharika lah, lahul mulku wa lahul hamdu wa huwa ala kulli shay'in qadir", translation: "There is no god but Allah alone, no partner has He. His is the dominion and His is the praise and He is powerful over everything." }],
    tips: ["This is the day Allah boasts about His servants to the angels — make as much dua as possible", "Ask for forgiveness for yourself your family and the entire Ummah", "Do not waste a single moment — this day comes once a year"],
  },
  {
    id: "5", title: "Muzdalifah", color: "#EEEDFE", textColor: "#3C3489", duration: "1 night",
    description: "After Arafah spend the night at Muzdalifah under the open sky. Collect pebbles for the Jamarat and pray Fajr before departing to Mina.",
    steps: ["Arrive at Muzdalifah after sunset from Arafah", "Pray Maghrib and Isha combined", "Collect 49 or 70 pebbles (size of a chickpea) for the Jamarat", "Sleep under the open sky", "Pray Fajr at Muzdalifah", "Depart to Mina after Fajr — the weak may leave after midnight"],
    duas: [{ title: "Dua at Muzdalifah", arabic: "اللَّهُمَّ إِنَّكَ قُلْتَ ادْعُونِي أَسْتَجِبْ لَكُمْ", transliteration: "Allahumma innaka qulta ud'uni astajib lakum", translation: "O Allah You have said call upon Me and I will respond to you" }],
    tips: ["The night at Muzdalifah is short — rest as much as you can", "Collect pebbles carefully — they should be small not large", "The elderly and sick may depart after midnight"],
  },
  {
    id: "6", title: "Day of Eid — Jamarat", color: "#FBEAF0", textColor: "#72243E", duration: "1 day",
    description: "The 10th of Dhul Hijjah — Eid Al-Adha. Stone the large Jamarat, perform the sacrifice, shave or trim your hair, and perform Tawaf Al-Ifadah.",
    steps: ["Stone the large Jamarat (Jamarat Al-Aqabah) with 7 pebbles", "Say Allahu Akbar with each throw", "Perform the sacrifice (Udhiyah/Hady)", "Shave head (men) or trim hair (women) — exit partial Ihram", "Perform Tawaf Al-Ifadah (obligatory Tawaf)", "Perform Sa'i if not done earlier", "Return to Mina for the nights of Tashreeq"],
    duas: [{ title: "When stoning the Jamarat", arabic: "اللَّهُ أَكْبَرُ", transliteration: "Allahu Akbar", translation: "Allah is the Greatest — said with each pebble thrown" }],
    tips: ["Stone the Jamarat early morning to avoid crowds", "Do the actions in order — stoning then sacrifice then shaving then Tawaf", "After shaving all Ihram restrictions are lifted except marital relations until Tawaf"],
    femaleNote: "Women do NOT shave — only cut a fingertip length from the ends of hair.",
  },
  {
    id: "7", title: "Days of Tashreeq", color: "#FAECE7", textColor: "#712B13", duration: "2-3 days",
    description: "The 11th, 12th and 13th of Dhul Hijjah. Stay in Mina and stone all three Jamarat each day. These are days of eating drinking and remembrance of Allah.",
    steps: ["Stone all three Jamarat each day — small, medium and large", "Throw 7 pebbles at each Jamarat — 21 pebbles per day", "Stone after Dhuhr time each day", "Those leaving early may depart on the 12th before sunset", "Those staying must stone on the 13th as well", "Spend nights in Mina"],
    duas: [{ title: "When stoning the Jamarat", arabic: "اللَّهُ أَكْبَرُ", transliteration: "Allahu Akbar", translation: "Allah is the Greatest — said with each pebble thrown" }],
    tips: ["Stone after Dhuhr — before Dhuhr is not valid on these days", "If you leave on the 12th depart before sunset otherwise you must stone on the 13th", "Make abundant dhikr and dua during these blessed days"],
  },
  {
    id: "8", title: "Tawaf Al-Wadaa", color: "#E1F5EE", textColor: "#085041", duration: "Few hours",
    description: "The farewell Tawaf — the last act of Hajj before leaving Makkah. It is obligatory for all pilgrims except women in their menstrual cycle.",
    steps: ["Perform 7 rounds of Tawaf around the Kaaba", "This should be the last thing you do before leaving Makkah", "Do not stay in Makkah long after the farewell Tawaf", "Make dua and bid farewell to the Kaaba", "Leave Makkah with a heavy heart hoping to return"],
    duas: [{ title: "Dua when leaving Makkah", arabic: "اللَّهُمَّ إِنَّ هَذَا الْبَيْتَ بَيْتُكَ وَالْعَبْدُ عَبْدُكَ", transliteration: "Allahumma innal bayta baytuka wal abdu abduka", translation: "O Allah this house is Your house and the servant is Your servant" }],
    tips: ["The farewell Tawaf should be your last act before departing", "Women in their menstrual cycle are excused from Tawaf Al-Wadaa", "Make abundant dua — you may not return to this blessed place"],
  },
  {
    id: "9", title: "Hajj Complete", color: "#E6F1FB", textColor: "#0C447C", duration: "Done!",
    description: "Alhamdulillah! You have completed your Hajj. May Allah accept it from you and grant you a Mabrur Hajj whose reward is nothing but Jannah.",
    steps: ["Make abundant dua — your Hajj is complete", "Return home and maintain the spiritual transformation", "Keep the good habits you developed during Hajj", "Share the experience with your family and community", "Continue making dua for acceptance"],
    duas: [{ title: "Dua for acceptance", arabic: "رَبَّنَا تَقَبَّلْ مِنَّا إِنَّكَ أَنْتَ السَّمِيعُ الْعَلِيمُ", transliteration: "Rabbana taqabbal minna innaka Anta-s-Sami'ul-'Alim", translation: "Our Lord accept from us, indeed You are the All-Hearing the All-Knowing" }],
    tips: ["A Mabrur Hajj has no reward except Jannah", "Maintain your good deeds after Hajj — this is a sign of acceptance", "Make dua for the entire Ummah"],
  },
]

const phaseOrder = [
  { id: "1", title: "Preparation & Ihram" },
  { id: "2", title: "Arriving in Makkah" },
  { id: "3", title: "Day of Tarwiyah — Mina" },
  { id: "4", title: "Day of Arafah" },
  { id: "5", title: "Muzdalifah" },
  { id: "6", title: "Day of Eid — Jamarat" },
  { id: "7", title: "Days of Tashreeq" },
  { id: "8", title: "Tawaf Al-Wadaa" },
  { id: "9", title: "Hajj Complete" },
]

export default function PhaseDetailScreen() {
  const { hajj } = useLocalSearchParams<{ hajj?: string | string[] }>()
  const phaseId = Array.isArray(hajj) ? hajj[0] : hajj
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { theme } = useTheme()
  const data = phasesData.find(p => p.id === phaseId)
  const currentIndex = phaseOrder.findIndex(p => p.id === phaseId)
  const nextPhase = phaseOrder[currentIndex + 1]
  const [isCompleted, setIsCompleted] = useState(false)
  const { t } = useTranslation()

  useEffect(() => {
    const checkProgress = async () => {
      const progress = await getHajjProgress()
      setIsCompleted(progress.includes(phaseId ?? ""))
    }
    checkProgress()
  }, [])

  const handleMarkComplete = async () => {
    const newState = await markHajjPhaseComplete(phaseId ?? "")
    setIsCompleted(newState ?? false)
  }

  if (!data) {
    return (
      <View style={styles.notFound}>
        <Text style={{ color: theme.text }}>Phase not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: "#C9A84C" }}>Go back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" backgroundColor={data.textColor} />

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header — uses phase color, always colorful */}
        <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: data.textColor }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={[styles.phaseNumBig, { backgroundColor: data.color }]}>
            <Text style={[styles.phaseNumText, { color: data.textColor }]}>{data.id}</Text>
          </View>
          <Text style={styles.headerTitle}>{data.title}</Text>
          <Text style={styles.headerDuration}>⏱ {data.duration}</Text>
        </View>

        <View style={styles.content}>

          {/* Description */}
          <Text style={[styles.description, { color: theme.textSecondary }]}>{data.description}</Text>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* Steps */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("whatToDo")}</Text>
          {data.steps.map((step, index) => (
            <View key={index} style={styles.stepRow}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{index + 1}</Text>
              </View>
              <Text style={[styles.stepText, { color: theme.textSecondary }]}>{step}</Text>
            </View>
          ))}

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* Duas */}
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

          {/* Tips */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("tips")}</Text>
          {data.tips.map((tip, index) => (
            <View key={index} style={styles.tipRow}>
              <Ionicons name="checkmark-circle" size={18} color="#C9A84C" />
              <Text style={[styles.tipText, { color: theme.textSecondary }]}>{tip}</Text>
            </View>
          ))}

        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* Next step */}
        <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
          {nextPhase ? (
            <TouchableOpacity style={styles.nextBtn} onPress={() => router.push(`/hajj/${nextPhase.id}`)}>
              <View style={styles.nextBtnContent}>
                <View>
                  <Text style={styles.nextBtnLabel}>{t("nextStep")}</Text>
                  <Text style={styles.nextBtnTitle}>{nextPhase.title}</Text>
                </View>
                <Ionicons name="arrow-forward-circle" size={32} color="#C9A84C" />
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.completionBox}>
              <Text style={styles.completionEmoji}>🎉</Text>
              <Text style={styles.completionTitle}>{t("hajjComplete")}</Text>
              <Text style={styles.completionText}>{t("hajjCompleteMsg")}</Text>
            </View>
          )}
        </View>

        {/* Mark as complete button */}
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
      </ScrollView>
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
  stepRow: { flexDirection: "row", gap: 12, marginBottom: 12, alignItems: "flex-start" },
  stepNum: { width: 26, height: 26, borderRadius: 13, backgroundColor: "#1E3A5F", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 },
  stepNumText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  stepText: { flex: 1, fontSize: 14, lineHeight: 22 },
  duaCard: { borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 0.5 },
  duaTitle: { fontSize: 12, fontWeight: "bold", marginBottom: 10 },
  duaArabic: { fontSize: 20, textAlign: "right", lineHeight: 36, marginBottom: 8 },
  duaTranslit: { fontSize: 13, color: "#C9A84C", fontStyle: "italic", marginBottom: 8 },
  duaDivider: { height: 0.5, marginBottom: 8 },
  duaTranslation: { fontSize: 13, lineHeight: 20 },
  tipRow: { flexDirection: "row", gap: 10, marginBottom: 10, alignItems: "flex-start" },
  tipText: { flex: 1, fontSize: 14, lineHeight: 22 },
  completeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "green", marginHorizontal: 20, borderRadius: 25, padding: 14, marginBottom: 12 },
  completeBtnDone: { backgroundColor: "#C9A84C" },
  completeBtnText: { color: "#fff", fontSize: 15, fontWeight: "bold" },
  completeBtnTextDone: { color: "#1E3A5F" },
  nextBtn: { backgroundColor: "#1E3A5F", borderRadius: 14, padding: 16, marginTop: 4 },
  nextBtnContent: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  nextBtnLabel: { color: "#C9A84C", fontSize: 12, fontWeight: "600", marginBottom: 4 },
  nextBtnTitle: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  completionBox: { backgroundColor: "#1E3A5F", borderRadius: 14, padding: 24, alignItems: "center" },
  completionEmoji: { fontSize: 48, marginBottom: 12 },
  completionTitle: { color: "#C9A84C", fontSize: 20, fontWeight: "bold", marginBottom: 8 },
  completionText: { color: "rgba(255,255,255,0.8)", fontSize: 14, textAlign: "center", lineHeight: 22 },
})