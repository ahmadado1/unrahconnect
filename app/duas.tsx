import { useTheme } from "@/context/themeContext"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useState } from "react"
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

// ─── TYPES ───────────────────────────────────────────────────────────────────

type Dua = {
  id: string
  title: string
  arabic: string
  transliteration: string
  translation: string
  source: string
}

type Category = {
  id: string
  label: string
  emoji: string
  duas: Dua[]
}

// ─── DATA ────────────────────────────────────────────────────────────────────

const CATEGORIES: Category[] = [
  {
    id: "umrah",
    label: "Umrah",
    emoji: "🕋",
    duas: [
      {
        id: "u1",
        title: "Entering Ihram",
        arabic: "لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيكَ لَكَ",
        transliteration: "Labbayk Allahumma labbayk, labbayka la shareeka laka labbayk, innal hamda wan-ni'mata laka wal-mulk, la shareeka lak",
        translation: "Here I am O Allah, here I am. Here I am, You have no partner, here I am. Verily all praise, grace and sovereignty belong to You. You have no partner.",
        source: "Talbiyah — Agreed Upon"
      },
      {
        id: "u2",
        title: "Entering Masjid al-Haram",
        arabic: "اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ",
        transliteration: "Allahumma iftah li abwaba rahmatik",
        translation: "O Allah, open for me the gates of Your mercy.",
        source: "Sahih Muslim"
      },
      {
        id: "u3",
        title: "First sight of the Kaaba",
        arabic: "اللَّهُمَّ زِدْ هَذَا الْبَيْتَ تَشْرِيفًا وَتَعْظِيمًا وَتَكْرِيمًا وَمَهَابَةً",
        transliteration: "Allahumma zid hadhal bayta tashreefan wa ta'dheeman wa takreeman wa mahabatan",
        translation: "O Allah, increase this House in honor, veneration, nobility and awe.",
        source: "Reported by Al-Shafi'i"
      },
      {
        id: "u4",
        title: "During Tawaf",
        arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
        transliteration: "Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina 'adhaban-nar",
        translation: "Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.",
        source: "Quran 2:201"
      },
      {
        id: "u5",
        title: "At the Black Stone",
        arabic: "بِسْمِ اللَّهِ وَاللَّهُ أَكْبَرُ",
        transliteration: "Bismillahi wallahu akbar",
        translation: "In the name of Allah, and Allah is the Greatest.",
        source: "Agreed Upon"
      },
      {
        id: "u6",
        title: "At Safa and Marwa",
        arabic: "إِنَّ الصَّفَا وَالْمَرْوَةَ مِنْ شَعَائِرِ اللَّهِ",
        transliteration: "Innas-safa wal-marwata min sha'a'irillah",
        translation: "Indeed Safa and Marwa are among the symbols of Allah.",
        source: "Quran 2:158"
      },
      {
        id: "u7",
        title: "Drinking Zamzam",
        arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا وَاسِعًا وَشِفَاءً مِنْ كُلِّ دَاءٍ",
        transliteration: "Allahumma inni as'aluka 'ilman nafi'an wa rizqan wasi'an wa shifa'an min kulli da'",
        translation: "O Allah, I ask You for beneficial knowledge, abundant provision, and cure from every disease.",
        source: "Ibn Majah"
      },
    ]
  },
  {
    id: "prayer",
    label: "Prayer",
    emoji: "🕌",
    duas: [
      {
        id: "p1",
        title: "Before Prayer (Fajr)",
        arabic: "اللَّهُمَّ بَاعِدْ بَيْنِي وَبَيْنَ خَطَايَايَ كَمَا بَاعَدْتَ بَيْنَ الْمَشْرِقِ وَالْمَغْرِبِ",
        transliteration: "Allahumma ba'id bayni wa bayna khatayaya kama ba'adta baynal mashriqi wal maghrib",
        translation: "O Allah, distance me from my sins as You have distanced the East from the West.",
        source: "Agreed Upon"
      },
      {
        id: "p2",
        title: "After Prayer",
        arabic: "أَسْتَغْفِرُ اللَّهَ، أَسْتَغْفِرُ اللَّهَ، أَسْتَغْفِرُ اللَّهَ",
        transliteration: "Astaghfirullah, astaghfirullah, astaghfirullah",
        translation: "I seek forgiveness from Allah (three times).",
        source: "Sahih Muslim"
      },
      {
        id: "p3",
        title: "After Adhan",
        arabic: "اللَّهُمَّ رَبَّ هَذِهِ الدَّعْوَةِ التَّامَّةِ وَالصَّلَاةِ الْقَائِمَةِ آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ",
        transliteration: "Allahumma Rabba hadhihid-da'watit-tammati was-salatil-qa'imati, ati Muhammadanil-waseelata wal-fadeelah",
        translation: "O Allah, Lord of this perfect call and the prayer to be offered, grant Muhammad the privilege and the eminence.",
        source: "Sahih Bukhari"
      },
      {
        id: "p4",
        title: "Entering the Mosque",
        arabic: "اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ",
        transliteration: "Allahumma iftah li abwaba rahmatik",
        translation: "O Allah, open for me the gates of Your mercy.",
        source: "Sahih Muslim"
      },
      {
        id: "p5",
        title: "Leaving the Mosque",
        arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ",
        transliteration: "Allahumma inni as'aluka min fadlik",
        translation: "O Allah, I ask You from Your bounty.",
        source: "Sahih Muslim"
      },
    ]
  },
  {
    id: "daily",
    label: "Daily",
    emoji: "🌙",
    duas: [
      {
        id: "d1",
        title: "Morning Remembrance",
        arabic: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ",
        transliteration: "Asbahna wa asbahal mulku lillah, walhamdu lillah, la ilaha illallahu wahdahu la shareeka lah",
        translation: "We have reached the morning and at this very time all sovereignty belongs to Allah. All praise is for Allah. None has the right to be worshipped except Allah, alone, without any partner.",
        source: "Abu Dawud"
      },
      {
        id: "d2",
        title: "Evening Remembrance",
        arabic: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ",
        transliteration: "Amsayna wa amsal mulku lillah, walhamdu lillah, la ilaha illallahu wahdahu la shareeka lah",
        translation: "We have reached the evening and at this very time all sovereignty belongs to Allah. All praise is for Allah. None has the right to be worshipped except Allah, alone, without any partner.",
        source: "Abu Dawud"
      },
      {
        id: "d3",
        title: "Before Eating",
        arabic: "بِسْمِ اللَّهِ",
        transliteration: "Bismillah",
        translation: "In the name of Allah.",
        source: "Abu Dawud"
      },
      {
        id: "d4",
        title: "After Eating",
        arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ",
        transliteration: "Alhamdu lillahil-lathi at'amani hadha wa razaqanihi min ghayri hawlin minni wa la quwwah",
        translation: "All praise is for Allah who fed me this and provided it for me without any might or power from myself.",
        source: "Abu Dawud & Tirmidhi"
      },
      {
        id: "d5",
        title: "Before Sleeping",
        arabic: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا",
        transliteration: "Bismika Allahumma amootu wa ahya",
        translation: "In Your name O Allah, I die and I live.",
        source: "Sahih Bukhari"
      },
      {
        id: "d6",
        title: "Upon Waking",
        arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ",
        transliteration: "Alhamdu lillahil-lathi ahyana ba'da ma amatana wa ilayhin-nushoor",
        translation: "All praise is for Allah who gave us life after having taken it from us and unto Him is the resurrection.",
        source: "Sahih Bukhari"
      },
    ]
  },
  {
    id: "travel",
    label: "Travel",
    emoji: "✈️",
    duas: [
      {
        id: "t1",
        title: "Leaving Home",
        arabic: "بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
        transliteration: "Bismillahi tawakkaltu 'alallahi wa la hawla wa la quwwata illa billah",
        translation: "In the name of Allah, I place my trust in Allah, and there is no might nor power except with Allah.",
        source: "Abu Dawud & Tirmidhi"
      },
      {
        id: "t2",
        title: "Boarding Transport",
        arabic: "سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ",
        transliteration: "Subhanal-lathi sakhkhara lana hadha wa ma kunna lahu muqrineen, wa inna ila rabbina lamunqaliboon",
        translation: "Glory be to Him who has subjected this to us, and we could never have it by our efforts. And verily, to our Lord we indeed are to return.",
        source: "Quran 43:13-14"
      },
      {
        id: "t3",
        title: "Entering a New City",
        arabic: "اللَّهُمَّ رَبَّ السَّمَاوَاتِ السَّبْعِ وَمَا أَظْلَلْنَ، وَرَبَّ الْأَرَضِينَ السَّبْعِ وَمَا أَقْلَلْنَ",
        transliteration: "Allahumma rabbas-samawatis-sab'i wa ma adhlalna, wa rabbal-aradinas-sab'i wa ma aqallna",
        translation: "O Allah, Lord of the seven heavens and all they overshadow, Lord of the seven earths and all they carry.",
        source: "Ibn As-Sunni"
      },
      {
        id: "t4",
        title: "Returning Home",
        arabic: "آيِبُونَ تَائِبُونَ عَابِدُونَ لِرَبِّنَا حَامِدُونَ",
        transliteration: "Ayiboon, ta'iboon, 'abidoon, lirabbina hamidoon",
        translation: "We return, repent, worship and praise our Lord.",
        source: "Sahih Muslim"
      },
    ]
  },
  {
    id: "zikr",
    label: "Zikr",
    emoji: "📿",
    duas: [
      {
        id: "z1",
        title: "Subhanallah",
        arabic: "سُبْحَانَ اللَّهِ",
        transliteration: "Subhanallah",
        translation: "Glory be to Allah.",
        source: "Agreed Upon — 33x after each prayer"
      },
      {
        id: "z2",
        title: "Alhamdulillah",
        arabic: "الْحَمْدُ لِلَّهِ",
        transliteration: "Alhamdulillah",
        translation: "All praise is for Allah.",
        source: "Agreed Upon — 33x after each prayer"
      },
      {
        id: "z3",
        title: "Allahu Akbar",
        arabic: "اللَّهُ أَكْبَرُ",
        transliteration: "Allahu Akbar",
        translation: "Allah is the Greatest.",
        source: "Agreed Upon — 34x after each prayer"
      },
      {
        id: "z4",
        title: "La ilaha illallah",
        arabic: "لَا إِلَهَ إِلَّا اللَّهُ",
        transliteration: "La ilaha illallah",
        translation: "There is no god worthy of worship except Allah.",
        source: "Agreed Upon"
      },
      {
        id: "z5",
        title: "Astaghfirullah",
        arabic: "أَسْتَغْفِرُ اللَّهَ",
        transliteration: "Astaghfirullah",
        translation: "I seek forgiveness from Allah.",
        source: "Agreed Upon — 100x daily"
      },
      {
        id: "z6",
        title: "Hasbunallah",
        arabic: "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ",
        transliteration: "Hasbunallahu wa ni'mal-wakeel",
        translation: "Allah is sufficient for us and He is the best disposer of affairs.",
        source: "Quran 3:173"
      },
      {
        id: "z7",
        title: "La hawla wa la quwwata",
        arabic: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
        transliteration: "La hawla wa la quwwata illa billah",
        translation: "There is no might nor power except with Allah.",
        source: "Agreed Upon"
      },
      {
        id: "z8",
        title: "Salawat on the Prophet",
        arabic: "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ",
        transliteration: "Allahumma salli 'ala Muhammadin wa 'ala ali Muhammad",
        translation: "O Allah, send blessings upon Muhammad and upon the family of Muhammad.",
        source: "Agreed Upon"
      },
    ]
  },
  {
    id: "quran",
    label: "Quranic",
    emoji: "📖",
    duas: [
      {
        id: "q1",
        title: "Dua of Ibrahim (Guidance)",
        arabic: "رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِنْ ذُرِّيَّتِي رَبَّنَا وَتَقَبَّلْ دُعَاءِ",
        transliteration: "Rabbij'alni muqimas-salati wa min dhurriyyati, rabbana wa taqabbal du'a",
        translation: "My Lord, make me an establisher of prayer, and from my descendants. Our Lord, and accept my supplication.",
        source: "Quran 14:40"
      },
      {
        id: "q2",
        title: "Dua for Forgiveness",
        arabic: "رَبَّنَا ظَلَمْنَا أَنْفُسَنَا وَإِنْ لَمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ",
        transliteration: "Rabbana dhalamna anfusana wa in lam taghfir lana wa tarhamna lanakunanna minal-khasireen",
        translation: "Our Lord, we have wronged ourselves, and if You do not forgive us and have mercy upon us, we will surely be among the losers.",
        source: "Quran 7:23"
      },
      {
        id: "q3",
        title: "Dua for Ease",
        arabic: "رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي",
        transliteration: "Rabbish-rah li sadri wa yassir li amri",
        translation: "My Lord, expand for me my breast and ease for me my task.",
        source: "Quran 20:25-26"
      },
      {
        id: "q4",
        title: "Dua for Mercy",
        arabic: "رَبِّ إِنِّي لِمَا أَنْزَلْتَ إِلَيَّ مِنْ خَيْرٍ فَقِيرٌ",
        transliteration: "Rabbi inni lima anzalta ilayya min khayrin faqeer",
        translation: "My Lord, indeed I am in need of whatever good You would send down to me.",
        source: "Quran 28:24"
      },
      {
        id: "q5",
        title: "Dua for Knowledge",
        arabic: "رَبِّ زِدْنِي عِلْمًا",
        transliteration: "Rabbi zidni 'ilma",
        translation: "My Lord, increase me in knowledge.",
        source: "Quran 20:114"
      },
      {
        id: "q6",
        title: "Dua for Good in Both Worlds",
        arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
        transliteration: "Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina 'adhaban-nar",
        translation: "Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.",
        source: "Quran 2:201"
      },
    ]
  },
]

// ─── DUA CARD ────────────────────────────────────────────────────────────────

function DuaCard({ dua, theme }: { dua: Dua; theme: any }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <TouchableOpacity
      style={[styles.duaCard, { backgroundColor: theme.card, borderColor: theme.border }]}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.8}
    >
      {/* Title row */}
      <View style={styles.duaHeader}>
        <Text style={[styles.duaTitle, { color: theme.text }]}>{dua.title}</Text>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={16}
          color="#C9A84C"
        />
      </View>

      {/* Arabic — always visible */}
      <Text style={styles.duaArabic}>{dua.arabic}</Text>

      {/* Expanded content */}
      {expanded && (
        <>
          <View style={styles.duaDivider} />
          <Text style={styles.duaTranslit}>{dua.transliteration}</Text>
          <Text style={[styles.duaTranslation, { color: theme.textSecondary }]}>{dua.translation}</Text>
          <View style={styles.duaSourceRow}>
            <Ionicons name="book-outline" size={12} color="#C9A84C" />
            <Text style={styles.duaSource}>{dua.source}</Text>
          </View>
        </>
      )}
    </TouchableOpacity>
  )
}

// ─── SCREEN ──────────────────────────────────────────────────────────────────

export default function DuasScreen() {
  const router = useRouter()
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const [activeCategory, setActiveCategory] = useState("umrah")

  const currentCategory = CATEGORIES.find(c => c.id === activeCategory)!

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
          <Text style={styles.backText}>Home</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Duas & Zikr</Text>
        <Text style={styles.subtitle}>Supplications & remembrance</Text>

        {/* Category pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.pillsScroll}
          contentContainerStyle={styles.pillsContent}
        >
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.pill, activeCategory === cat.id && styles.pillActive]}
              onPress={() => setActiveCategory(cat.id)}
            >
              <Text style={styles.pillEmoji}>{cat.emoji}</Text>
              <Text style={[styles.pillText, activeCategory === cat.id && styles.pillTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Duas list */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {/* Category header */}
        <View style={styles.catHeader}>
          <Text style={styles.catEmoji}>{currentCategory.emoji}</Text>
          <View>
            <Text style={[styles.catTitle, { color: theme.text }]}>{currentCategory.label}</Text>
            <Text style={[styles.catCount, { color: theme.textSecondary }]}>
              {currentCategory.duas.length} duas
            </Text>
          </View>
        </View>

        <Text style={[styles.tapHint, { color: theme.textSecondary }]}>
          Tap any dua to expand
        </Text>

        {currentCategory.duas.map(dua => (
          <DuaCard key={dua.id} dua={dua} theme={theme} />
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  )
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },

  // Header
  header: { backgroundColor: "#1E3A5F", paddingBottom: 0 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 12, paddingHorizontal: 20, paddingTop: 16 },
  backText: { color: "rgba(255,255,255,0.6)", fontSize: 14 },
  title: { color: "#fff", fontSize: 26, fontWeight: "bold", paddingHorizontal: 20, marginBottom: 4 },
  subtitle: { color: "#C9A84C", fontSize: 13, paddingHorizontal: 20, marginBottom: 16 },

  // Pills
  pillsScroll: { marginBottom: 0 },
  pillsContent: { paddingHorizontal: 16, gap: 8, paddingBottom: 16 },
  pill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.1)" },
  pillActive: { backgroundColor: "#C9A84C" },
  pillEmoji: { fontSize: 14 },
  pillText: { color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "500" },
  pillTextActive: { color: "#1E3A5F", fontWeight: "700" },

  // List
  list: { padding: 16 },

  // Category header
  catHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 6 },
  catEmoji: { fontSize: 36 },
  catTitle: { fontSize: 20, fontWeight: "bold" },
  catCount: { fontSize: 13, marginTop: 2 },
  tapHint: { fontSize: 12, marginBottom: 16, fontStyle: "italic" },

  // Dua card
  duaCard: { borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 0.5 },
  duaHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  duaTitle: { fontSize: 15, fontWeight: "600", flex: 1, marginRight: 8 },
  duaArabic: { fontSize: 22, color: "#1E3A5F", textAlign: "right", lineHeight: 40 },
  duaDivider: { height: 0.5, backgroundColor: "rgba(201,168,76,0.4)", marginVertical: 12 },
  duaTranslit: { fontSize: 13, color: "#C9A84C", fontStyle: "italic", marginBottom: 8, lineHeight: 20 },
  duaTranslation: { fontSize: 13, lineHeight: 20, marginBottom: 10 },
  duaSourceRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  duaSource: { fontSize: 11, color: "#C9A84C", fontWeight: "500" },
})