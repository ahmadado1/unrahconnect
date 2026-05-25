import { getUmrahProgress, markPhaseComplete, supabase } from "@/lib/supabase"
import { Ionicons } from "@expo/vector-icons"
import { useLocalSearchParams, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useEffect, useState } from "react"
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"


const phasesData = [
  {
    id: "1",
    title: "Madinah Visit",
    color: "#E6F1FB",
    textColor: "#0C447C",
    duration: "1-3 days",
    description: "Most pilgrims begin their journey in Madinah to visit Masjid An-Nabawi and send salawat upon the Prophet ﷺ before proceeding to Makkah for Umrah.",
    steps: [
      "Arrive in Madinah with the intention of visiting Masjid An-Nabawi",
      "Pray in Masjid An-Nabawi — one prayer here equals 1000 prayers elsewhere",
      "Visit Riyad Al Jannah (the Garden of Paradise) between the Prophet's grave and his pulpit",
      "Send salawat upon the Prophet ﷺ at his grave",
      "Visit the graves of the companions at Jannat Al Baqi",
      "Visit Masjid Quba — praying 2 rakats here equals the reward of Umrah",
    ],
    duas: [
      {
        title: "Dua upon entering Masjid An-Nabawi",
        arabic: "اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ",
        transliteration: "Allahumma iftah li abwaba rahmatik",
        translation: "O Allah, open for me the gates of Your mercy",
      },
      {
        title: "Salawat upon the Prophet ﷺ",
        arabic: "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ",
        transliteration: "Allahumma salli ala Muhammad wa ala ali Muhammad",
        translation: "O Allah, send blessings upon Muhammad and the family of Muhammad",
      },
    ],
    tips: [
      "Visit Riyad Al Jannah early morning to avoid crowds",
      "Women should cover fully including face covering recommended near the grave",
      "Stay for at least 2-3 days to benefit fully from the blessings of Madinah",
    ],
  },
  {
    id: "2",
    title: "Entering Ihram",
    color: "#E1F5EE",
    textColor: "#085041",
    duration: "1-2 hours",
    description: "Ihram is the sacred state you must enter before performing Umrah. It begins at the Miqat — the designated boundary — and involves physical and spiritual preparation.",
    steps: [
      "Perform Ghusl (full body purification bath) with the intention of Ihram",
      "Men wear two white unstitched sheets (izar and rida). Women wear their normal modest clothing",
      "Apply perfume to your body only — not to the Ihram garments",
      "Pray 2 rakats of Ihram sunnah prayer",
      "Make the Niyyah (intention) for Umrah at the Miqat",
      "Begin reciting the Talbiyah loudly (men) or quietly (women)",
    ],
    duas: [
      {
        title: "Niyyah for Umrah",
        arabic: "لَبَّيْكَ اللَّهُمَّ عُمْرَةً",
        transliteration: "Labbayka Allahumma Umratan",
        translation: "Here I am O Allah, for Umrah",
      },
      {
        title: "Talbiyah",
        arabic: "لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيكَ لَكَ",
        transliteration: "Labbayk Allahumma labbayk, labbayk la sharika laka labbayk, innal hamda wan-ni'mata laka wal-mulk, la sharika lak",
        translation: "Here I am O Allah, here I am. Here I am, You have no partner, here I am. Verily all praise, grace and sovereignty belong to You. You have no partner.",
      },
    ],
    tips: [
      "Once in Ihram avoid cutting hair, nails, using perfume, or marital relations",
      "Keep reciting Talbiyah until you begin Tawaf",
      "If you accidentally violate Ihram rules, consult a scholar about the expiation",
    ],
    femaleNote: "Women wear their normal modest clothing — any colour. Do not cover the face or hands during Ihram. Recite Talbiyah quietly.",
  },
  {
    id: "3",
    title: "Arriving in Makkah",
    color: "#FAEEDA",
    textColor: "#633806",
    duration: "30 mins",
    description: "Upon arriving in Makkah, you will enter Masjid Al-Haram and see the Kaaba for the first time. This is one of the most powerful spiritual moments of the entire journey.",
    steps: [
      "Enter Makkah reciting the dua for entering a city",
      "Enter Masjid Al-Haram with your right foot and recite the masjid entry dua",
      "When you first see the Kaaba — stop and make dua, this is a moment when duas are accepted",
      "Stop reciting the Talbiyah as you begin Tawaf",
      "Proceed to the Kaaba to begin Tawaf",
    ],
    duas: [
      {
        title: "Dua upon entering Makkah",
        arabic: "اللَّهُمَّ هَذَا حَرَمُكَ وَأَمْنُكَ فَحَرِّمْنِي عَلَى النَّارِ",
        transliteration: "Allahumma hadha haramuka wa amnuka faharrimni alan-nar",
        translation: "O Allah this is Your sanctuary and Your place of safety, so forbid my flesh to the Hellfire",
      },
      {
        title: "Dua upon first seeing the Kaaba",
        arabic: "اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ فَحَيِّنَا رَبَّنَا بِالسَّلَامِ",
        transliteration: "Allahumma Anta-s-Salamu wa minka-s-salamu fa hayyina Rabbana bis-salam",
        translation: "O Allah You are Peace and from You comes peace, so greet us our Lord with peace",
      },
    ],
    tips: [
      "Take your time when you first see the Kaaba — make as much dua as you can",
      "This moment is known to be one of the best times for dua acceptance",
      "Enter the masjid calmly with full focus and presence of heart",
    ],
    femaleNote: "Women do not need to do Raml (brisk walking) or Idtiba (exposing shoulder). Walk at a normal pace throughout all 7 rounds.",
  },
  {
    id: "4",
    title: "Tawaf",
    color: "#FAECE7",
    textColor: "#712B13",
    duration: "1-2 hours",
    description: "Tawaf is the ritual of circling the Kaaba 7 times in an anti-clockwise direction. It begins and ends at the Black Stone (Hajr Al-Aswad).",
    steps: [
      "Make sure you are in a state of wudu (ablution) before starting",
      "Start at the Black Stone (Hajr Al-Aswad) — touch it or point to it saying 'Bismillah Allahu Akbar'",
      "Keep the Kaaba on your LEFT side at all times",
      "Complete 7 rounds — each round starts and ends at the Black Stone",
      "Men should do Idtiba (right shoulder exposed) and Raml (brisk walk) in the first 3 rounds",
      "After 7 rounds pray 2 rakats behind Maqam Ibrahim",
      "Drink Zamzam water",
    ],
    duas: [
      {
        title: "Starting Tawaf at the Black Stone",
        arabic: "بِسْمِ اللَّهِ اللَّهُ أَكْبَرُ",
        transliteration: "Bismillahi Allahu Akbar",
        translation: "In the name of Allah, Allah is the Greatest",
      },
      {
        title: "Dua between Yemeni corner and Black Stone",
        arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
        transliteration: "Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina adhaban-nar",
        translation: "Our Lord give us good in this world and good in the hereafter and save us from the punishment of the Fire",
      },
    ],
    tips: [
      "There is no specific dua required for each round — make any dua from your heart",
      "If you lose count of your rounds, assume the lesser number",
      "Tawaf can be done on the ground floor or upper levels if crowded",
    ],
    femaleNote: "Women do not run between the green lights. Walk at a normal pace for all 7 trips.",
  },
  {
    id: "5",
    title: "Sa'i",
    color: "#EEEDFE",
    textColor: "#3C3489",
    duration: "1-2 hours",
    description: "Sa'i is the ritual of walking between the hills of Safa and Marwa 7 times, commemorating Hajar's search for water for her son Ismail عليه السلام.",
    steps: [
      "Proceed to Mount Safa after completing Tawaf and drinking Zamzam",
      "Climb Safa, face the Kaaba and make dua",
      "Walk towards Marwa — men should run between the green lights",
      "Climb Marwa, face the Kaaba and make dua",
      "This is ONE trip — you need 7 trips total",
      "Safa to Marwa = 1, Marwa to Safa = 2, and so on until you end at Marwa on trip 7",
    ],
    duas: [
      {
        title: "Dua at Mount Safa",
        arabic: "إِنَّ الصَّفَا وَالْمَرْوَةَ مِنْ شَعَائِرِ اللَّهِ",
        transliteration: "Innas-Safa wal-Marwata min sha'a'irillah",
        translation: "Indeed Safa and Marwa are among the symbols of Allah",
      },
      {
        title: "Dua facing the Kaaba at Safa and Marwa",
        arabic: "اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، وَلِلَّهِ الْحَمْدُ",
        transliteration: "Allahu Akbar, Allahu Akbar, Allahu Akbar, wa lillahil hamd",
        translation: "Allah is the Greatest, Allah is the Greatest, Allah is the Greatest, and to Allah belongs all praise",
      },
    ],
    tips: [
      "Wudu is recommended but not required for Sa'i",
      "Count your trips carefully — you must end at Marwa on the 7th",
      "Make personal dua in your own language — Allah hears every language",
    ],
    femaleNote: "Women do NOT shave their head. Cut a fingertip length from the end of your hair only.",
  },
  {
    id: "6",
    title: "Halq / Taqsir",
    color: "#FBEAF0",
    textColor: "#72243E",
    duration: "15 mins",
    description: "After completing Sa'i, you exit the state of Ihram by cutting your hair. This marks the completion of Umrah.",
    steps: [
      "Men — shave the entire head (Halq) which is more rewarding, or cut hair from all parts (Taqsir)",
      "Women — cut a fingertip's length from the ends of their hair only",
      "After cutting hair you exit Ihram and all restrictions are lifted",
      "Change out of Ihram garments into normal clothes",
      "Your Umrah is now complete — Alhamdulillah!",
    ],
    duas: [
      {
        title: "Dua after completing Umrah",
        arabic: "اللَّهُمَّ تَقَبَّلْ مِنَّا إِنَّكَ أَنْتَ السَّمِيعُ الْعَلِيمُ",
        transliteration: "Allahumma taqabbal minna innaka Anta-s-Sami'ul-'Alim",
        translation: "O Allah accept from us, indeed You are the All-Hearing the All-Knowing",
      },
    ],
    tips: [
      "Shaving the head (Halq) is more rewarding than trimming for men",
      "Women should not shave — only trim a small amount",
      "Make dua for acceptance of your Umrah immediately after",
    ],
  },
  {
    id: "7",
    title: "Umrah Complete",
    color: "#E1F5EE",
    textColor: "#085041",
    duration: "Done!",
    description: "Alhamdulillah! You have completed your Umrah. May Allah accept it from you and grant you the reward of a complete and accepted Umrah.",
    steps: [
      "Make abundant dua — your Umrah is now complete",
      "You may now perform optional Tawaf (Tawaf An-Nafl) as many times as you wish",
      "Visit the Kaaba at different times — night Tawaf is especially beautiful",
      "Spend time in dua, Quran recitation and dhikr",
      "If performing Hajj — await the days of Hajj in a state of gratitude",
    ],
    duas: [
      {
        title: "Dua for acceptance",
        arabic: "رَبَّنَا تَقَبَّلْ مِنَّا إِنَّكَ أَنْتَ السَّمِيعُ الْعَلِيمُ",
        transliteration: "Rabbana taqabbal minna innaka Anta-s-Sami'ul-'Alim",
        translation: "Our Lord accept from us, indeed You are the All-Hearing the All-Knowing",
      },
    ],
    tips: [
      "Tawab Al-Nafl (optional Tawaf) is highly recommended during your stay",
      "Spend as much time as possible in the Haram — every step is rewarded",
      "Make dua for yourself family and the entire Ummah",
    ],
  },
]

    // Quick reference for next phase preview
    const phaseOrder = [
      { id: "1", title: "Madinah Visit" },
      { id: "2", title: "Entering Ihram" },
      { id: "3", title: "Arriving in Makkah" },
      { id: "4", title: "Tawaf" },
      { id: "5", title: "Sa'i" },
      { id: "6", title: "Halq / Taqsir" },
      { id: "7", title: "Umrah Complete" },
    ]

export default function PhaseDetailScreen() {
  const { phase } = useLocalSearchParams<{ phase?: string | string[] }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const phaseId = Array.isArray(phase) ? phase[0] : phase
  const data = phasesData.find(p => p.id === phaseId)
  // Find the next phase — if current id is "3", next is "4"
  const currentIndex = phaseOrder.findIndex(p => p.id === phaseId)
  const nextPhase = phaseOrder[currentIndex + 1]
  const [isCompleted, setIsCompleted] = useState(false)
  const [gender, setGender] = useState<"male" | "female">("male")

  // Check if this phase is already marked complete
      useEffect(() => {
        const checkProgress = async () => {
          const progress = await getUmrahProgress()
          setIsCompleted(progress.includes(phaseId ?? ""))
          
          // Also fetch user gender
          const { data: { user } } = await supabase.auth.getUser()
          if (user) setGender(user.user_metadata?.gender || "male")
        }
        checkProgress()
      }, [])
    // Called when user taps the complete button — right after the useEffect above
    const handleMarkComplete = async () => {
      const newState = await markPhaseComplete(phaseId ?? "")
      setIsCompleted(newState ?? false)
    }

  if (!data) {
    return (
      <View style={styles.notFound}>
        <Text>Phase not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: "#C9A84C" }}>Go back</Text>
        </TouchableOpacity>
      </View>
    )
  }

        

      
  return (
    <View style={styles.screen}>
      <StatusBar style="light" backgroundColor={data.textColor}  />
    
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
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
          <Text style={styles.description}>{data.description}</Text>

          {/* Gender specific note — only shows for female users when phase has a female note */}
          {gender === "female" && data.femaleNote && (
            <View style={styles.femaleNote}>
              <Ionicons name="information-circle" size={18} color="#1E3A5F" />
              <Text style={styles.femaleNoteText}>{data.femaleNote}</Text>
            </View>
          )}
          <View style={styles.divider} />

          {/* Steps */}
          <Text style={styles.sectionTitle}>📋 What to do</Text>
          {data.steps.map((step, index) => (
            <View key={index} style={styles.stepRow}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}

          <View style={styles.divider} />

          {/* Duas */}
          <Text style={styles.sectionTitle}>🤲 Duas</Text>
          {data.duas.map((dua, index) => (
            <View key={index} style={styles.duaCard}>
              <Text style={styles.duaTitle}>{dua.title}</Text>
              <Text style={styles.duaArabic}>{dua.arabic}</Text>
              <Text style={styles.duaTranslit}>{dua.transliteration}</Text>
              <View style={styles.duaDivider} />
              <Text style={styles.duaTranslation}>{dua.translation}</Text>
            </View>
          ))}

          <View style={styles.divider} />

          {/* Tips */}
          <Text style={styles.sectionTitle}>💡 Tips</Text>
          {data.tips.map((tip, index) => (
            <View key={index} style={styles.tipRow}>
              <Ionicons name="checkmark-circle" size={18} color="#C9A84C" />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}

    </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Next step section — outside content View, inside ScrollView */}
      <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
        {nextPhase ? (
          <TouchableOpacity
            style={styles.nextBtn}
            onPress={() => router.push(`/umrah/${nextPhase.id}`)}
          >
            <View style={styles.nextBtnContent}>
              <View>
                <Text style={styles.nextBtnLabel}>Next Step</Text>
                <Text style={styles.nextBtnTitle}>{nextPhase.title}</Text>
              </View>
              <Ionicons name="arrow-forward-circle" size={32} color="#C9A84C" />
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.completionBox}>
            <Text style={styles.completionEmoji}>🎉</Text>
            <Text style={styles.completionTitle}>Umrah Complete!</Text>
            <Text style={styles.completionText}>
              May Allah accept your Umrah and grant you the highest reward. Ameen.
            </Text>
          </View>
        )}
      </View>

      {/* Mark as complete button */}
      <TouchableOpacity
          style={[styles.completeBtn, isCompleted && styles.completeBtnDone]}
          onPress={handleMarkComplete}
        >
          <Ionicons
            name={isCompleted ? "checkmark-circle" : "checkmark-circle-outline"}
            size={22}
            color={isCompleted ? "#1E3A5F" : "#fff"}
          />
          <Text style={[styles.completeBtnText, isCompleted && styles.completeBtnTextDone]}>
            {isCompleted ? "Completed ✓" : "Mark as Complete"}
          </Text>
        </TouchableOpacity>

      <View style={{ height: 50 }} />

      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#F5F0E8" },
    notFound: { flex: 1, alignItems: "center", justifyContent: "center" },
  
    header: { padding: 20, paddingBottom: 28 },
    backBtn: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, padding: 8, alignSelf: "flex-start", marginBottom: 16 },
    phaseNumBig: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", marginBottom: 12 },
    phaseNumText: { fontSize: 22, fontWeight: "bold" },
    headerTitle: { color: "#fff", fontSize: 26, fontWeight: "bold", marginBottom: 4 },
    headerDuration: { color: "rgba(255,255,255,0.7)", fontSize: 13 },
  
    content: { padding: 20 },
    description: { fontSize: 15, color: "#444", lineHeight: 24, marginBottom: 4 },
  
    divider: { height: 0.5, backgroundColor: "#E0D9CE", marginVertical: 20 },
  
    sectionTitle: { fontSize: 17, fontWeight: "bold", color: "#1E3A5F", marginBottom: 14 },
  
    stepRow: { flexDirection: "row", gap: 12, marginBottom: 12, alignItems: "flex-start" },
    stepNum: { width: 26, height: 26, borderRadius: 13, backgroundColor: "#1E3A5F", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 },
    stepNumText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
    stepText: { flex: 1, fontSize: 14, color: "#444", lineHeight: 22 },

    femaleNote: { flexDirection: "row", gap: 8, backgroundColor: "#E6F1FB", borderRadius: 10, padding: 12, marginTop: 12, alignItems: "flex-start" },
  femaleNoteText: { flex: 1, fontSize: 13, color: "#0C447C", lineHeight: 20 },
  
    duaCard: { backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 0.5, borderColor: "#E0D9CE" },
    duaTitle: { fontSize: 12, fontWeight: "bold", color: "#888", marginBottom: 10 },
    duaArabic: { fontSize: 20, color: "#1E3A5F", textAlign: "right", lineHeight: 36, marginBottom: 8 },
    duaTranslit: { fontSize: 13, color: "#C9A84C", fontStyle: "italic", marginBottom: 8 },
    duaDivider: { height: 0.5, backgroundColor: "#E0D9CE", marginBottom: 8 },
    duaTranslation: { fontSize: 13, color: "#555", lineHeight: 20 },
  
    tipRow: { flexDirection: "row", gap: 10, marginBottom: 10, alignItems: "flex-start" },
    tipText: { flex: 1, fontSize: 14, color: "#444", lineHeight: 22 },

    // Gold button when not completed
    completeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "green", marginHorizontal: 20, borderRadius: 25, padding: 14, marginBottom: 12 },
    // Lighter style when already completed
    completeBtnDone: { backgroundColor: "#C9A84C" },
    // White text on green button
    completeBtnText: { color: "#fff", fontSize: 15, fontWeight: "bold" },
    // Navy text on gold button
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