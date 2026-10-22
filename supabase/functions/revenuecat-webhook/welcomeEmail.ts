// "Welcome to Premium" email, sent once when someone first subscribes in the app
// (App Store / Google Play). Written in the user's app language.
import { BRAND, FROM_EMAIL, SUPPORT_EMAIL, escapeHtml, wrapEmail } from "../_shared/emailLayout.ts"

type Lang = "en" | "ar" | "fr" | "ur" | "tr" | "bn"

type Copy = {
  subject: string
  hello: (name: string) => string
  intro: string
  listTitle: string
  features: string[]
  manage: string
  thanks: string
}

const COPY: Record<Lang, Copy> = {
  en: {
    subject: "Welcome to UmrahConnect Premium",
    hello: n => `Assalamu Alaikum ${n},`,
    intro: "Thank you for subscribing. Your Premium is active now on this account.",
    listTitle: "What you can use now in the app:",
    features: [
      "Quran goals: plan a khatm or a juz and track your pages",
      "Makkah companion: Tawaf and Sa'i counter, your own dua list",
      "Miqat alert before you cross the Miqat",
      "Prayer widget on your home screen and lock screen",
      "3 more Adhan voices, all Mushaf fonts, Trip Planner and offline map",
      "Unlimited AI Guide questions",
    ],
    manage:
      "Your subscription renews automatically. You can manage or cancel it at any time in your phone's settings (App Store or Google Play subscriptions).",
    thanks: "May Allah accept your worship and make your journey easy.",
  },
  ar: {
    subject: "مرحبًا بك في UmrahConnect Premium",
    hello: n => `السلام عليكم ${n}،`,
    intro: "شكرًا لاشتراكك. اشتراك Premium مفعّل الآن على هذا الحساب.",
    listTitle: "ما يمكنك استخدامه الآن في التطبيق:",
    features: [
      "أهداف القرآن: خطّط لختمة أو جزء وتابع صفحاتك",
      "رفيق مكة: عدّاد الطواف والسعي وقائمة أدعيتك",
      "تنبيه الميقات قبل أن تتجاوز الميقات",
      "أداة الصلاة على الشاشة الرئيسية وشاشة القفل",
      "3 أصوات أذان إضافية وكل خطوط المصحف ومخطط الرحلة والخريطة دون إنترنت",
      "أسئلة غير محدودة للمرشد الذكي",
    ],
    manage: "يتجدد اشتراكك تلقائيًا. يمكنك إدارته أو إلغاؤه في أي وقت من إعدادات هاتفك (اشتراكات App Store أو Google Play).",
    thanks: "تقبّل الله عبادتك ويسّر رحلتك.",
  },
  fr: {
    subject: "Bienvenue dans UmrahConnect Premium",
    hello: n => `Assalamu Alaikum ${n},`,
    intro: "Merci pour votre abonnement. Votre Premium est maintenant actif sur ce compte.",
    listTitle: "Ce que vous pouvez utiliser dès maintenant :",
    features: [
      "Objectifs Coran : planifiez une khatma ou un juz et suivez vos pages",
      "Compagnon de La Mecque : compteur de Tawaf et de Sa'i, votre liste de duas",
      "Alerte Miqat avant de franchir le Miqat",
      "Widget de prière sur l'écran d'accueil et l'écran verrouillé",
      "3 voix d'Adhan en plus, toutes les polices du Mushaf, planificateur et carte hors ligne",
      "Questions illimitées au guide IA",
    ],
    manage:
      "Votre abonnement se renouvelle automatiquement. Vous pouvez le gérer ou l'annuler à tout moment dans les réglages de votre téléphone (abonnements App Store ou Google Play).",
    thanks: "Qu'Allah accepte vos adorations et facilite votre voyage.",
  },
  ur: {
    subject: "UmrahConnect Premium میں خوش آمدید",
    hello: n => `السلام علیکم ${n}،`,
    intro: "سبسکرائب کرنے کا شکریہ۔ آپ کا Premium اب اس اکاؤنٹ پر فعال ہے۔",
    listTitle: "اب آپ ایپ میں یہ استعمال کر سکتے ہیں:",
    features: [
      "قرآن کے اہداف: ختم یا پارے کا منصوبہ اور صفحات کا حساب",
      "مکہ کا ساتھی: طواف اور سعی کا شمار، آپ کی دعاؤں کی فہرست",
      "میقات سے پہلے یاد دہانی",
      "ہوم اسکرین اور لاک اسکرین پر نماز کا ویجٹ",
      "مزید 3 اذان کی آوازیں، تمام مصحف فونٹس، ٹرپ پلانر اور آف لائن نقشہ",
      "AI گائیڈ سے لامحدود سوالات",
    ],
    manage: "آپ کی سبسکرپشن خود بخود تجدید ہوتی ہے۔ آپ اسے کسی بھی وقت اپنے فون کی سیٹنگز (App Store یا Google Play سبسکرپشنز) میں منظم یا منسوخ کر سکتے ہیں۔",
    thanks: "اللہ آپ کی عبادت قبول فرمائے اور سفر آسان کرے۔",
  },
  tr: {
    subject: "UmrahConnect Premium'a hoş geldiniz",
    hello: n => `Esselamu aleyküm ${n},`,
    intro: "Abone olduğunuz için teşekkürler. Premium bu hesapta artık etkin.",
    listTitle: "Uygulamada şimdi kullanabilecekleriniz:",
    features: [
      "Kuran hedefleri: hatim veya cüz planlayın, sayfalarınızı takip edin",
      "Mekke rehberi: Tavaf ve Sa'y sayacı, kendi dua listeniz",
      "Mikat'ı geçmeden önce Mikat uyarısı",
      "Ana ekran ve kilit ekranında namaz widget'ı",
      "3 ek ezan sesi, tüm Mushaf yazı tipleri, gezi planlayıcı ve çevrimdışı harita",
      "Sınırsız yapay zeka rehberi soruları",
    ],
    manage: "Aboneliğiniz otomatik olarak yenilenir. Telefonunuzun ayarlarından (App Store veya Google Play abonelikleri) istediğiniz zaman yönetebilir veya iptal edebilirsiniz.",
    thanks: "Allah ibadetlerinizi kabul etsin ve yolculuğunuzu kolaylaştırsın.",
  },
  bn: {
    subject: "UmrahConnect Premium-এ স্বাগতম",
    hello: n => `আসসালামু আলাইকুম ${n},`,
    intro: "সাবস্ক্রাইব করার জন্য ধন্যবাদ। এই অ্যাকাউন্টে আপনার Premium এখন চালু।",
    listTitle: "অ্যাপে এখন যা ব্যবহার করতে পারবেন:",
    features: [
      "কুরআনের লক্ষ্য: খতম বা পারার পরিকল্পনা ও পৃষ্ঠার হিসাব",
      "মক্কার সঙ্গী: তাওয়াফ ও সাঈর গণনা, আপনার দোয়ার তালিকা",
      "মীকাত পার হওয়ার আগে মীকাত সতর্কতা",
      "হোম স্ক্রিন ও লক স্ক্রিনে নামাজের উইজেট",
      "আরও ৩টি আযানের কণ্ঠ, সব মুসহাফ ফন্ট, ট্রিপ প্ল্যানার ও অফলাইন মানচিত্র",
      "AI গাইডে সীমাহীন প্রশ্ন",
    ],
    manage: "আপনার সাবস্ক্রিপশন নিজে থেকেই নবায়ন হয়। ফোনের সেটিংসে (App Store বা Google Play সাবস্ক্রিপশন) যেকোনো সময় এটি পরিচালনা বা বাতিল করতে পারেন।",
    thanks: "আল্লাহ আপনার ইবাদত কবুল করুন এবং যাত্রা সহজ করুন।",
  },
}

function pickLang(value: unknown): Lang {
  const v = String(value ?? "").slice(0, 2).toLowerCase()
  return (["en", "ar", "fr", "ur", "tr", "bn"] as Lang[]).includes(v as Lang) ? (v as Lang) : "en"
}

/** Sends the welcome email. Returns true if Resend accepted it. */
export async function sendPremiumWelcome(to: string, name: string, language: unknown): Promise<boolean> {
  const key = Deno.env.get("RESEND_API_KEY")
  if (!key || !to) return false
  const lang = pickLang(language)
  const c = COPY[lang]
  const rtl = lang === "ar" || lang === "ur"
  const dir = rtl ? ' dir="rtl"' : ""
  const p = `font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:${BRAND.text};margin:0 0 14px;`
  const body = `<div${dir}>
  <p style="${p}">${escapeHtml(c.hello(name || "Pilgrim"))}</p>
  <p style="${p}">${escapeHtml(c.intro)}</p>
  <p style="${p}font-weight:700;color:${BRAND.navy};">${escapeHtml(c.listTitle)}</p>
  <ul style="${p}padding-${rtl ? "right" : "left"}:20px;">
    ${c.features.map(f => `<li style="margin-bottom:6px;">${escapeHtml(f)}</li>`).join("")}
  </ul>
  <p style="${p}color:${BRAND.muted};font-size:13px;">${escapeHtml(c.manage)}</p>
  <p style="${p}">${escapeHtml(c.thanks)}</p>
  <p style="${p}color:${BRAND.muted};font-size:13px;">${escapeHtml(SUPPORT_EMAIL)}</p>
</div>`
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject: c.subject,
        html: wrapEmail(body, { title: c.subject, preheader: c.intro }),
      }),
    })
    if (!res.ok) console.error("welcome email failed", res.status, (await res.text()).slice(0, 200))
    return res.ok
  } catch (e) {
    console.error("welcome email error", String(e))
    return false
  }
}
