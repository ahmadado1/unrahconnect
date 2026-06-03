import { useTheme } from "@/context/themeContext"
import { getUmrahProgress, markPhaseComplete, supabase } from "@/lib/supabase"
import { Ionicons } from "@expo/vector-icons"
import { useLocalSearchParams, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"


const phasesData = [
  {
    id: "1", title: "Madinah Visit", color: "#E6F1FB", textColor: "#0C447C", duration: "1-3 days",
    description: "Most pilgrims begin their blessed journey in Madinah Al-Munawwarah — the illuminated city. This is the city of the Prophet ﷺ and every step here carries immense reward. Arrive with a heart full of love for the Prophet ﷺ and take full advantage of every moment in this sacred city before proceeding to Makkah.",
    steps: [
      "Arrive in Madinah with the intention of visiting Masjid An-Nabawi and sending salawat upon the Prophet ﷺ",
      "Enter Masjid An-Nabawi with your right foot — one prayer here equals 1000 prayers anywhere else",
      "Visit Riyad Al Jannah — the Garden of Paradise — between the Prophet's grave and his pulpit. This is a piece of Jannah on earth",
      "Stand at the grave of the Prophet ﷺ and send salawat — face the grave not the Qibla",
      "Move to the right to greet Abu Bakr As-Siddiq رضي الله عنه, then further right to greet Umar Ibn Al-Khattab رضي الله عنه",
      "Visit Jannat Al Baqi — the graveyard of the companions — and make dua for them",
      "Visit Masjid Quba — the first masjid built in Islam. Praying 2 rakats here equals the reward of a complete Umrah",
      "Visit Masjid Al-Qiblatayn — the masjid of the two Qiblas where the direction of prayer was changed",
      "Visit the sites of the Battle of Uhud and the grave of Hamza رضي الله عنه the uncle of the Prophet ﷺ",
      "Spend time in dua, Quran recitation and salawat throughout your stay"
    ],
    duas: [
      {
        title: "Dua upon entering Masjid An-Nabawi",
        arabic: "اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ",
        transliteration: "Allahumma iftah li abwaba rahmatik",
        translation: "O Allah, open for me the gates of Your mercy"
      },
      {
        title: "Salawat upon the Prophet ﷺ at his grave",
        arabic: "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ",
        transliteration: "Allahumma salli ala Muhammadin wa ala ali Muhammadin kama sallayta ala Ibrahima wa ala ali Ibrahima innaka Hamidun Majid",
        translation: "O Allah send blessings upon Muhammad and the family of Muhammad as You sent blessings upon Ibrahim and the family of Ibrahim. Indeed You are Praiseworthy and Glorious"
      },
      {
        title: "Greeting the Prophet ﷺ",
        arabic: "السَّلَامُ عَلَيْكَ يَا رَسُولَ اللَّهِ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ",
        transliteration: "As-salamu alayka ya Rasulallah wa rahmatullahi wa barakatuh",
        translation: "Peace be upon you O Messenger of Allah and the mercy and blessings of Allah"
      },
      {
        title: "Dua at Masjid Quba",
        arabic: "سُبْحَانَ اللَّهِ وَالْحَمْدُ لِلَّهِ وَلَا إِلَهَ إِلَّا اللَّهُ وَاللَّهُ أَكْبَرُ",
        transliteration: "Subhanallah wal-hamdulillah wa la ilaha illallah wallahu akbar",
        translation: "Glory be to Allah, all praise be to Allah, there is no god but Allah, and Allah is the Greatest"
      },
      {
        title: "Dua when visiting graves (Jannat Al Baqi)",
        arabic: "السَّلَامُ عَلَيْكُمْ أَهْلَ الدِّيَارِ مِنَ الْمُؤْمِنِينَ وَالْمُسْلِمِينَ وَيَرْحَمُ اللَّهُ الْمُسْتَقْدِمِينَ مِنَّا وَالْمُسْتَأْخِرِينَ وَإِنَّا إِنْ شَاءَ اللَّهُ بِكُمْ لَلَاحِقُونَ",
        transliteration: "As-salamu alaykum ahlad-diyari minal mu'minina wal muslimin, wa yarhamullahul mustaqdimiina minna wal musta'khirin, wa inna in sha Allah bikum lalahiqun",
        translation: "Peace be upon you O people of the graves from the believers and Muslims. May Allah have mercy on those who have gone before us and those who will come after. And we will indeed, if Allah wills, join you"
      }
    ],
    tips: [
      "Visit Riyad Al Jannah very early — before Fajr or right after — to avoid the enormous crowds",
      "You may only enter Riyad Al Jannah through specific doors — ask the guards which entrance is open",
      "Spend at least 2-3 days in Madinah to benefit fully from its blessings",
      "The Prophet ﷺ said whoever visits him after his death it is as if they visited him during his life",
      "Make a list of duas before you visit — standing at the grave of the Prophet ﷺ is a powerful moment",
      "The 40 prayers (Arba'een) — praying 40 consecutive prayers in Masjid An-Nabawi — is highly recommended",
      "Buy dates from Madinah — the Ajwa date is especially recommended by the Prophet ﷺ"
    ],
    femaleNote: "Women should cover fully when visiting the grave area. Many scholars recommend the face covering near the grave out of respect. Women visit Jannat Al Baqi at designated times — check with the masjid staff for the current schedule. Women are not permitted inside Riyad Al Jannah during men's prayer times — go during women's designated hours.",
  },
  {
    id: "2", title: "Entering Ihram", color: "#E1F5EE", textColor: "#085041", duration: "1-2 hours",
    description: "Ihram is the sacred state you must enter before performing Umrah. It is both a physical and spiritual transformation — you strip away all worldly distinctions and stand equal before Allah. Rich and poor, king and servant, all wear the same simple white garments. The Miqat is the designated boundary — you must enter Ihram before crossing it. Crossing without Ihram requires a penalty (dam).",
    steps: [
      "Trim nails and remove unwanted body hair before Ghusl — you cannot do this after entering Ihram",
      "Perform Ghusl (full body purification bath) with the intention of Ihram — this is Sunnah even for women in their menstrual cycle",
      "Men apply perfume to the body only — not to the Ihram garments themselves",
      "Men wear the two white unstitched sheets — Izar (lower) and Rida (upper). No underwear, no stitched clothing",
      "Women wear their normal modest clothing in any colour — there is no special Ihram garment for women",
      "Pray 2 rakats of Ihram sunnah prayer — recite Surah Al-Kafirun in the first rakat and Surah Al-Ikhlas in the second",
      "Make the Niyyah (intention) for Umrah at the Miqat — say it aloud",
      "Begin reciting the Talbiyah — men loudly, women quietly",
      "From this moment all Ihram restrictions apply — avoid them carefully until you complete your Umrah"
    ],
    duas: [
      {
        title: "Niyyah for Umrah",
        arabic: "لَبَّيْكَ اللَّهُمَّ عُمْرَةً",
        transliteration: "Labbayka Allahumma Umratan",
        translation: "Here I am O Allah, for Umrah"
      },
      {
        title: "Talbiyah — recite continuously",
        arabic: "لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيكَ لَكَ",
        transliteration: "Labbayk Allahumma labbayk, labbayk la sharika laka labbayk, innal hamda wan-ni'mata laka wal-mulk, la sharika lak",
        translation: "Here I am O Allah, here I am. Here I am, You have no partner, here I am. Verily all praise, grace and sovereignty belong to You. You have no partner."
      },
      {
        title: "Dua after putting on Ihram",
        arabic: "اللَّهُمَّ إِنِّي أُرِيدُ الْعُمْرَةَ فَيَسِّرْهَا لِي وَتَقَبَّلْهَا مِنِّي",
        transliteration: "Allahumma inni uridu al-umrata fa yassirha li wa taqabbalha minni",
        translation: "O Allah I intend to perform Umrah so make it easy for me and accept it from me"
      },
      {
        title: "Dua for protection during Ihram",
        arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْكُفْرِ وَالْفَقْرِ وَعَذَابِ الْقَبْرِ",
        transliteration: "Allahumma inni a'udhu bika minal kufri wal faqri wa adhabil qabr",
        translation: "O Allah I seek refuge in You from disbelief, poverty and the punishment of the grave"
      }
    ],
    tips: [
      "The main Miqats for Umrah are: Dhul Hulayfah (for those coming from Madinah), Juhfah (Syria/Egypt), Qarn Al-Manazil (Najd), Yalamlam (Yemen), Dhat Irq (Iraq)",
      "If flying directly to Jeddah — you must put on Ihram on the plane before reaching the Miqat boundary. The captain will announce it",
      "Once in Ihram you may NOT: cut hair or nails, use perfume, cover the head (men), wear stitched clothing (men), engage in marital relations, hunt animals, or cause harm to others",
      "If you accidentally violate any restriction — make istighfar immediately and consult a scholar about whether a penalty applies",
      "Keep reciting Talbiyah throughout your journey until you begin Tawaf — at every moment, especially when going uphill, downhill, boarding transport or meeting other pilgrims",
      "Ihram is not just physical — it is a state of the heart. Avoid arguments, bad speech and anything that angers Allah",
      "The Prophet ﷺ said — whoever performs Umrah without committing any obscenity or sin returns like the day his mother gave birth to him"
    ],
    femaleNote: "Women wear their normal modest clothing in any colour — no special garment is required. Women do NOT cover the face or hands during Ihram — this is prohibited during Ihram according to the majority of scholars. Women recite the Talbiyah quietly so only they can hear. Women in their menstrual cycle still perform Ghusl and enter Ihram — they simply delay Tawaf until they are pure. Do not delay your trip because of your cycle.",
  },
  {
    id: "3", title: "Arriving in Makkah", color: "#FAEEDA", textColor: "#633806", duration: "30 mins",
    description: "Arriving in Makkah Al-Mukarramah — the Most Noble City — is one of the most overwhelming spiritual experiences a Muslim can have. Your heart will race as you approach Masjid Al-Haram. The moment you first see the Kaaba is one of the most powerful moments of your entire life — duas made at that moment are accepted. Prepare your heart and have your duas ready before you enter.",
    steps: [
      "Enter Makkah reciting the dua for entering a city — be in a state of wudu if possible",
      "Head directly to Masjid Al-Haram — enter with your right foot reciting the masjid entry dua",
      "Walk towards the Kaaba slowly and with full presence of heart — do not rush",
      "When the Kaaba first comes into view — STOP. Raise your hands and make as much dua as you can. This is one of the most powerful moments for dua acceptance in Islam",
      "Lower your gaze as you approach — then look up at the Kaaba and let the moment overwhelm you",
      "Stop reciting the Talbiyah as you are about to begin Tawaf",
      "Proceed to the Black Stone (Hajr Al-Aswad) to begin your Tawaf",
      "If you cannot reach the Black Stone due to crowds — point to it from a distance and say Allahu Akbar"
    ],
    duas: [
      {
        title: "Dua upon entering Makkah",
        arabic: "اللَّهُمَّ هَذَا حَرَمُكَ وَأَمْنُكَ فَحَرِّمْنِي عَلَى النَّارِ وَأَمِّنِّي مِنْ عَذَابِكَ يَوْمَ تَبْعَثُ عِبَادَكَ وَاجْعَلْنِي مِنْ أَوْلِيَائِكَ وَأَهْلِ طَاعَتِكَ",
        transliteration: "Allahumma hadha haramuka wa amnuka faharrimni alan-nar wa amminni min adhabika yawma tab'athu ibadaka waj'alni min awliya'ika wa ahli ta'atik",
        translation: "O Allah this is Your sanctuary and Your place of safety, so forbid my flesh to the Hellfire, keep me safe from Your punishment on the day You resurrect Your servants, and make me among Your close friends and those who obey You"
      },
      {
        title: "Dua upon entering Masjid Al-Haram",
        arabic: "بِسْمِ اللَّهِ وَالصَّلَاةُ وَالسَّلَامُ عَلَى رَسُولِ اللَّهِ، اللَّهُمَّ اغْفِرْ لِي ذُنُوبِي وَافْتَحْ لِي أَبْوَابَ رَحْمَتِكَ",
        transliteration: "Bismillahi was-salatu was-salamu ala rasulillah, Allahumma ighfir li dhunubi waftah li abwaba rahmatik",
        translation: "In the name of Allah, and peace and blessings upon the Messenger of Allah. O Allah forgive my sins and open for me the gates of Your mercy"
      },
      {
        title: "Dua upon first seeing the Kaaba — raise your hands and ask",
        arabic: "اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ فَحَيِّنَا رَبَّنَا بِالسَّلَامِ",
        transliteration: "Allahumma Anta-s-Salamu wa minka-s-salamu fa hayyina Rabbana bis-salam",
        translation: "O Allah You are Peace and from You comes peace, so greet us our Lord with peace"
      },
      {
        title: "Bonus dua upon seeing the Kaaba — ask for anything",
        arabic: "اللَّهُمَّ زِدْ هَذَا الْبَيْتَ تَشْرِيفًا وَتَعْظِيمًا وَتَكْرِيمًا وَمَهَابَةً وَزِدْ مَنْ شَرَّفَهُ وَكَرَّمَهُ مِمَّنْ حَجَّهُ أَوِ اعْتَمَرَهُ تَشْرِيفًا وَتَكْرِيمًا وَتَعْظِيمًا وَبِرًّا",
        transliteration: "Allahumma zid hadhal bayta tashrifan wa ta'dhiman wa takriman wa mahabatan wa zid man sharrfahahu wa karramahu mimman hajjahu awi'tamarahu tashrifan wa takriman wa ta'dhiman wa birra",
        translation: "O Allah increase this House in honour, greatness, nobility and reverence, and increase those who honour and respect it — those who perform Hajj or Umrah — in honour, nobility, greatness and righteousness"
      },
      {
        title: "Dua for Zamzam water",
        arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا وَاسِعًا وَشِفَاءً مِنْ كُلِّ دَاءٍ",
        transliteration: "Allahumma inni as'aluka ilman nafi'an wa rizqan wasi'an wa shifa'an min kulli da'",
        translation: "O Allah I ask You for beneficial knowledge, abundant provision and cure from every disease"
      }
    ],
    tips: [
      "Have a list of duas written or saved on your phone before you enter — the moment you see the Kaaba you may forget everything",
      "The Prophet ﷺ said dua is accepted when you first see the Kaaba — do not waste this moment on photos",
      "Enter the Haram with complete humility and awe — you are standing in the most sacred place on earth",
      "Drink Zamzam water before starting Tawaf — make dua while drinking it as duas made while drinking Zamzam are accepted",
      "The Zamzam well has been flowing for over 4000 years since Allah sent it for Hajar and Ismail عليهما السلام",
      "If it is very crowded when you arrive — you may rest first and perform Tawaf at a quieter time such as after Tahajjud",
      "The best time to do Tawaf is after midnight — the crowds are smaller and the atmosphere is extraordinary",
      "Do not be overwhelmed by the crowds — focus only on Allah and your own worship"
    ],
    femaleNote: "Women should enter the Haram modestly and move carefully through crowds — hold onto a mahram if possible. Women do not need to rush or push to reach the Black Stone — pointing from a distance is completely valid and accepted. Avoid coming very close to the Kaaba during peak times for your own safety. The upper floors of the Haram are often less crowded and the view of the Kaaba from above is breathtaking.",
  },
  {
    id: "4", title: "Tawaf", color: "#FAECE7", textColor: "#712B13", duration: "1-2 hours",
    description: "Tawaf is one of the most beautiful acts of worship in Islam — circling the House of Allah 7 times in an anti-clockwise direction, joining millions of angels who do the same around the Throne of Allah. The Kaaba is the spiritual centre of the earth and every Tawaf you do is recorded as an act of immense worship. There is no specific dua required for each round — your heart is your guide. Speak to Allah in any language, cry, ask, thank — He hears everything.",
    steps: [
      "Make sure you are in a state of wudu before starting Tawaf — it is required",
      "Men perform Idtiba — expose the right shoulder by placing the Rida under the right arm — for all 7 rounds",
      "Start at the Black Stone (Hajr Al-Aswad) — touch and kiss it if possible, or touch with your hand and kiss your hand, or simply point to it",
      "Say 'Bismillah Allahu Akbar' at the start of every round",
      "Keep the Kaaba on your LEFT side at ALL times — you circle anti-clockwise",
      "Men perform Raml — brisk walking with chest out — in the first 3 rounds only. Normal walking for the remaining 4",
      "Each time you pass the Black Stone say 'Allahu Akbar' and begin the next round",
      "Between the Yemeni Corner and the Black Stone recite Rabbana atina fid-dunya — this is the Sunnah",
      "After completing all 7 rounds pray 2 rakats behind Maqam Ibrahim — recite Al-Kafirun in the first and Al-Ikhlas in the second",
      "Go to the Zamzam well and drink facing the Qibla making dua while drinking",
      "Return to the Black Stone and touch or point to it — this marks the end of Tawaf"
    ],
    duas: [
      {
        title: "Starting each round at the Black Stone",
        arabic: "بِسْمِ اللَّهِ اللَّهُ أَكْبَرُ",
        transliteration: "Bismillahi Allahu Akbar",
        translation: "In the name of Allah, Allah is the Greatest"
      },
      {
        title: "Between the Yemeni Corner and the Black Stone — recite every round",
        arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
        transliteration: "Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina adhaban-nar",
        translation: "Our Lord give us good in this world and good in the hereafter and save us from the punishment of the Fire"
      },
      {
        title: "Dua at Maqam Ibrahim after Tawaf",
        arabic: "وَاتَّخِذُوا مِنْ مَقَامِ إِبْرَاهِيمَ مُصَلًّى",
        transliteration: "Wattakhidhu min maqami Ibrahima musalla",
        translation: "And take the station of Ibrahim as a place of prayer — recite this before praying 2 rakats"
      },
      {
        title: "Dua for Zamzam water",
        arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا وَاسِعًا وَشِفَاءً مِنْ كُلِّ دَاءٍ",
        transliteration: "Allahumma inni as'aluka ilman nafi'an wa rizqan wasi'an wa shifa'an min kulli da'",
        translation: "O Allah I ask You for beneficial knowledge, abundant provision and cure from every disease"
      },
      {
        title: "Bonus — dua for forgiveness during Tawaf",
        arabic: "سُبْحَانَ اللَّهِ وَالْحَمْدُ لِلَّهِ وَلَا إِلَهَ إِلَّا اللَّهُ وَاللَّهُ أَكْبَرُ وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
        transliteration: "Subhanallah wal-hamdulillah wa la ilaha illallah wallahu akbar wa la hawla wa la quwwata illa billah",
        translation: "Glory be to Allah, all praise be to Allah, there is no god but Allah, Allah is the Greatest, and there is no power or strength except with Allah"
      },
      {
        title: "Bonus — dua to repeat throughout Tawaf",
        arabic: "رَبِّ اغْفِرْ وَارْحَمْ وَأَنْتَ الْأَعَزُّ الْأَكْرَمُ",
        transliteration: "Rabbighfir warham wa Antal a'azzul akram",
        translation: "My Lord forgive and have mercy, for You are the Most Mighty the Most Generous"
      }
    ],
    tips: [
      "There is no specific dua for each round — make any dua from your heart in any language. Allah understands all languages",
      "If you lose count of your rounds always assume the lesser number to be safe",
      "Tawaf can be performed on the ground floor, first floor or roof — go to upper floors if the ground is too crowded",
      "The ground floor Tawaf closest to the Kaaba is the most rewarding but also the most crowded",
      "Tawaf after midnight is one of the most spiritual experiences — the crowds thin out and the atmosphere is unlike anything else",
      "If your wudu breaks during Tawaf — leave, renew wudu, and return to continue from where you left off",
      "You may stop Tawaf for a fard prayer — resume after the prayer from where you stopped",
      "Keep your eyes on the Kaaba as much as possible — let it fill your heart",
      "The angels perform Tawaf around the Throne of Allah — you are mirroring the worship of the angels"
    ],
    femaleNote: "Women do NOT perform Idtiba (exposing the shoulder) or Raml (brisk walking) — walk at a normal comfortable pace for all 7 rounds. Women should avoid the innermost circles around the Kaaba during peak times for safety — the outer circles are equally valid. If a woman is unable to touch or reach the Black Stone she simply points from wherever she is — this is completely acceptable. Women may perform Tawaf during their menstrual cycle according to some scholars in cases of necessity — consult a scholar before your trip if this may apply to you.",
  },
  {
    id: "5", title: "Sa'i", color: "#EEEDFE", textColor: "#3C3489", duration: "1-2 hours",
    description: "Sa'i is the ritual of walking between the hills of Safa and Marwa 7 times, commemorating one of the most powerful acts of trust in Allah ever recorded in history. Hajar — the wife of Ibrahim عليه السلام — was left alone in the desert with her infant son Ismail عليه السلام with nothing but a small amount of food and water. When it ran out she ran between Safa and Marwa desperately searching for water or any sign of help — and Allah answered her with the miracle of Zamzam. Every step you take in Sa'i is you walking in the footsteps of a woman whose trust in Allah was unshakeable. Let that move you.",
    steps: [
      "Proceed to Mount Safa after completing Tawaf and drinking Zamzam water",
      "As you approach Safa recite the ayah — Innas-Safa wal-Marwata min sha'a'irillah",
      "Climb Safa, face the Qibla (direction of the Kaaba) and raise your hands in dua",
      "Make dua, recite dhikr and send salawat upon the Prophet ﷺ",
      "Descend from Safa and walk towards Marwa at a normal pace",
      "Men run between the two green lights — this commemorates Hajar's desperate running",
      "Climb Marwa, face the Qibla and make dua — this is ONE trip (Safa to Marwa = 1)",
      "Continue back and forth — Marwa to Safa = 2, Safa to Marwa = 3, and so on",
      "You must complete 7 trips total — you will END at Marwa on the 7th trip",
      "Make abundant dua at both Safa and Marwa — these are blessed places"
    ],
    duas: [
      {
        title: "Upon approaching Safa — recite this ayah first",
        arabic: "إِنَّ الصَّفَا وَالْمَرْوَةَ مِنْ شَعَائِرِ اللَّهِ فَمَنْ حَجَّ الْبَيْتَ أَوِ اعْتَمَرَ فَلَا جُنَاحَ عَلَيْهِ أَنْ يَطَّوَّفَ بِهِمَا",
        transliteration: "Innas-Safa wal-Marwata min sha'a'irillah, faman hajjal bayta awi'tamara fala junaha alayhi an yattawwafa bihima",
        translation: "Indeed Safa and Marwa are among the symbols of Allah. So whoever makes Hajj to the House or performs Umrah there is no blame on him for walking between them"
      },
      {
        title: "Dua facing the Kaaba at Safa and Marwa — repeat 3 times",
        arabic: "اللَّهُ أَكْبَرُ اللَّهُ أَكْبَرُ اللَّهُ أَكْبَرُ وَلِلَّهِ الْحَمْدُ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ يُحْيِي وَيُمِيتُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
        transliteration: "Allahu Akbar, Allahu Akbar, Allahu Akbar wa lillahil hamd, la ilaha illallahu wahdahu la sharika lah, lahul mulku wa lahul hamdu yuhyi wa yumitu wa huwa ala kulli shay'in qadir",
        translation: "Allah is the Greatest, Allah is the Greatest, Allah is the Greatest and to Allah belongs all praise. There is no god but Allah alone with no partner. His is the dominion and His is the praise. He gives life and causes death and He is powerful over everything"
      },
      {
        title: "Dua of Hajar — the spirit of Sa'i",
        arabic: "يَا اللَّهُ أَغِثْنِي، يَا اللَّهُ أَعِنِّي، يَا اللَّهُ لَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ",
        transliteration: "Ya Allah aghithni, ya Allah a'inni, ya Allah la takilni ila nafsi tarfata ayn",
        translation: "O Allah help me, O Allah aid me, O Allah do not leave me to myself for even the blink of an eye"
      },
      {
        title: "Bonus — dua of complete reliance on Allah",
        arabic: "حَسْبِيَ اللَّهُ وَنِعْمَ الْوَكِيلُ، نِعْمَ الْمَوْلَى وَنِعْمَ النَّصِيرُ",
        transliteration: "Hasbiyallahu wa ni'mal wakil, ni'mal mawla wa ni'man nasir",
        translation: "Allah is sufficient for me and what an excellent Guardian He is. What an excellent Protector and what an excellent Helper"
      },
      {
        title: "Bonus — dua between Safa and Marwa",
        arabic: "رَبِّ اغْفِرْ وَارْحَمْ إِنَّكَ أَنْتَ الْأَعَزُّ الْأَكْرَمُ",
        transliteration: "Rabbighfir warham innaka Antal a'azzul akram",
        translation: "My Lord forgive and have mercy, indeed You are the Most Mighty the Most Generous"
      },
      {
        title: "Bonus — dua for yourself and family",
        arabic: "اللَّهُمَّ اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ الْحِسَابُ",
        transliteration: "Allahumma ighfir li wa liwaalidayya wa lil mu'minina yawma yaqumul hisab",
        translation: "O Allah forgive me, my parents and the believers on the Day when the reckoning will come to pass"
      }
    ],
    tips: [
      "Wudu is recommended for Sa'i but not obligatory — you may perform it without wudu if necessary",
      "Count your trips carefully — you start at Safa and must end at Marwa. Safa to Marwa is odd numbers (1,3,5,7) and Marwa to Safa is even numbers (2,4,6)",
      "Make personal dua in your own language at Safa and Marwa — Allah hears every language and knows every heart",
      "Think of Hajar during every trip — her trust in Allah brought forth Zamzam which still flows today. Your trust in Allah will never go unanswered",
      "Sa'i is performed inside the Mas'a — the enclosed walkway between Safa and Marwa. You do not go outside",
      "The Mas'a has multiple floors — use the upper floors if the ground floor is too crowded",
      "If you need to rest during Sa'i you may sit and then continue — there is no penalty for resting",
      "Sa'i can be performed immediately after Tawaf or delayed — but it must be completed before you exit Ihram"
    ],
    femaleNote: "Women do NOT run between the green lights — walk at a normal comfortable pace for the entire Sa'i. This is a ruling not just a recommendation. Women may perform Sa'i during their menstrual cycle as Sa'i does not require wudu — only Tawaf requires purity. This is an important ruling that allows women to complete their Umrah without delay. Think deeply about Hajar during Sa'i — she was a woman who single-handedly demonstrated what complete tawakkul in Allah looks like.",
  },
  {
    id: "6", title: "Halq / Taqsir", color: "#FBEAF0", textColor: "#72243E", duration: "15 mins",
    description: "Halq (shaving the head) or Taqsir (trimming the hair) is the final ritual of Umrah and the moment you exit the sacred state of Ihram. It is a powerful symbol of humility — you offer your hair to Allah as a sign of complete submission. The Prophet ﷺ made dua three times for those who shave and once for those who trim — so shaving is more rewarding for men. The moment your hair is cut, Umrah is complete and all Ihram restrictions are lifted.",
    steps: [
      "After completing the 7th trip of Sa'i at Marwa — proceed to have your hair cut",
      "Men — shaving the entire head (Halq) is the Sunnah and more rewarding. Trimming from all parts of the head (Taqsir) is also valid",
      "If trimming — make sure you trim from ALL parts of the head, not just one side",
      "Women — cut only a fingertip length (approximately 2-3 cm) from the ends of the hair. Do not shave",
      "After cutting your hair you immediately exit Ihram — change out of the white sheets (men) into normal clothing",
      "All Ihram restrictions are now lifted — you may use perfume, cut nails, wear normal clothes",
      "Make dua of gratitude — your Umrah is now complete",
      "You may now perform additional voluntary Tawaf (Tawaf An-Nafl) as many times as you wish"
    ],
    duas: [
      {
        title: "Dua when shaving or cutting hair",
        arabic: "اللَّهُمَّ اغْفِرْ لِلْمُحَلِّقِينَ، اللَّهُمَّ اغْفِرْ لِلْمُحَلِّقِينَ، اللَّهُمَّ اغْفِرْ لِلْمُحَلِّقِينَ وَالْمُقَصِّرِينَ",
        transliteration: "Allahumma ighfir lil muhalliqqin, Allahumma ighfir lil muhalliqqin, Allahumma ighfir lil muhalliqqina wal muqassirin",
        translation: "O Allah forgive those who shave their heads, O Allah forgive those who shave their heads, O Allah forgive those who shave their heads and those who trim their hair — this is the dua the Prophet ﷺ made 3 times for those who shave and once for those who trim"
      },
      {
        title: "Dua of completion and acceptance",
        arabic: "اللَّهُمَّ تَقَبَّلْ مِنَّا إِنَّكَ أَنْتَ السَّمِيعُ الْعَلِيمُ وَتُبْ عَلَيْنَا إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ",
        transliteration: "Allahumma taqabbal minna innaka Anta-s-Sami'ul-'Alim wa tub alayna innaka Anta-t-Tawwabur-Rahim",
        translation: "O Allah accept from us, indeed You are the All-Hearing the All-Knowing, and turn to us in forgiveness, indeed You are the Ever-Relenting the Most Merciful"
      },
      {
        title: "Bonus — dua of gratitude after Umrah",
        arabic: "الْحَمْدُ لِلَّهِ الَّذِي بَلَّغَنَا هَذَا وَمَا كُنَّا لِنَهْتَدِيَ لَوْلَا أَنْ هَدَانَا اللَّهُ",
        transliteration: "Alhamdulillahil ladhi ballghana hadha wa ma kunna linahtadiya lawla an hadanallah",
        translation: "All praise be to Allah who brought us to this — we would never have been guided had Allah not guided us"
      },
      {
        title: "Bonus — dua for the entire Ummah",
        arabic: "اللَّهُمَّ اغْفِرْ لِلْمُسْلِمِينَ وَالْمُسْلِمَاتِ وَالْمُؤْمِنِينَ وَالْمُؤْمِنَاتِ الْأَحْيَاءِ مِنْهُمْ وَالْأَمْوَاتِ",
        transliteration: "Allahumma ighfir lil muslimina wal muslimat wal mu'minina wal mu'minat al-ahya'i minhum wal amwat",
        translation: "O Allah forgive the Muslim men and women, the believing men and women, both the living and the dead"
      }
    ],
    tips: [
      "The Prophet ﷺ made dua 3 times for those who shave and only once for those who trim — shaving carries far more reward for men",
      "You will find barbers (hallaqs) set up specifically for pilgrims right outside the Mas'a and around the Haram — they are experienced and fast",
      "Keep the hair you cut as a reminder of your Umrah — some pilgrims bury it",
      "The moment your hair is cut is one of the most emotional moments of Umrah — many people cry. Let it out",
      "After exiting Ihram take a shower, apply perfume and wear your best clothes — you are now returning to normal life having completed a great act of worship",
      "Your sins from the moment of Ihram until now have been forgiven — the Prophet ﷺ said whoever performs Umrah without committing obscenity or sin returns like the day his mother gave birth to him",
      "Make a list of everything you want to do differently after Umrah — this is the best time to make resolutions"
    ],
    femaleNote: "Women cut only a fingertip length — approximately 2-3 cm — from the ends of the hair. Do NOT shave the head — this is prohibited for women. You do not need to cut from every strand — gather your hair and cut a small amount from the ends. This can be done privately without exposing your hair in public. After cutting you exit Ihram and all restrictions are lifted — you may return to your normal clothing and routine.",
  },
  {
    id: "7", title: "Umrah Complete", color: "#E1F5EE", textColor: "#085041", duration: "Done!",
    description: "Alhamdulillah. You have completed your Umrah. Take a moment to sit, reflect and thank Allah for choosing you — out of billions of people on this earth, Allah invited you to His House. Not everyone who wishes to come gets to come. You were chosen. The Prophet ﷺ said that an accepted Umrah expiates all sins between it and the previous Umrah. You are leaving this place as pure as the day you were born. Now the question is — what will you do with this new beginning?",
    steps: [
      "Find a quiet spot in the Haram or near the Kaaba and sit in reflection — let the reality of what you just completed sink in",
      "Make a long personal dua — ask for everything. Your duas after Umrah are at their most powerful",
      "Pray 2 rakats of shukr (gratitude) — thank Allah for the ability, health and means to perform Umrah",
      "Perform Tawaf An-Nafl (voluntary Tawaf) as many times as you wish — every round is rewarded",
      "Spend as much time in the Haram as possible — sitting in the Haram is worship even without doing anything",
      "Visit the Kaaba at different times — night Tawaf after Tahajjud is one of the most beautiful experiences in existence",
      "Drink Zamzam water abundantly — make dua with each sip",
      "Read Quran facing the Kaaba — the reward is multiplied in the Haram",
      "Make dua for everyone who asked you to make dua for them — you are in the best place to have duas accepted",
      "Before leaving Makkah perform Tawaf Al-Wadaa (farewell Tawaf) as your last act"
    ],
    duas: [
      {
        title: "Dua of acceptance — the most important dua after Umrah",
        arabic: "رَبَّنَا تَقَبَّلْ مِنَّا إِنَّكَ أَنْتَ السَّمِيعُ الْعَلِيمُ",
        transliteration: "Rabbana taqabbal minna innaka Anta-s-Sami'ul-'Alim",
        translation: "Our Lord accept from us, indeed You are the All-Hearing the All-Knowing"
      },
      {
        title: "Dua of gratitude for being chosen",
        arabic: "اللَّهُمَّ لَكَ الْحَمْدُ كُلُّهُ وَلَكَ الشُّكْرُ كُلُّهُ وَإِلَيْكَ يَرْجِعُ الْأَمْرُ كُلُّهُ",
        transliteration: "Allahumma lakal hamdu kulluhu wa lakash-shukru kulluhu wa ilayka yarji'ul amru kulluh",
        translation: "O Allah all praise belongs to You, all gratitude belongs to You and all matters return to You"
      },
      {
        title: "Dua for steadfastness after Umrah",
        arabic: "اللَّهُمَّ اجْعَلْنِي مِنَ الَّذِينَ إِذَا أَحْسَنُوا اسْتَبْشَرُوا وَإِذَا أَسَاءُوا اسْتَغْفَرُوا",
        transliteration: "Allahumma aj'alni minal ladhina idha ahsanu istabsharu wa idha asa'u istaghfaru",
        translation: "O Allah make me of those who when they do good they rejoice and when they do wrong they seek forgiveness"
      },
      {
        title: "Dua for a return to the Haram",
        arabic: "اللَّهُمَّ لَا تَجْعَلْهُ آخِرَ الْعَهْدِ مِنَّا بِبَيْتِكَ الْحَرَامِ",
        transliteration: "Allahumma la taj'alhu akhiral ahdi minna bi baytikal haram",
        translation: "O Allah do not make this our last visit to Your Sacred House"
      },
      {
        title: "Tawaf Al-Wadaa — farewell dua when leaving the Haram",
        arabic: "اللَّهُمَّ إِنَّ هَذَا الْبَيْتَ بَيْتُكَ وَالْعَبْدُ عَبْدُكَ وَابْنُ عَبْدِكَ وَابْنُ أَمَتِكَ حَمَلْتَنِي عَلَى مَا سَخَّرْتَ لِي مِنْ خَلْقِكَ",
        transliteration: "Allahumma innal bayta baytuka wal abdu abduka wabnu abdika wabnu amatika hamaltani ala ma sakhkharta li min khalqik",
        translation: "O Allah this house is Your house and the servant is Your servant, the son of Your servant and the son of Your maidservant. You carried me on what You have subjected for me of Your creation"
      },
      {
        title: "Bonus — dua for the whole Ummah from the Haram",
        arabic: "اللَّهُمَّ أَصْلِحْ أُمَّةَ مُحَمَّدٍ، اللَّهُمَّ فَرِّجْ عَنْ أُمَّةِ مُحَمَّدٍ، اللَّهُمَّ ارْحَمْ أُمَّةَ مُحَمَّدٍ",
        transliteration: "Allahumma aslih ummata Muhammad, Allahumma farrij an ummati Muhammad, Allahumma irham ummata Muhammad",
        translation: "O Allah reform the Ummah of Muhammad, O Allah relieve the Ummah of Muhammad, O Allah have mercy on the Ummah of Muhammad"
      },
      {
        title: "Bonus — dua for parents",
        arabic: "رَبِّ اغْفِرْ لِي وَلِوَالِدَيَّ وَارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا",
        transliteration: "Rabbighfir li wa liwaalidayya warhamhuma kama rabbayani saghira",
        translation: "My Lord forgive me and my parents and have mercy on them as they raised me when I was young"
      }
    ],
    tips: [
      "The sign of an accepted Umrah is that you return home a better person — guard your good deeds after you leave",
      "Do not go back to sins after Umrah — the Prophet ﷺ compared returning to sin after repentance to a dog returning to its vomit",
      "The best souvenir from Umrah is not dates or zamzam — it is a changed heart",
      "Make a list of 3 things you will change in your life after Umrah — write them down and stick to them",
      "Perform Tawaf An-Nafl as many times as you can during your remaining stay — every round is sadaqah for every bone in your body",
      "Night Tawaf especially after Tahajjud is one of the most breathtaking experiences — the Haram is quieter and the atmosphere is extraordinary",
      "The Prophet ﷺ said — follow up Umrah with Hajj if you can. Start planning your Hajj from now",
      "Before leaving make dua at every blessed spot — Multazam (between the Black Stone and the Kaaba door), Maqam Ibrahim, Zamzam, Hijr Ismail",
      "The Multazam — the area between the Black Stone and the door of the Kaaba — is one of the most powerful spots for dua. Press your chest and face against it if you can reach it and pour your heart out"
    ],
    femaleNote: "Women should try to visit the Haram at different times — early Fajr and late night after Isha are the best times for women to access quieter areas of the Haram. Women should make the most of Tawaf An-Nafl during their remaining days — every round is immensely rewarded. Before leaving make dua at the Multazam if you can reach it — if not, raise your hands facing it from wherever you are. Ask Allah to bring you back — very few people get this opportunity and those who ask sincerely are often brought back.",
  },
]

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
  const { theme } = useTheme()
  const phaseId = Array.isArray(phase) ? phase[0] : phase
  const data = phasesData.find(p => p.id === phaseId)
  const currentIndex = phaseOrder.findIndex(p => p.id === phaseId)
  const nextPhase = phaseOrder[currentIndex + 1]
  const [isCompleted, setIsCompleted] = useState(false)
  const [gender, setGender] = useState<"male" | "female">("male")
  const { t } = useTranslation()

  useEffect(() => {
    const checkProgress = async () => {
      const progress = await getUmrahProgress()
      setIsCompleted(progress.includes(phaseId ?? ""))
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setGender(user.user_metadata?.gender || "male")
    }
    checkProgress()
  }, [])

  const handleMarkComplete = async () => {
    const newState = await markPhaseComplete(phaseId ?? "")
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

        {/* Header — uses phase color */}
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

          {/* Female note */}
          {gender === "female" && data.femaleNote && (
            <View style={styles.femaleNote}>
              <Ionicons name="information-circle" size={18} color="#1E3A5F" />
              <Text style={styles.femaleNoteText}>{data.femaleNote}</Text>
            </View>
          )}

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
            <TouchableOpacity style={styles.nextBtn} onPress={() => router.push(`/umrah/${nextPhase.id}`)}>
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
              <Text style={styles.completionTitle}>{t("umrahComplete")}</Text>
              <Text style={styles.completionText}>{t("umrahCompleteMsg")}</Text>
            </View>
          )}
        </View>

        {/* Mark as complete */}
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
  femaleNote: { flexDirection: "row", gap: 8, backgroundColor: "#E6F1FB", borderRadius: 10, padding: 12, marginTop: 12, alignItems: "flex-start" },
  femaleNoteText: { flex: 1, fontSize: 13, color: "#0C447C", lineHeight: 20 },
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