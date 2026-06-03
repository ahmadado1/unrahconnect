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
    description: "Hajj is the fifth pillar of Islam and the greatest journey a Muslim can undertake in their lifetime. It is obligatory once in a lifetime for every Muslim who is physically and financially able. You are about to walk in the footsteps of Ibrahim عليه السلام, Hajar, Ismail عليه السلام and the Prophet Muhammad ﷺ himself. Millions of Muslims from every corner of the earth gather as one — no kings, no servants, no rich, no poor — all equal before Allah in two white sheets. Prepare your heart as much as your body. This journey will change you forever.",
    steps: [
      "Learn the complete rituals of Hajj before you go — ignorance leads to mistakes that may require expiation",
      "Make sincere Tawbah (repentance) before Hajj — come to Allah's house with a clean heart",
      "Write your will before departing — this is a Sunnah of the Prophet ﷺ before any long journey",
      "Trim nails, remove unwanted body hair and prepare the body before Ghusl",
      "Perform Ghusl with the intention of Ihram — this is Sunnah even for women in their menstrual cycle",
      "Men apply perfume to the body before wearing Ihram — not to the garments themselves",
      "Men wear two white unstitched sheets — Izar (lower) and Rida (upper). No underwear or stitched clothing",
      "Women wear their normal modest clothing in any colour — no special garment required",
      "Pray 2 rakats of Ihram sunnah prayer — Surah Al-Kafirun in the first rakat and Al-Ikhlas in the second",
      "Make the Niyyah for Hajj at the Miqat — say it aloud",
      "Begin reciting the Talbiyah — men loudly, women quietly — and do not stop until you stone the Jamarat on Eid day"
    ],
    duas: [
      {
        title: "Niyyah for Hajj",
        arabic: "لَبَّيْكَ اللَّهُمَّ حَجًّا",
        transliteration: "Labbayka Allahumma Hajjan",
        translation: "Here I am O Allah, for Hajj"
      },
      {
        title: "Talbiyah — recite continuously until the stoning of Jamarat",
        arabic: "لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيكَ لَكَ",
        transliteration: "Labbayk Allahumma labbayk, labbayk la sharika laka labbayk, innal hamda wan-ni'mata laka wal-mulk, la sharika lak",
        translation: "Here I am O Allah, here I am. Here I am, You have no partner, here I am. Verily all praise, grace and sovereignty belong to You. You have no partner"
      },
      {
        title: "Dua after putting on Ihram",
        arabic: "اللَّهُمَّ إِنِّي أُرِيدُ الْحَجَّ فَيَسِّرْهُ لِي وَتَقَبَّلْهُ مِنِّي",
        transliteration: "Allahumma inni uridu al-hajja fa yassirhu li wa taqabbalhu minni",
        translation: "O Allah I intend to perform Hajj so make it easy for me and accept it from me"
      },
      {
        title: "Dua for a Mabrur Hajj",
        arabic: "اللَّهُمَّ اجْعَلْهُ حَجًّا مَبْرُورًا وَسَعْيًا مَشْكُورًا وَذَنْبًا مَغْفُورًا",
        transliteration: "Allahumma aj'alhu hajjan mabruran wa sa'yan mashkuran wa dhanban maghfura",
        translation: "O Allah make it an accepted Hajj, an appreciated effort and a forgiven sin"
      },
      {
        title: "Bonus — dua for ease throughout Hajj",
        arabic: "اللَّهُمَّ يَسِّرْ وَلَا تُعَسِّرْ وَتَمِّمْ بِالْخَيْرِ",
        transliteration: "Allahumma yassir wa la tu'assir wa tammim bil khayr",
        translation: "O Allah make it easy and do not make it difficult and complete it with goodness"
      },
      {
        title: "Bonus — dua of Ibrahim عليه السلام when he called people to Hajj",
        arabic: "رَبَّنَا وَاجْعَلْنَا مُسْلِمَيْنِ لَكَ وَمِنْ ذُرِّيَّتِنَا أُمَّةً مُسْلِمَةً لَكَ وَأَرِنَا مَنَاسِكَنَا وَتُبْ عَلَيْنَا إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ",
        transliteration: "Rabbana waj'alna muslimayni laka wa min dhurriyyatina ummatan muslimatan laka wa arina manasikana wa tub alayna innaka Anta-t-Tawwabur-Rahim",
        translation: "Our Lord make us both submissive to You and from our descendants a nation submissive to You. Show us our rites of worship and accept our repentance. Indeed You are the Ever-Relenting the Most Merciful"
      }
    ],
    tips: [
      "Hajj is physically one of the most demanding acts of worship — train your body before you go. Walk long distances in the months before Hajj",
      "The Prophet ﷺ said — whoever performs Hajj without committing obscenity or sin returns like the day his mother gave birth to him",
      "Hajj is only accepted from those who have fulfilled the rights of others — pay your debts, ask forgiveness from those you have wronged before you leave",
      "Pack light — you will be moving between multiple locations. Comfort is more important than luxury",
      "Wear comfortable shoes — you will walk enormous distances. Break in your shoes before Hajj",
      "Bring a small notebook — write your duas, the names of people who asked you to make dua for them, and your reflections each day",
      "The Talbiyah is the heartbeat of Hajj — recite it at every moment, especially when going uphill, downhill, boarding transport or meeting other pilgrims",
      "Join a reputable Hajj group with a knowledgeable scholar who can guide you through the rituals",
      "Be patient with crowds, heat and difficulty — every hardship during Hajj is expiation for sins",
      "The reward of a Mabrur (accepted) Hajj is nothing but Jannah — there is no greater bargain"
    ],
    femaleNote: "Women must be accompanied by a Mahram (husband or male relative) for Hajj — this is an Islamic requirement not a logistical suggestion. Women wear their normal modest clothing — no special Ihram garment. Women do not cover the face or hands during Ihram. Women in their menstrual cycle still enter Ihram and perform all rituals except Tawaf — they wait until they are pure before performing Tawaf. Do not let your cycle cause you anxiety — many women experience this and the scholars have addressed it comprehensively. Women recite Talbiyah quietly.",
  },
  {
    id: "2", title: "Arriving in Makkah", color: "#E1F5EE", textColor: "#085041", duration: "1 day",
    description: "Arriving in Makkah for Hajj is different from arriving for Umrah. The city is at its most alive — millions of pilgrims from every nation on earth have gathered in one place answering the call of Ibrahim عليه السلام. The energy is unlike anything you will ever experience. Your first task upon arriving is Tawaf Al-Qudum — the arrival Tawaf — which is a Sunnah greeting of the Masjid Al-Haram. Use every moment in Makkah before the main days of Hajj to worship, rest and prepare spiritually.",
    steps: [
      "Enter Makkah reciting the dua for entering a city — be in a state of wudu if possible",
      "Head to Masjid Al-Haram and enter with your right foot reciting the masjid entry dua",
      "When the Kaaba first comes into view — stop, raise your hands and make as much dua as possible. This is one of the most powerful moments for dua acceptance",
      "Perform Tawaf Al-Qudum (arrival Tawaf) — 7 rounds around the Kaaba. This is Sunnah for those performing Hajj Qiran or Ifrad",
      "Those performing Hajj Tamattu who already completed Umrah do not need to perform Tawaf Al-Qudum",
      "After Tawaf pray 2 rakats behind Maqam Ibrahim",
      "Drink Zamzam water making dua while drinking",
      "Perform Sa'i if you are performing Hajj Qiran or Ifrad — those doing Tamattu already completed Sa'i during Umrah",
      "Settle in your accommodation and rest — the hardest days begin on the 8th of Dhul Hijjah",
      "Spend your time in the Haram in worship — Tawaf, Quran, dua and dhikr",
      "Familiarise yourself with the layout of the Haram, the routes to Mina, Arafah and Muzdalifah"
    ],
    duas: [
      {
        title: "Dua upon entering Makkah",
        arabic: "اللَّهُمَّ هَذَا حَرَمُكَ وَأَمْنُكَ فَحَرِّمْنِي عَلَى النَّارِ وَأَمِّنِّي مِنْ عَذَابِكَ يَوْمَ تَبْعَثُ عِبَادَكَ",
        transliteration: "Allahumma hadha haramuka wa amnuka faharrimni alan-nar wa amminni min adhabika yawma tab'athu ibadak",
        translation: "O Allah this is Your sanctuary and Your place of safety, so forbid my flesh to the Hellfire and keep me safe from Your punishment on the day You resurrect Your servants"
      },
      {
        title: "Dua upon first seeing the Kaaba",
        arabic: "اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ فَحَيِّنَا رَبَّنَا بِالسَّلَامِ",
        transliteration: "Allahumma Anta-s-Salamu wa minka-s-salamu fa hayyina Rabbana bis-salam",
        translation: "O Allah You are Peace and from You comes peace, so greet us our Lord with peace"
      },
      {
        title: "Dua for Zamzam water",
        arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا وَاسِعًا وَشِفَاءً مِنْ كُلِّ دَاءٍ",
        transliteration: "Allahumma inni as'aluka ilman nafi'an wa rizqan wasi'an wa shifa'an min kulli da'",
        translation: "O Allah I ask You for beneficial knowledge, abundant provision and cure from every disease"
      },
      {
        title: "Bonus — dua for the days ahead",
        arabic: "اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ",
        transliteration: "Allahumma a'inni ala dhikrika wa shukrika wa husni ibadatik",
        translation: "O Allah help me to remember You, to be grateful to You and to worship You in the best manner"
      },
      {
        title: "Bonus — dua when entering the Haram",
        arabic: "بِسْمِ اللَّهِ وَالصَّلَاةُ وَالسَّلَامُ عَلَى رَسُولِ اللَّهِ، اللَّهُمَّ اغْفِرْ لِي ذُنُوبِي وَافْتَحْ لِي أَبْوَابَ رَحْمَتِكَ",
        transliteration: "Bismillahi was-salatu was-salamu ala rasulillah, Allahumma ighfir li dhunubi waftah li abwaba rahmatik",
        translation: "In the name of Allah and peace and blessings upon the Messenger of Allah. O Allah forgive my sins and open for me the gates of Your mercy"
      }
    ],
    tips: [
      "Use the days before the 8th of Dhul Hijjah wisely — do as much Tawaf as possible while you still can move freely",
      "The Haram will become extremely crowded as Hajj days approach — learn the layout early",
      "Rest as much as possible — sleep is worship during Hajj when it is to prepare for the rituals",
      "There are three types of Hajj — Tamattu (most common, perform Umrah first then Hajj), Qiran (Umrah and Hajj together without exiting Ihram) and Ifrad (Hajj only). Know which one you are performing",
      "Hajj Tamattu requires a sacrifice (Hady) — arrange this in advance through your Hajj group or an authorised service",
      "Eat well and stay hydrated — the heat in Makkah during Hajj season can be extreme",
      "Keep your Hajj documents, passport and important items in a secure pouch worn under your Ihram",
      "Memorise or save the address of your accommodation — it is easy to get lost in the crowds"
    ],
    femaleNote: "Women should stay close to their Mahram at all times in the crowded Haram. Women do not perform Idtiba or Raml during Tawaf Al-Qudum — walk at a normal pace. Women should use the less crowded times to perform Tawaf — after Fajr and late at night. Women in their menstrual cycle skip Tawaf Al-Qudum and wait until they are pure — this does not affect the validity of their Hajj.",
  },
  {
    id: "3", title: "Day of Tarwiyah — Mina", color: "#FAEEDA", textColor: "#633806", duration: "1 day",
    description: "The 8th of Dhul Hijjah is called Yawm Al-Tarwiyah — the Day of Quenching Thirst — named after the day when pilgrims historically filled their water vessels in preparation for the journey to Arafah. This is the day Hajj truly begins. You leave the comforts of Makkah and move to Mina — a valley of white tents stretching as far as the eye can see. It is a powerful reminder that this world is temporary — you are a traveller passing through. Spend this night in worship and prepare your heart and your duas for the greatest day of the year — the Day of Arafah.",
    steps: [
      "After Fajr prayer on the 8th of Dhul Hijjah — those performing Hajj Tamattu re-enter Ihram from their accommodation in Makkah",
      "Make the Niyyah for Hajj and begin reciting Talbiyah again",
      "Travel to Mina — it is approximately 8km from Masjid Al-Haram",
      "Arrive in Mina and locate your assigned tent",
      "Pray Dhuhr, Asr, Maghrib and Isha in Mina — shorten prayers to 2 rakats (Qasr) but do NOT combine them in Mina",
      "Pray Fajr the next morning in Mina before departing to Arafah",
      "Spend the night in Mina in worship — dhikr, dua, Quran recitation and salawat",
      "Prepare your duas for Arafah — write them down, organise them. Tomorrow is the most important day",
      "Sleep early if you can — the Day of Arafah requires full energy and presence"
    ],
    duas: [
      {
        title: "Niyyah for Hajj when re-entering Ihram (Tamattu pilgrims)",
        arabic: "لَبَّيْكَ اللَّهُمَّ حَجًّا",
        transliteration: "Labbayka Allahumma Hajjan",
        translation: "Here I am O Allah, for Hajj"
      },
      {
        title: "Talbiyah — recite continuously",
        arabic: "لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيكَ لَكَ",
        transliteration: "Labbayk Allahumma labbayk, labbayk la sharika laka labbayk, innal hamda wan-ni'mata laka wal-mulk, la sharika lak",
        translation: "Here I am O Allah, here I am. Here I am, You have no partner, here I am. Verily all praise, grace and sovereignty belong to You. You have no partner"
      },
      {
        title: "Dua when arriving in Mina",
        arabic: "اللَّهُمَّ هَذِهِ مِنًى فَامْنُنْ عَلَيَّ بِمَا مَنَنْتَ بِهِ عَلَى أَوْلِيَائِكَ",
        transliteration: "Allahumma hadhihi Mina famnun alayya bima mananta bihi ala awliya'ik",
        translation: "O Allah this is Mina so bestow upon me what You have bestowed upon Your close friends"
      },
      {
        title: "Dua before sleeping — preparing for Arafah",
        arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ",
        transliteration: "Allahumma inni as'alukal afwa wal afiyata fid-dunya wal akhirah",
        translation: "O Allah I ask You for pardon and well-being in this world and the next"
      },
      {
        title: "Bonus — dua of Ibrahim عليه السلام who walked this same path",
        arabic: "رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِنْ ذُرِّيَّتِي رَبَّنَا وَتَقَبَّلْ دُعَاءِ",
        transliteration: "Rabbij'alni muqimas-salati wa min dhurriyyati Rabbana wa taqabbal du'a",
        translation: "My Lord make me one who establishes prayer and from my descendants. Our Lord and accept my supplication"
      },
      {
        title: "Bonus — dua for the night in Mina",
        arabic: "سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا أَنْتَ أَسْتَغْفِرُكَ وَأَتُوبُ إِلَيْكَ",
        transliteration: "Subhanakal-lahumma wa bihamdika ash-hadu alla ilaha illa Anta astaghfiruka wa atubu ilayk",
        translation: "Glory be to You O Allah and with Your praise I bear witness that there is no god but You I seek Your forgiveness and repent to You"
      }
    ],
    tips: [
      "Mina is a city of tents — your tent is assigned by your Hajj group. Do not wander too far and memorise landmarks near your tent",
      "The distance from the Haram to Mina is about 8km — many pilgrims walk. Your Hajj group will arrange transport",
      "Prayers in Mina are shortened (Qasr) to 2 rakats but NOT combined — pray each prayer at its own time",
      "This is the only location in Hajj where prayers are shortened but not combined — many people make the mistake of combining",
      "Use the night in Mina wisely — make a complete list of duas for Arafah. Ask for everything — dunya and akhirah",
      "The Prophet ﷺ spent this night in Mina in worship — follow his Sunnah",
      "Think of Ibrahim عليه السلام — he walked through Mina on his way to sacrifice his son. You are walking in his footsteps",
      "Keep your mobile phone charged — you will need it for navigation and communication in the crowds",
      "Stay hydrated — the nights in Mina can still be warm and the next day will be very long"
    ],
    femaleNote: "Women should stay within the tent and close to their Mahram during the night in Mina. The tents are separated by gender in most Hajj groups. Women in their menstrual cycle perform all rituals in Mina normally — there is no Tawaf required at this stage. Make the most of the night in Mina — recite Quran, make dhikr and prepare your personal duas for Arafah. The night before Arafah is precious — do not waste it on sleep alone.",
  },
  {
    id: "4", title: "Day of Arafah", color: "#FAECE7", textColor: "#712B13", duration: "1 day",
    description: "The 9th of Dhul Hijjah — Yawm Arafah — is the most important day in the Islamic calendar. It is the pillar of Hajj — the Prophet ﷺ said 'Hajj is Arafah'. Missing this day means missing Hajj entirely. On this day Allah descends to the lowest heaven and boasts about His servants to the angels saying 'Look at my servants — they have come dishevelled and dusty from every distant pass. They hope for My mercy.' On no other day are more people freed from the Fire than on the Day of Arafah. Every dua you make, every tear you shed, every moment of dhikr — it all counts. Do not waste a single second.",
    steps: [
      "Depart from Mina to Arafah after Fajr prayer on the 9th of Dhul Hijjah",
      "Arafah is approximately 14km from Makkah — your Hajj group will arrange transport",
      "Arrive at Arafah and locate your tent — the plain of Arafah is enormous",
      "Combine and shorten Dhuhr and Asr prayers — pray them together at Dhuhr time (2 rakats each)",
      "The Wuquf (standing) at Arafah begins after Dhuhr and lasts until sunset — this is the pillar of Hajj",
      "Face the Qibla, raise your hands and make continuous dua — do not stop",
      "Alternate between dua, dhikr, Quran recitation, salawat and istighfar throughout the afternoon",
      "Do not leave Arafah before sunset — leaving early invalidates the Hajj",
      "After sunset depart calmly to Muzdalifah — do not rush or push",
      "Pray Maghrib and Isha combined at Muzdalifah — not at Arafah"
    ],
    duas: [
      {
        title: "The best dua on the Day of Arafah — repeat constantly",
        arabic: "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
        transliteration: "La ilaha illallah wahdahu la sharika lah, lahul mulku wa lahul hamdu wa huwa ala kulli shay'in qadir",
        translation: "There is no god but Allah alone, no partner has He. His is the dominion and His is the praise and He is powerful over everything — the Prophet ﷺ said this is the best dua on the Day of Arafah"
      },
      {
        title: "Dua for forgiveness — repeat abundantly",
        arabic: "اللَّهُمَّ إِنَّكَ عَفُوٌّ كَرِيمٌ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي",
        transliteration: "Allahumma innaka afuwwun karimun tuhibbul afwa fa'fu anni",
        translation: "O Allah You are Pardoning and Generous, You love to pardon so pardon me"
      },
      {
        title: "Dua of complete submission at Arafah",
        arabic: "اللَّهُمَّ لَكَ الْحَمْدُ كَالَّذِي نَقُولُ وَخَيْرًا مِمَّا نَقُولُ، اللَّهُمَّ لَكَ صَلَاتِي وَنُسُكِي وَمَحْيَايَ وَمَمَاتِي وَإِلَيْكَ مَآبِي",
        transliteration: "Allahumma lakal hamdu kallladhi naqulu wa khayran mimma naqul, Allahumma laka salati wa nusuki wa mahyaya wa mamati wa ilayka ma'ab",
        translation: "O Allah Yours is all praise as we say and better than what we say. O Allah to You belongs my prayer, my worship, my life and my death and to You is my return"
      },
      {
        title: "Dua for yourself — pour your heart out",
        arabic: "اللَّهُمَّ اغْفِرْ لِي وَارْحَمْنِي وَاهْدِنِي وَعَافِنِي وَارْزُقْنِي",
        transliteration: "Allahumma ighfir li warhamni wahdini wa'afini warzuqni",
        translation: "O Allah forgive me, have mercy on me, guide me, grant me well-being and provide for me"
      },
      {
        title: "Dua for parents at Arafah",
        arabic: "رَبِّ اغْفِرْ لِي وَلِوَالِدَيَّ وَارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا",
        transliteration: "Rabbighfir li wa liwaalidayya warhamhuma kama rabbayani saghira",
        translation: "My Lord forgive me and my parents and have mercy on them as they raised me when I was young"
      },
      {
        title: "Dua for the entire Ummah at Arafah",
        arabic: "اللَّهُمَّ أَصْلِحْ أُمَّةَ مُحَمَّدٍ، اللَّهُمَّ فَرِّجْ عَنْ أُمَّةِ مُحَمَّدٍ، اللَّهُمَّ ارْحَمْ أُمَّةَ مُحَمَّدٍ",
        transliteration: "Allahumma aslih ummata Muhammad, Allahumma farrij an ummati Muhammad, Allahumma irham ummata Muhammad",
        translation: "O Allah reform the Ummah of Muhammad, O Allah relieve the Ummah of Muhammad, O Allah have mercy on the Ummah of Muhammad"
      },
      {
        title: "Dua for Jannah and protection from Jahannam",
        arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْجَنَّةَ وَأَعُوذُ بِكَ مِنَ النَّارِ",
        transliteration: "Allahumma inni as'alukal jannata wa a'udhu bika minan-nar",
        translation: "O Allah I ask You for Paradise and I seek refuge in You from the Fire"
      },
      {
        title: "Bonus — dua of complete dependence on Allah",
        arabic: "يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ أَصْلِحْ لِي شَأْنِي كُلَّهُ وَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ",
        transliteration: "Ya Hayyu ya Qayyumu birahmatika astaghith, aslih li sha'ni kullahu wa la takilni ila nafsi tarfata ayn",
        translation: "O Ever-Living O Self-Sustaining, by Your mercy I seek help. Set right all my affairs and do not leave me to myself for even the blink of an eye"
      },
      {
        title: "Bonus — dua for hidayah for loved ones",
        arabic: "اللَّهُمَّ اهْدِ قَلْبِي وَقُلُوبَ أَهْلِي إِلَى الصِّرَاطِ الْمُسْتَقِيمِ",
        transliteration: "Allahumma ihdi qalbi wa quluba ahli ilas-siratal mustaqim",
        translation: "O Allah guide my heart and the hearts of my family to the straight path"
      }
    ],
    tips: [
      "This is the day — do not waste it on talking, eating, sleeping or your phone. Every second is priceless",
      "Write your duas before you arrive at Arafah — in the emotion of the moment you may forget what you wanted to ask",
      "Cry if you can — tears at Arafah are a sign of a soft and present heart. If you cannot cry then try to cry",
      "The Prophet ﷺ performed the Wuquf on his camel facing the Qibla with his hands raised — follow this Sunnah",
      "Do not spend Arafah sleeping in the tent — be outside facing the Qibla making dua for as long as you can",
      "Alternate between the best dua (La ilaha illallah wahdahu...) and your personal duas — this is the Sunnah",
      "Make dua for everyone who asked you — your parents, your family, the sick, the oppressed, the entire Ummah",
      "The Prophet ﷺ said on this day Allah frees more people from the Fire than on any other day — be one of them",
      "Do not leave Arafah before sunset under any circumstances — this is a condition of valid Hajj",
      "The boundaries of Arafah are clearly marked — make sure you are within the boundaries. Jabal Ar-Rahmah (the Mount of Mercy) is inside Arafah but standing on it is not required — anywhere within the plain is valid"
    ],
    femaleNote: "Women should make the absolute most of Arafah — this day is equal for men and women before Allah. There are no gender differences in the rituals of Arafah. Women stand, make dua, cry, ask and give their heart to Allah just as the men do. If a woman is in her menstrual cycle she still performs the Wuquf at Arafah — her Hajj is completely valid. Women should find a quiet corner of the tent or the plain, face the Qibla, raise their hands and pour their heart out to Allah. This is your day too.",
  },
  {
    id: "5", title: "Muzdalifah", color: "#EEEDFE", textColor: "#3C3489", duration: "1 night",
    description: "After the spiritual peak of Arafah you descend to Muzdalifah — an open plain between Arafah and Mina where you will spend the night under the open sky. No tents, no hotels, no comforts — just you, millions of fellow pilgrims and the stars above. This is one of the most humbling and beautiful nights of Hajj. The Prophet ﷺ prayed Maghrib and Isha combined here, collected pebbles, rested and then prayed Fajr before departing to Mina. Follow his Sunnah as closely as you can. The tiredness you feel after Arafah is real — but push through. This night is short and immensely blessed.",
    steps: [
      "Depart from Arafah after sunset — move calmly and do not rush or push",
      "Recite Talbiyah and dhikr throughout the journey to Muzdalifah",
      "Upon arriving at Muzdalifah pray Maghrib and Isha combined and shortened — Maghrib 3 rakats, Isha 2 rakats",
      "Collect 49 pebbles if leaving after midnight or 70 pebbles if staying until Fajr — each pebble should be the size of a chickpea",
      "Pebbles can be collected anywhere in Muzdalifah — you do not need to search for a specific spot",
      "Rest and sleep — your body needs recovery after Arafah and before the demanding Day of Eid",
      "Wake for Tahajjud if you are able — the night of Muzdalifah is precious",
      "Pray Fajr at Muzdalifah — this is Sunnah",
      "After Fajr face the Qibla and make abundant dua until it becomes light",
      "Depart to Mina after Fajr — the weak, elderly and women may depart after midnight"
    ],
    duas: [
      {
        title: "Dua upon arriving at Muzdalifah",
        arabic: "اللَّهُمَّ إِنَّكَ قُلْتَ ادْعُونِي أَسْتَجِبْ لَكُمْ وَإِنَّكَ لَا تُخْلِفُ الْمِيعَادَ",
        transliteration: "Allahumma innaka qulta ud'uni astajib lakum wa innaka la tukhlifu al-mi'ad",
        translation: "O Allah You have said call upon Me and I will respond to you and You never break Your promise"
      },
      {
        title: "Dua after Fajr at Muzdalifah facing the Qibla",
        arabic: "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
        transliteration: "La ilaha illallah wahdahu la sharika lah, lahul mulku wa lahul hamdu wa huwa ala kulli shay'in qadir",
        translation: "There is no god but Allah alone, no partner has He. His is the dominion and His is the praise and He is powerful over everything"
      },
      {
        title: "Dua for the night under the sky",
        arabic: "اللَّهُمَّ اجْعَلْ فِي قَلْبِي نُورًا وَفِي سَمْعِي نُورًا وَفِي بَصَرِي نُورًا",
        transliteration: "Allahumma aj'al fi qalbi nuran wa fi sam'i nuran wa fi basari nura",
        translation: "O Allah place light in my heart, light in my hearing and light in my sight"
      },
      {
        title: "Bonus — dua of gratitude after Arafah",
        arabic: "الْحَمْدُ لِلَّهِ الَّذِي هَدَانَا لِهَذَا وَمَا كُنَّا لِنَهْتَدِيَ لَوْلَا أَنْ هَدَانَا اللَّهُ",
        transliteration: "Alhamdulillahil ladhi hadana lihadha wa ma kunna linahtadiya lawla an hadanallah",
        translation: "All praise be to Allah who guided us to this — we would never have been guided had Allah not guided us"
      },
      {
        title: "Bonus — dua for protection through the night",
        arabic: "بِسْمِكَ اللَّهُمَّ أَحْيَا وَبِسْمِكَ أَمُوتُ",
        transliteration: "Bismika Allahumma ahya wa bismika amut",
        translation: "In Your name O Allah I live and in Your name I die"
      },
      {
        title: "Bonus — dua before sleeping at Muzdalifah",
        arabic: "اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ",
        transliteration: "Allahumma qini adhabaka yawma tab'athu ibadak",
        translation: "O Allah protect me from Your punishment on the day You resurrect Your servants"
      }
    ],
    tips: [
      "Muzdalifah has no tents or shelter — you sleep on the ground under the open sky. Bring a light blanket or sleeping bag",
      "The night is short — Arafah ends at sunset and Fajr comes early. Sleep quickly and wake for Fajr",
      "Collect pebbles carefully — they should be the size of a chickpea, not too large. Washing them is not required",
      "You need 49 pebbles if leaving early or 70 if staying for all 3 days of Tashreeq — collect extra just in case",
      "The Prophet ﷺ made abundant dua after Fajr at Muzdalifah facing the Qibla until it became quite light — do the same",
      "The elderly, sick and women with children are permitted to leave after midnight — this is a valid concession",
      "Muzdalifah is a Mash'ar — a sacred marker. The Quran mentions it — 'When you depart from Arafah remember Allah at Al-Mash'ar Al-Haram'",
      "Despite the tiredness push yourself to make dua after Fajr — this is one of the most accepted times for dua in all of Hajj",
      "Keep your pebbles in a small bag or pouch — you will need them organised for the stoning of the Jamarat"
    ],
    femaleNote: "Women and those with children or the elderly in their care are explicitly permitted by the Prophet ﷺ to leave Muzdalifah after midnight — you do not need to wait for Fajr. This is not a concession out of weakness — it is a mercy from Allah and a ruling from the Prophet ﷺ himself. Women who leave early should still collect their pebbles before departing. Arriving at Mina early allows women to stone the Jamarat before the crowds build up — this is actually better and safer for women.",
  },
  {
    id: "6", title: "Day of Eid — Jamarat", color: "#FBEAF0", textColor: "#72243E", duration: "1 day",
    description: "The 10th of Dhul Hijjah — Yawm Al-Nahr — Eid Al-Adha. This is the busiest and most demanding day of Hajj. Four major rituals must be performed — stoning the large Jamarat, offering the sacrifice, shaving or trimming the hair and performing Tawaf Al-Ifadah. They should be done in this order following the Sunnah of the Prophet ﷺ. This is also the day the Talbiyah stops — you have been answering the call of Allah since Ihram and now you arrive at the moment of completion. The stoning of the Jamarat commemorates Ibrahim عليه السلام stoning Shaytan when he tried to dissuade him from sacrificing his son. With every pebble you throw you are declaring — I choose Allah over everything.",
    steps: [
      "Arrive at the Jamarat bridge from Muzdalifah — go early to avoid the worst of the crowds",
      "Stop reciting the Talbiyah when you begin the stoning",
      "Stone only the large Jamarat (Jamarat Al-Aqabah) today — throw 7 pebbles one at a time",
      "Say Allahu Akbar with each throw — throw with purpose and intention not just mechanically",
      "The pebble must land in the basin — if it misses throw another",
      "After stoning arrange for the sacrifice (Hady) — your Hajj group will handle this or you can use an authorised online service",
      "After the sacrifice — men shave the entire head (Halq) which is more rewarding or trim from all parts (Taqsir)",
        "Women cut only a fingertip length from the ends of hair — do not shave",
      "At this point partial Ihram ends — you may wear normal clothes and use perfume. Marital relations remain prohibited until Tawaf Al-Ifadah",
      "Travel to Masjid Al-Haram and perform Tawaf Al-Ifadah — 7 rounds around the Kaaba",
      "Perform Sa'i if you did not do it during Tawaf Al-Qudum",
      "After Tawaf Al-Ifadah all Ihram restrictions are fully lifted including marital relations",
      "Return to Mina for the nights of Tashreeq"
    ],
    duas: [
      {
        title: "When throwing each pebble at the Jamarat",
        arabic: "اللَّهُ أَكْبَرُ",
        transliteration: "Allahu Akbar",
        translation: "Allah is the Greatest — say this with every single pebble thrown"
      },
      {
        title: "Dua after stoning the Jamarat",
        arabic: "اللَّهُمَّ اجْعَلْهُ حَجًّا مَبْرُورًا وَذَنْبًا مَغْفُورًا وَسَعْيًا مَشْكُورًا",
        transliteration: "Allahumma aj'alhu hajjan mabruran wa dhanban maghfuran wa sa'yan mashkura",
        translation: "O Allah make it an accepted Hajj, a forgiven sin and an appreciated effort"
      },
      {
        title: "Dua when shaving or cutting hair",
        arabic: "اللَّهُمَّ اغْفِرْ لِلْمُحَلِّقِينَ، اللَّهُمَّ اغْفِرْ لِلْمُحَلِّقِينَ، اللَّهُمَّ اغْفِرْ لِلْمُحَلِّقِينَ وَالْمُقَصِّرِينَ",
        transliteration: "Allahumma ighfir lil muhalliqqin, Allahumma ighfir lil muhalliqqin, Allahumma ighfir lil muhalliqqina wal muqassirin",
        translation: "O Allah forgive those who shave, O Allah forgive those who shave, O Allah forgive those who shave and those who trim — the Prophet ﷺ made dua 3 times for those who shave"
      },
      {
        title: "Dua at the start of Tawaf Al-Ifadah",
        arabic: "بِسْمِ اللَّهِ اللَّهُ أَكْبَرُ، اللَّهُمَّ إِيمَانًا بِكَ وَتَصْدِيقًا بِكِتَابِكَ وَوَفَاءً بِعَهْدِكَ وَاتِّبَاعًا لِسُنَّةِ نَبِيِّكَ",
        transliteration: "Bismillahi Allahu Akbar, Allahumma imanan bika wa tasdiqan bikitabika wa wafa'an bi'ahdika wattiba'an lisunnati nabiyyik",
        translation: "In the name of Allah, Allah is the Greatest. O Allah out of faith in You, belief in Your Book, fulfillment of Your covenant and following the Sunnah of Your Prophet"
      },
      {
        title: "Bonus — dua of Ibrahim عليه السلام at the moment of sacrifice",
        arabic: "إِنِّي وَجَّهْتُ وَجْهِيَ لِلَّذِي فَطَرَ السَّمَاوَاتِ وَالْأَرْضَ حَنِيفًا وَمَا أَنَا مِنَ الْمُشْرِكِينَ",
        transliteration: "Inni wajjahtu wajhiya lillladhi fataras-samawati wal-arda hanifan wa ma ana minal mushrikin",
        translation: "I have turned my face toward He who created the heavens and the earth as a true believer and I am not of those who associate partners with Allah"
      },
      {
        title: "Bonus — dua of gratitude on Eid day",
        arabic: "اللَّهُ أَكْبَرُ اللَّهُ أَكْبَرُ لَا إِلَهَ إِلَّا اللَّهُ وَاللَّهُ أَكْبَرُ اللَّهُ أَكْبَرُ وَلِلَّهِ الْحَمْدُ",
        transliteration: "Allahu Akbar Allahu Akbar la ilaha illallah wallahu Akbar Allahu Akbar wa lillahil hamd",
        translation: "Allah is the Greatest, Allah is the Greatest, there is no god but Allah, Allah is the Greatest, Allah is the Greatest and to Allah belongs all praise — the Takbeer of Eid"
      }
    ],
    tips: [
      "Go to the Jamarat as early as possible — after midnight from Muzdalifah if you can. The crowds are smaller and it is cooler",
      "The Jamarat bridge has multiple levels — use the upper levels to avoid the densest crowds on the ground floor",
      "Throw with purpose — each pebble represents your rejection of Shaytan and your complete submission to Allah",
      "The order matters — stone first, then sacrifice, then shave, then Tawaf. Doing them out of order requires expiation",
      "Tawaf Al-Ifadah is obligatory — Hajj is not complete without it. Do not delay it beyond the 12th of Dhul Hijjah",
      "After Tawaf Al-Ifadah drink Zamzam water abundantly — you are now fully out of Ihram",
      "The sacrifice does not have to be done by your own hands — authorised services allow you to arrange it and it counts",
      "Eid in Mina is unlike any Eid anywhere else on earth — millions of people in white all celebrating together",
      "Despite the exhaustion — this day is one you will remember for the rest of your life. Be fully present",
      "Call your family on Eid — tell them you made dua for them at Arafah and on Eid day"
    ],
    femaleNote: "Women do NOT shave the head — cut only a fingertip length from the ends of hair. This is a firm ruling not a suggestion. Women should go to the Jamarat early — ideally after midnight from Muzdalifah before the crowds peak. Women should stay close to their Mahram at the Jamarat — the crowds can be dangerous. Women perform Tawaf Al-Ifadah the same as men — 7 rounds at a normal pace without Idtiba or Raml. After Tawaf Al-Ifadah all restrictions are lifted for women as well.",
  },
  {
    id: "7", title: "Days of Tashreeq", color: "#FAECE7", textColor: "#712B13", duration: "2-3 days",
    description: "The 11th, 12th and 13th of Dhul Hijjah are called Ayyam Al-Tashreeq — the Days of Drying Meat — named after the practice of drying sacrificial meat in the sun. These are days of celebration, gratitude and continued worship. You remain in Mina and stone all three Jamarat each day. Allah mentions these days in the Quran — 'And remember Allah during the appointed days.' The Prophet ﷺ said these are days of eating, drinking and remembrance of Allah. Do not let the physical exhaustion of the previous days stop you from filling these days with dhikr, dua and gratitude. You are still in one of the holiest places on earth — make every moment count.",
    steps: [
      "Spend the nights of the 11th, 12th and 13th in Mina — spending the night in Mina is obligatory",
      "Each day after Dhuhr time — stone all three Jamarat in order: small (Jamarat Al-Sughra), medium (Jamarat Al-Wusta) then large (Jamarat Al-Aqabah)",
      "Throw 7 pebbles at each Jamarat — 21 pebbles per day, 49 total if leaving on the 12th or 70 total if staying until the 13th",
      "Say Allahu Akbar with each throw",
      "After stoning the small Jamarat — move to the side, face the Qibla and make a long dua",
      "After stoning the medium Jamarat — move to the side, face the Qibla and make a long dua",
      "After stoning the large Jamarat — do not stop for dua here, move on",
      "Stoning must be done after Dhuhr time — stoning before Dhuhr on these days is not valid",
      "Those wishing to leave early may depart on the 12th before sunset — this is called the Rukhsa (concession)",
      "Those who do not leave before sunset on the 12th must stay and stone on the 13th as well",
      "After the final stoning on the last day depart to Makkah for Tawaf Al-Wadaa"
    ],
    duas: [
      {
        title: "When throwing each pebble — all three Jamarat",
        arabic: "اللَّهُ أَكْبَرُ",
        transliteration: "Allahu Akbar",
        translation: "Allah is the Greatest — say with every single pebble"
      },
      {
        title: "Dua after stoning the small Jamarat — face Qibla and raise hands",
        arabic: "اللَّهُمَّ اجْعَلْهُ حَجًّا مَبْرُورًا وَسَعْيًا مَشْكُورًا وَذَنْبًا مَغْفُورًا وَعَمَلًا صَالِحًا مَقْبُولًا",
        transliteration: "Allahumma aj'alhu hajjan mabruran wa sa'yan mashkuran wa dhanban maghfuran wa amalan salihan maqbula",
        translation: "O Allah make it an accepted Hajj, an appreciated effort, a forgiven sin and a righteous deed that is accepted"
      },
      {
        title: "Dua after stoning the medium Jamarat — face Qibla and raise hands",
        arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الشَّيْطَانِ الرَّجِيمِ وَمِنْ كُلِّ شَيْطَانٍ مَرِيدٍ",
        transliteration: "Allahumma inni a'udhu bika minash-shaytanir-rajim wa min kulli shaytanin marid",
        translation: "O Allah I seek refuge in You from the accursed Shaytan and from every rebellious devil"
      },
      {
        title: "Takbeer of Tashreeq — recite after every fard prayer these days",
        arabic: "اللَّهُ أَكْبَرُ اللَّهُ أَكْبَرُ لَا إِلَهَ إِلَّا اللَّهُ وَاللَّهُ أَكْبَرُ اللَّهُ أَكْبَرُ وَلِلَّهِ الْحَمْدُ",
        transliteration: "Allahu Akbar Allahu Akbar la ilaha illallah wallahu Akbar Allahu Akbar wa lillahil hamd",
        translation: "Allah is the Greatest, Allah is the Greatest, there is no god but Allah, Allah is the Greatest, Allah is the Greatest and to Allah belongs all praise"
      },
      {
        title: "Dua for the remaining days of Tashreeq",
        arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
        transliteration: "Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina adhaban-nar",
        translation: "Our Lord give us good in this world and good in the hereafter and save us from the punishment of the Fire"
      },
      {
        title: "Bonus — dua of gratitude for completing Hajj rituals",
        arabic: "الْحَمْدُ لِلَّهِ الَّذِي بِنِعْمَتِهِ تَتِمُّ الصَّالِحَاتُ",
        transliteration: "Alhamdulillahil ladhi bini'matihi tatimus-salihat",
        translation: "All praise be to Allah by whose grace all good deeds are completed"
      },
      {
        title: "Bonus — dua in Mina during the blessed days",
        arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ سُبْحَانَ اللَّهِ الْعَظِيمِ",
        transliteration: "Subhanallahi wa bihamdihi subhanallahil adhim",
        translation: "Glory be to Allah and His is the praise, glory be to Allah the Most Great — the Prophet ﷺ said these two phrases are beloved to Allah, light on the tongue and heavy on the scales"
      },
      {
        title: "Bonus — dua for acceptance before leaving Mina",
        arabic: "اللَّهُمَّ تَقَبَّلْ مِنَّا إِنَّكَ أَنْتَ السَّمِيعُ الْعَلِيمُ وَتُبْ عَلَيْنَا إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ",
        transliteration: "Allahumma taqabbal minna innaka Anta-s-Sami'ul-'Alim wa tub alayna innaka Anta-t-Tawwabur-Rahim",
        translation: "O Allah accept from us, indeed You are the All-Hearing the All-Knowing, and turn to us in forgiveness, indeed You are the Ever-Relenting the Most Merciful"
      }
    ],
    tips: [
      "Stone after Dhuhr time each day — this is a condition for validity. Stoning before Dhuhr on the days of Tashreeq is not accepted according to the majority of scholars",
      "The order of the three Jamarat matters — small first, then medium, then large. Do not change the order",
      "After the small and medium Jamarat move to the side face the Qibla and make a long dua — this is the Sunnah of the Prophet ﷺ",
      "Do not stop for dua after the large Jamarat — move on. This is also the Sunnah",
      "If you wish to leave on the 12th — depart before sunset. If the sun sets while you are still in Mina you must stay and stone on the 13th",
      "Staying until the 13th and stoning all three days is more complete and more rewarding — the Prophet ﷺ stayed",
      "These days are days of eating and drinking — it is prohibited to fast on the days of Tashreeq",
      "Recite the Takbeer of Tashreeq after every fard prayer from Fajr of the 9th until Asr of the 13th",
      "Use the time between stonings for dhikr, Quran, dua and rest — do not waste these precious days",
      "The crowds at the Jamarat thin out significantly after the first day — the 12th and 13th are much easier"
    ],
    femaleNote: "Women should go to the Jamarat with their Mahram and ideally at less crowded times — early afternoon just after Dhuhr or later in the evening. Women are permitted to delay the stoning to nighttime if the crowds are too dangerous during the day — this is a valid concession for safety. Women recite the Takbeer of Tashreeq after every fard prayer quietly. Women who left Muzdalifah early on Eid night already stoned the large Jamarat — they begin the days of Tashreeq stoning all three Jamarat from the 11th.",
  },
  {
    id: "8", title: "Tawaf Al-Wadaa", color: "#E1F5EE", textColor: "#085041", duration: "Few hours",
    description: "Tawaf Al-Wadaa — the Farewell Tawaf — is the last act of Hajj and one of the most emotionally overwhelming moments of the entire journey. You are about to say goodbye to the Kaaba — and nobody knows if they will ever return. The Prophet ﷺ instructed that no one should leave Makkah without making this their final act. As you circle the Kaaba for the last time let every round carry the weight of gratitude — for being chosen, for being guided, for being forgiven. Many pilgrims weep uncontrollably during the farewell Tawaf. Let your tears fall freely — they are from Allah and they return to Allah.",
    steps: [
      "After completing the stoning on your final day in Mina — collect your belongings and travel to Makkah",
      "Go directly to Masjid Al-Haram for Tawaf Al-Wadaa — this should be your last act before leaving Makkah",
      "Perform 7 rounds of Tawaf around the Kaaba — the same as any other Tawaf",
      "Pray 2 rakats behind Maqam Ibrahim after completing the 7 rounds",
      "Drink Zamzam water — make dua while drinking. This may be the last Zamzam you drink for a long time",
      "Go to the Multazam — the area between the Black Stone and the door of the Kaaba — press your chest and face against it and make dua. This is one of the most powerful spots for dua in the entire world",
      "Make dua at Maqam Ibrahim, under the Mizab (the golden waterspout) and in the Hijr Ismail if possible",
      "Take one last look at the Kaaba — let it fill your heart and your memory",
      "Leave the Haram walking backwards if you can — keeping your face towards the Kaaba as long as possible",
      "Do not stay in Makkah long after the farewell Tawaf — depart as soon as reasonably possible"
    ],
    duas: [
      {
        title: "Dua at the Multazam — press against the wall and pour your heart out",
        arabic: "اللَّهُمَّ إِنَّ الْبَيْتَ بَيْتُكَ وَالْعَبْدَ عَبْدُكَ وَابْنُ عَبْدِكَ وَابْنُ أَمَتِكَ، حَمَلْتَنِي عَلَى مَا سَخَّرْتَ لِي مِنْ خَلْقِكَ، وَسَيَّرْتَنِي فِي بِلَادِكَ حَتَّى بَلَّغْتَنِي بِنِعْمَتِكَ إِلَى بَيْتِكَ",
        transliteration: "Allahumma innal bayta baytuka wal abda abduka wabnu abdika wabnu amatika, hamaltani ala ma sakhkharta li min khalqik, wa sayyartani fi biladika hatta ballaghtani bini'matika ila baytik",
        translation: "O Allah this house is Your house and the servant is Your servant, the son of Your servant and the son of Your maidservant. You carried me on what You subjected for me of Your creation and transported me through Your lands until You brought me by Your grace to Your house"
      },
      {
        title: "Dua for return to the Haram — the most important farewell dua",
        arabic: "اللَّهُمَّ لَا تَجْعَلْهُ آخِرَ الْعَهْدِ مِنَّا بِبَيْتِكَ الْحَرَامِ وَيَسِّرْ لَنَا الْعَوْدَةَ إِلَيْهِ",
        transliteration: "Allahumma la taj'alhu akhiral ahdi minna bi baytikal haram wa yassir lana al-awdata ilayh",
        translation: "O Allah do not make this our last visit to Your Sacred House and make it easy for us to return to it"
      },
      {
        title: "Dua when leaving the Haram for the last time",
        arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ أَنْ تَرْزُقَنِي الْعَوْدَةَ إِلَى بَيْتِكَ الْحَرَامِ فِي عَافِيَةٍ وَيُسْرٍ",
        transliteration: "Allahumma inni as'aluka an tarzuqani al-awdata ila baytikal haram fi afiyatin wa yusr",
        translation: "O Allah I ask You to grant me a return to Your Sacred House in health and ease"
      },
      {
        title: "Dua of gratitude for completing Hajj",
        arabic: "رَبَّنَا تَقَبَّلْ مِنَّا إِنَّكَ أَنْتَ السَّمِيعُ الْعَلِيمُ وَتُبْ عَلَيْنَا إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ",
        transliteration: "Rabbana taqabbal minna innaka Anta-s-Sami'ul-'Alim wa tub alayna innaka Anta-t-Tawwabur-Rahim",
        translation: "Our Lord accept from us, indeed You are the All-Hearing the All-Knowing, and turn to us in forgiveness, indeed You are the Ever-Relenting the Most Merciful"
      },
      {
        title: "Dua for the whole Ummah before leaving",
        arabic: "اللَّهُمَّ أَصْلِحْ أُمَّةَ مُحَمَّدٍ، اللَّهُمَّ فَرِّجْ عَنْ أُمَّةِ مُحَمَّدٍ، اللَّهُمَّ ارْحَمْ أُمَّةَ مُحَمَّدٍ",
        transliteration: "Allahumma aslih ummata Muhammad, Allahumma farrij an ummati Muhammad, Allahumma irham ummata Muhammad",
        translation: "O Allah reform the Ummah of Muhammad, O Allah relieve the Ummah of Muhammad, O Allah have mercy on the Ummah of Muhammad"
      },
      {
        title: "Bonus — dua under the Mizab (golden waterspout of the Kaaba)",
        arabic: "اللَّهُمَّ أَظِلَّنِي تَحْتَ ظِلِّ عَرْشِكَ يَوْمَ لَا ظِلَّ إِلَّا ظِلُّكَ",
        transliteration: "Allahumma adhillani tahta dhilli arshika yawma la dhilla illa dhilluk",
        translation: "O Allah shade me under the shade of Your Throne on the day when there is no shade except Your shade"
      },
      {
        title: "Bonus — final salawat upon the Prophet ﷺ before leaving",
        arabic: "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ وَبَارِكْ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ وَبَارَكْتَ عَلَى إِبْرَاهِيمَ وَآلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ",
        transliteration: "Allahumma salli ala Muhammadin wa ala ali Muhammadin wa barik ala Muhammadin wa ala ali Muhammadin kama sallayta wa barakta ala Ibrahima wa ali Ibrahima innaka Hamidun Majid",
        translation: "O Allah send blessings and peace upon Muhammad and the family of Muhammad as You sent blessings and peace upon Ibrahim and the family of Ibrahim. Indeed You are Praiseworthy and Glorious"
      }
    ],
    tips: [
      "The Multazam is between the Black Stone and the door of the Kaaba — press your chest, face, hands and forearms against the wall and make dua. This is one of the most powerful spots for dua on earth",
      "If you cannot reach the Multazam due to crowds — face it from wherever you are and raise your hands. The intention is what matters",
      "The Hijr Ismail — the semi-circular area adjacent to the Kaaba — is actually part of the Kaaba. Praying inside it counts as praying inside the Kaaba. Try to pray 2 rakats inside it if possible",
      "Tawaf Al-Wadaa is obligatory for all pilgrims except women in their menstrual cycle — they are excused without any expiation required",
      "Do not stay in Makkah for unnecessary shopping or activities after the farewell Tawaf — depart promptly",
      "Many pilgrims cry during the farewell Tawaf — do not hold back. These tears are precious",
      "Take photos of the Kaaba to keep — but do not let the camera replace the experience. Be present",
      "The last thing your eyes should see of Makkah is the Kaaba — look back as long as you can",
      "Ask Allah sincerely to bring you back — those who ask with a sincere heart are often answered",
      "The journey home begins — but Hajj has changed you forever. Now live like it"
    ],
    femaleNote: "Women in their menstrual cycle are completely excused from Tawaf Al-Wadaa — there is no penalty and no expiation required. This is an explicit concession from the Prophet ﷺ himself. Women who are pure perform Tawaf Al-Wadaa exactly like any other Tawaf — 7 rounds at a normal pace. Women should try to reach the Multazam if possible — go during a quieter time. If it is too crowded face it from wherever you are and raise your hands. The farewell is the same for men and women — heavy hearts, grateful tears and the hope of return.",
  },
  {
    id: "9", title: "Hajj Complete", color: "#E6F1FB", textColor: "#0C447C", duration: "Done!",
    description: "Alhamdulillah. You have completed Hajj — the fifth pillar of Islam and the greatest physical act of worship a Muslim can perform in their lifetime. You stood at Arafah. You spent the night at Muzdalifah under the open sky. You stoned the Jamarat. You performed Tawaf Al-Ifadah and said farewell to the Kaaba. The Prophet ﷺ said the reward of a Mabrur Hajj is nothing but Jannah. There is no greater transaction in the history of humanity — you gave Allah a few days of your life and He gives you eternal paradise in return. Now comes the hardest part — going home and living like a person who has been to the House of Allah. The real Hajj begins when you return.",
    steps: [
      "Reflect in silence — sit wherever you are and let the reality of what you just completed wash over you",
      "Make a long dua of gratitude — thank Allah for your health, your means, your guidance and your acceptance",
      "Pray 2 rakats of shukr — two units of gratitude prayer for the completion of this great act of worship",
      "Call your family and loved ones — tell them you made dua for them at Arafah, at the Jamarat and at the Kaaba",
      "Make a list of 5 things you will change in your life after Hajj — write them down before you board your flight home",
      "Maintain the good habits built during Hajj — the early Fajr, the dhikr, the connection with the Quran",
      "Be patient on the journey home — the flights, the crowds, the delays. Every hardship is still expiation",
      "When you return home pray 2 rakats of shukr in your local masjid",
      "Share the experience with your community — inspire others to make the journey",
      "Begin planning your next Umrah or return to the Haram — never let this be the last time"
    ],
    duas: [
      {
        title: "Dua of complete acceptance — say this from your heart",
        arabic: "رَبَّنَا تَقَبَّلْ مِنَّا إِنَّكَ أَنْتَ السَّمِيعُ الْعَلِيمُ",
        transliteration: "Rabbana taqabbal minna innaka Anta-s-Sami'ul-'Alim",
        translation: "Our Lord accept from us, indeed You are the All-Hearing the All-Knowing"
      },
      {
        title: "Dua of gratitude for being chosen",
        arabic: "اللَّهُمَّ لَكَ الْحَمْدُ كُلُّهُ وَلَكَ الشُّكْرُ كُلُّهُ وَبِيَدِكَ الْخَيْرُ كُلُّهُ وَإِلَيْكَ يَرْجِعُ الْأَمْرُ كُلُّهُ",
        transliteration: "Allahumma lakal hamdu kulluhu wa lakash-shukru kulluhu wa biyadikal khayru kulluhu wa ilayka yarji'ul amru kulluh",
        translation: "O Allah all praise belongs to You, all gratitude belongs to You, all good is in Your hands and all matters return to You"
      },
      {
        title: "Dua for steadfastness after Hajj",
        arabic: "اللَّهُمَّ اجْعَلْنِي مِمَّنْ إِذَا أُعْطِيَ شَكَرَ وَإِذَا ابْتُلِيَ صَبَرَ وَإِذَا أَذْنَبَ اسْتَغْفَرَ",
        transliteration: "Allahumma aj'alni mimman idha u'tiya shakara wa idha ibtuliya sabara wa idha adhnaba istaghfar",
        translation: "O Allah make me of those who when given they are grateful, when tested they are patient and when they sin they seek forgiveness"
      },
      {
        title: "Dua for a Mabrur Hajj",
        arabic: "اللَّهُمَّ اجْعَلْهُ حَجًّا مَبْرُورًا وَسَعْيًا مَشْكُورًا وَذَنْبًا مَغْفُورًا وَتِجَارَةً لَنْ تَبُورَ",
        transliteration: "Allahumma aj'alhu hajjan mabruran wa sa'yan mashkuran wa dhanban maghfuran wa tijaratan lan tabur",
        translation: "O Allah make it an accepted Hajj, an appreciated effort, a forgiven sin and a trade that will never perish"
      },
      {
        title: "Dua for return to the Haram",
        arabic: "اللَّهُمَّ لَا تَجْعَلْهُ آخِرَ الْعَهْدِ مِنَّا بِبَيْتِكَ الْحَرَامِ وَارْزُقْنَا الْعَوْدَةَ إِلَيْهِ فِي عَافِيَةٍ",
        transliteration: "Allahumma la taj'alhu akhiral ahdi minna bi baytikal haram warzuqna al-awdata ilayhi fi afiyah",
        translation: "O Allah do not make this our last visit to Your Sacred House and grant us a return to it in good health"
      },
      {
        title: "Dua for the entire Ummah upon returning home",
        arabic: "اللَّهُمَّ أَصْلِحْ أُمَّةَ مُحَمَّدٍ، اللَّهُمَّ فَرِّجْ عَنْ أُمَّةِ مُحَمَّدٍ، اللَّهُمَّ ارْحَمْ أُمَّةَ مُحَمَّدٍ",
        transliteration: "Allahumma aslih ummata Muhammad, Allahumma farrij an ummati Muhammad, Allahumma irham ummata Muhammad",
        translation: "O Allah reform the Ummah of Muhammad, O Allah relieve the Ummah of Muhammad, O Allah have mercy on the Ummah of Muhammad"
      },
      {
        title: "Bonus — dua when entering your home after Hajj",
        arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَ الْمَوْلِجِ وَخَيْرَ الْمَخْرَجِ بِسْمِ اللَّهِ وَلَجْنَا وَبِسْمِ اللَّهِ خَرَجْنَا وَعَلَى اللَّهِ رَبِّنَا تَوَكَّلْنَا",
        transliteration: "Allahumma inni as'aluka khayral mawliji wa khayral makhraji bismillahi walajna wa bismillahi kharajna wa alallahi rabbina tawakkalna",
        translation: "O Allah I ask You for the best entering and the best exiting. In the name of Allah we enter and in the name of Allah we exit and upon Allah our Lord we rely"
      },
      {
        title: "Bonus — dua for parents after returning from Hajj",
        arabic: "رَبِّ اغْفِرْ لِي وَلِوَالِدَيَّ وَارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا وَأَدْخِلْهُمَا الْجَنَّةَ مَعَ الْأَبْرَارِ",
        transliteration: "Rabbighfir li wa liwaalidayya warhamhuma kama rabbayani saghiran wa adkhilhuma al-jannata ma'al abrar",
        translation: "My Lord forgive me and my parents, have mercy on them as they raised me when I was young and admit them to Paradise with the righteous"
      },
      {
        title: "Bonus — the dua the Prophet ﷺ made when returning from any journey",
        arabic: "آيِبُونَ تَائِبُونَ عَابِدُونَ لِرَبِّنَا حَامِدُونَ",
        transliteration: "Ayibuna ta'ibuna abiduna li rabbina hamidun",
        translation: "We are returning, repenting, worshipping and praising our Lord — the Prophet ﷺ said this repeatedly when returning from Hajj"
      }
    ],
    tips: [
      "The sign of a Mabrur Hajj is that you return better than you left — guard this transformation fiercely",
      "The first test of your Hajj comes the moment you land at the airport — be patient, be kind, be the person Hajj made you",
      "Shaytan works hardest on those who have just completed great acts of worship — be vigilant",
      "Do not go back to sins — the Prophet ﷺ compared returning to sin after sincere repentance to a dog returning to its vomit",
      "Maintain your Fajr — if Hajj gave you anything let it be the Fajr prayer",
      "Maintain your connection with the Quran — even 5 minutes a day is better than nothing",
      "Give sadaqah when you return — share the barakah of Hajj with those who could not go",
      "The Prophet ﷺ said follow up Hajj with Umrah and follow up Umrah with Hajj — start planning your return",
      "Tell your story to inspire others — there are Muslims who have never considered Hajj because nobody told them how life-changing it is",
      "Make dua for everyone who supported your journey — your family, your employer, your Hajj group. Gratitude to people is gratitude to Allah",
      "A person who returns from Hajj is like a newborn — pure, forgiven and given a new beginning. What you do with that beginning is your choice"
    ],
    femaleNote: "Women who completed Hajj have achieved one of the greatest acts of worship available to any human being. The Prophet ﷺ told Aisha رضي الله عنها that Hajj is the jihad of women — and the reward of jihad in the way of Allah is Jannah. A woman who returns from Hajj carries the same purity, the same forgiveness and the same new beginning as any man. Guard it. Women should share their Hajj experience with other women in their community — your story may be the reason another woman makes the journey. Be the inspiration.",
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