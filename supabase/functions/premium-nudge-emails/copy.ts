// Text of the Premium emails in every app language.
// intro / subjects: email 1 (30 min after sign up), email 2 (3 days), email 3 (a week), email 4+ (later).
export type Lang = "en" | "ar" | "fr" | "ur" | "tr" | "bn"

type Copy = {
  subjects: string[]
  hello: string
  pilgrim: string
  intro: string[]
  featuresTitle: string
  features: string[]
  howTitle: string
  howApp: string
  howWeb: string
  cta: string
  free: string
  sign: string
  unsubscribe: string
}

export const COPY: Record<Lang, Copy> = {
  en: {
    subjects: [
      "Make the most of UmrahConnect with Premium",
      "Hear the full Adhan in a new voice",
      "Never miss Al-Kahf on Friday",
      "Your UmrahConnect Premium is waiting",
    ],
    hello: "Assalamu Alaikum, {name}",
    pilgrim: "Pilgrim",
    intro: [
      "Welcome to UmrahConnect. Everything you need for Umrah, Hajj and your daily Quran is free. If you would like a little more, UmrahConnect Premium adds a few special features and helps us keep the app growing.",
      "With Premium you can choose three more beautiful Adhan voices, including Sheikh Ali Ahmed Mulla, the voice many know from Masjid al-Haram, and use every Mushaf font.",
      "Premium gently guides you each week: it reminds you to read Al-Kahf on Friday, Al-Mulk before sleep, and to send salawat on the Prophet ﷺ, continuing from where you stopped.",
      "Just a short reminder: UmrahConnect Premium is here whenever you are ready. Thank you for being part of UmrahConnect.",
    ],
    featuresTitle: "WHAT PREMIUM ADDS",
    features: [
      "3 more Adhan voices: Qassas, Ali Mulla and Hadrawi",
      "All Mushaf fonts",
      "Trip Planner and offline map of Makkah and Madinah",
      "Guided reminders for Al-Kahf, Al-Mulk and Friday Salawat",
      "Unlimited AI Guide",
    ],
    howTitle: "How to get Premium",
    howApp: "In the app: Me → UmrahConnect Premium.",
    howWeb: "Or on our website, from $1.99 a month: pay easily with OPay, MyNita or PayPal. Use the same account and Premium unlocks in the app.",
    cta: "Get Premium on the website",
    free: "Quran audio, the Umrah and Hajj guides, prayer times and duas stay free for everyone.",
    sign: "Barak Allahu feekum, The UmrahConnect Team",
    unsubscribe: "Don't want these emails? Unsubscribe",
  },
  ar: {
    subjects: [
      "استفد أكثر من UmrahConnect مع Premium",
      "استمع إلى الأذان كاملًا بصوت جديد",
      "لا تفوّت سورة الكهف يوم الجمعة",
      "اشتراك UmrahConnect Premium بانتظارك",
    ],
    hello: "السلام عليكم، {name}",
    pilgrim: "أيها الحاج",
    intro: [
      "مرحبًا بك في UmrahConnect. كل ما تحتاجه للعمرة والحج وقراءة القرآن اليومية مجاني. وإذا أردت المزيد، فإن UmrahConnect Premium يضيف ميزات خاصة ويساعدنا على تطوير التطبيق.",
      "مع Premium يمكنك اختيار ثلاثة أصوات أذان جميلة إضافية، منها الشيخ علي أحمد ملا، الصوت المعروف من المسجد الحرام، واستخدام جميع خطوط المصحف.",
      "يرشدك Premium كل أسبوع بلطف: يذكّرك بقراءة سورة الكهف يوم الجمعة، وسورة الملك قبل النوم، والصلاة على النبي ﷺ، ويكمل معك من حيث توقفت.",
      "تذكير قصير: اشتراك UmrahConnect Premium متاح متى ما كنت مستعدًا. شكرًا لكونك جزءًا من UmrahConnect.",
    ],
    featuresTitle: "ما يضيفه Premium",
    features: [
      "3 أصوات أذان إضافية: القصاص وعلي ملا والحضراوي",
      "جميع خطوط المصحف",
      "مخطط الرحلة وخريطة مكة والمدينة بدون إنترنت",
      "تذكيرات موجّهة لسورة الكهف وسورة الملك والصلاة على النبي يوم الجمعة",
      "المرشد الذكي بلا حدود",
    ],
    howTitle: "كيف تحصل على Premium",
    howApp: "في التطبيق: حسابي ← UmrahConnect بريميوم.",
    howWeb: "أو من موقعنا، ابتداءً من 1.99 دولار شهريًا: ادفع بسهولة عبر OPay أو MyNita أو PayPal. استخدم الحساب نفسه وسيُفعَّل Premium في التطبيق.",
    cta: "احصل على Premium من الموقع",
    free: "تلاوات القرآن ودليل العمرة والحج ومواقيت الصلاة والأدعية تبقى مجانية للجميع.",
    sign: "بارك الله فيكم، فريق UmrahConnect",
    unsubscribe: "لا تريد هذه الرسائل؟ إلغاء الاشتراك",
  },
  fr: {
    subjects: [
      "Profitez pleinement d'UmrahConnect avec Premium",
      "Écoutez l'Adhan complet avec une nouvelle voix",
      "Ne manquez plus Al-Kahf le vendredi",
      "UmrahConnect Premium vous attend",
    ],
    hello: "Assalamu Alaikum, {name}",
    pilgrim: "Pèlerin",
    intro: [
      "Bienvenue sur UmrahConnect. Tout ce qu'il faut pour la Omra, le Hajj et votre lecture quotidienne du Coran est gratuit. Si vous voulez un peu plus, UmrahConnect Premium ajoute quelques fonctions spéciales et nous aide à faire grandir l'application.",
      "Avec Premium, vous pouvez choisir trois belles voix d'Adhan en plus, dont Cheikh Ali Ahmed Mulla, la voix bien connue de Masjid al-Haram, et utiliser toutes les polices du Mushaf.",
      "Premium vous guide en douceur chaque semaine : il vous rappelle de lire Al-Kahf le vendredi, Al-Mulk avant de dormir et de prier sur le Prophète ﷺ, en reprenant là où vous vous êtes arrêté.",
      "Un petit rappel : UmrahConnect Premium est là dès que vous êtes prêt. Merci de faire partie d'UmrahConnect.",
    ],
    featuresTitle: "CE QUE PREMIUM AJOUTE",
    features: [
      "3 voix d'Adhan en plus : Qassas, Ali Mulla et Hadrawi",
      "Toutes les polices du Mushaf",
      "Planificateur de voyage et carte hors ligne de La Mecque et Médine",
      "Rappels guidés pour Al-Kahf, Al-Mulk et la Salawat du vendredi",
      "Guide IA illimité",
    ],
    howTitle: "Comment obtenir Premium",
    howApp: "Dans l'application : Moi → UmrahConnect Premium.",
    howWeb: "Ou sur notre site, à partir de 1,99 $ par mois : payez facilement avec OPay, MyNita ou PayPal. Utilisez le même compte et Premium s'active dans l'application.",
    cta: "Obtenir Premium sur le site",
    free: "L'audio du Coran, les guides de la Omra et du Hajj, les horaires de prière et les invocations restent gratuits pour tous.",
    sign: "Barak Allahu feekum, l'équipe UmrahConnect",
    unsubscribe: "Vous ne voulez plus ces e-mails ? Se désabonner",
  },
  ur: {
    subjects: [
      "Premium کے ساتھ UmrahConnect کا پورا فائدہ اٹھائیں",
      "نئی آواز میں مکمل اذان سنیں",
      "جمعہ کو سورۃ الکہف نہ بھولیں",
      "آپ کا UmrahConnect Premium انتظار میں ہے",
    ],
    hello: "السلام علیکم، {name}",
    pilgrim: "زائر",
    intro: [
      "UmrahConnect میں خوش آمدید۔ عمرہ، حج اور روزانہ قرآن کے لیے سب کچھ مفت ہے۔ اگر آپ مزید چاہیں تو UmrahConnect Premium چند خاص سہولتیں دیتا ہے اور ایپ کو آگے بڑھانے میں ہماری مدد کرتا ہے۔",
      "Premium کے ساتھ آپ اذان کی تین مزید خوبصورت آوازیں چن سکتے ہیں، جن میں شیخ علی احمد ملا شامل ہیں، جن کی آواز مسجد الحرام سے مشہور ہے، اور مصحف کے تمام فونٹس استعمال کر سکتے ہیں۔",
      "Premium ہر ہفتے نرمی سے رہنمائی کرتا ہے: جمعہ کو سورۃ الکہف، سونے سے پہلے سورۃ الملک اور نبی ﷺ پر درود کی یاد دہانی، وہیں سے جہاں آپ رکے تھے۔",
      "ایک مختصر یاد دہانی: جب آپ تیار ہوں، UmrahConnect Premium موجود ہے۔ UmrahConnect کا حصہ بننے کا شکریہ۔",
    ],
    featuresTitle: "Premium میں کیا ملتا ہے",
    features: [
      "اذان کی 3 مزید آوازیں: قصاص، علی ملا اور حضراوی",
      "مصحف کے تمام فونٹس",
      "ٹرپ پلانر اور مکہ و مدینہ کا آف لائن نقشہ",
      "سورۃ الکہف، سورۃ الملک اور جمعہ کے درود کی رہنمائی والی یاد دہانیاں",
      "لامحدود AI گائیڈ",
    ],
    howTitle: "Premium کیسے لیں",
    howApp: "ایپ میں: میں ← UmrahConnect پریمیم۔",
    howWeb: "یا ہماری ویب سائٹ پر، 1.99 ڈالر ماہانہ سے: OPay، MyNita یا PayPal سے آسانی سے ادائیگی کریں۔ اسی اکاؤنٹ سے Premium ایپ میں کھل جائے گا۔",
    cta: "ویب سائٹ پر Premium لیں",
    free: "قرآن آڈیو، عمرہ و حج گائیڈ، نماز کے اوقات اور دعائیں سب کے لیے مفت رہیں گی۔",
    sign: "بارک اللہ فیکم، UmrahConnect ٹیم",
    unsubscribe: "یہ ای میلز نہیں چاہتے؟ ان سبسکرائب کریں",
  },
  tr: {
    subjects: [
      "Premium ile UmrahConnect'ten en iyi şekilde yararlanın",
      "Ezanın tamamını yeni bir sesle dinleyin",
      "Cuma günü Kehf suresini kaçırmayın",
      "UmrahConnect Premium sizi bekliyor",
    ],
    hello: "Esselamu aleykum, {name}",
    pilgrim: "Hacı adayı",
    intro: [
      "UmrahConnect'e hoş geldiniz. Umre, hac ve günlük Kur'an okumanız için gereken her şey ücretsiz. Biraz daha fazlasını isterseniz UmrahConnect Premium birkaç özel özellik ekler ve uygulamayı büyütmemize yardım eder.",
      "Premium ile üç güzel ezan sesi daha seçebilirsiniz; aralarında Mescid-i Haram'dan tanınan Şeyh Ali Ahmed Mulla da var. Tüm Mushaf yazı tiplerini de kullanabilirsiniz.",
      "Premium her hafta size nazikçe rehberlik eder: Cuma günü Kehf suresini, uyumadan önce Mülk suresini ve Peygamber Efendimiz ﷺ'e salavatı, kaldığınız yerden hatırlatır.",
      "Kısa bir hatırlatma: UmrahConnect Premium hazır olduğunuzda burada. UmrahConnect ailesinin bir parçası olduğunuz için teşekkürler.",
    ],
    featuresTitle: "PREMIUM NELER EKLER",
    features: [
      "3 ezan sesi daha: Qassas, Ali Mulla ve Hadrawi",
      "Tüm Mushaf yazı tipleri",
      "Yolculuk planlayıcı ve Mekke ile Medine'nin çevrimdışı haritası",
      "Kehf, Mülk ve Cuma salavatı için rehberli hatırlatmalar",
      "Sınırsız yapay zekâ rehberi",
    ],
    howTitle: "Premium nasıl alınır",
    howApp: "Uygulamada: Ben → UmrahConnect Premium.",
    howWeb: "Ya da web sitemizden, ayda 1,99 $'dan başlayan fiyatlarla: OPay, MyNita veya PayPal ile kolayca ödeyin. Aynı hesabı kullanın, Premium uygulamada açılır.",
    cta: "Premium'u web sitesinden alın",
    free: "Kur'an sesleri, umre ve hac rehberleri, namaz vakitleri ve dualar herkes için ücretsiz kalır.",
    sign: "Barakallahu fikum, UmrahConnect Ekibi",
    unsubscribe: "Bu e-postaları istemiyor musunuz? Abonelikten çık",
  },
  bn: {
    subjects: [
      "Premium দিয়ে UmrahConnect-এর পুরো সুবিধা নিন",
      "নতুন কণ্ঠে পূর্ণ আজান শুনুন",
      "শুক্রবারে সূরা কাহফ ভুলবেন না",
      "আপনার UmrahConnect Premium অপেক্ষা করছে",
    ],
    hello: "আসসালামু আলাইকুম, {name}",
    pilgrim: "হাজী",
    intro: [
      "UmrahConnect-এ স্বাগতম। উমরাহ, হজ ও প্রতিদিনের কুরআনের জন্য যা দরকার সবই বিনামূল্যে। আরও কিছু চাইলে UmrahConnect Premium কয়েকটি বিশেষ সুবিধা যোগ করে এবং অ্যাপটিকে এগিয়ে নিতে আমাদের সাহায্য করে।",
      "Premium-এ আপনি আরও তিনটি সুন্দর আজানের কণ্ঠ বেছে নিতে পারবেন, যার মধ্যে আছেন মসজিদুল হারামের পরিচিত কণ্ঠ শায়খ আলী আহমদ মুল্লা, এবং মুসহাফের সব ফন্ট ব্যবহার করতে পারবেন।",
      "Premium প্রতি সপ্তাহে আপনাকে আলতোভাবে মনে করিয়ে দেয়: শুক্রবারে সূরা কাহফ, ঘুমানোর আগে সূরা মুলক এবং নবী ﷺ-এর উপর দরুদ, যেখানে থেমেছিলেন সেখান থেকে।",
      "ছোট্ট একটি মনে করিয়ে দেওয়া: আপনি প্রস্তুত হলেই UmrahConnect Premium আছে। UmrahConnect-এর সাথে থাকার জন্য ধন্যবাদ।",
    ],
    featuresTitle: "PREMIUM-এ যা পাবেন",
    features: [
      "আরও ৩টি আজানের কণ্ঠ: কাসাস, আলী মুল্লা ও হাদরাভি",
      "মুসহাফের সব ফন্ট",
      "ট্রিপ প্ল্যানার এবং মক্কা ও মদীনার অফলাইন ম্যাপ",
      "সূরা কাহফ, সূরা মুলক ও শুক্রবারের দরুদের জন্য গাইডেড রিমাইন্ডার",
      "সীমাহীন এআই গাইড",
    ],
    howTitle: "কীভাবে Premium নেবেন",
    howApp: "অ্যাপে: আমি → UmrahConnect প্রিমিয়াম।",
    howWeb: "অথবা আমাদের ওয়েবসাইটে, মাসে $1.99 থেকে: OPay, MyNita বা PayPal দিয়ে সহজে পেমেন্ট করুন। একই অ্যাকাউন্ট ব্যবহার করলে অ্যাপে Premium চালু হয়ে যাবে।",
    cta: "ওয়েবসাইটে Premium নিন",
    free: "কুরআন অডিও, উমরাহ ও হজ গাইড, নামাজের সময় এবং দোয়া সবার জন্য বিনামূল্যে থাকবে।",
    sign: "বারাকাল্লাহু ফিকুম, UmrahConnect টিম",
    unsubscribe: "এই ইমেইল চান না? আনসাবস্ক্রাইব করুন",
  },
}
