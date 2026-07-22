import { useTheme } from "@/context/themeContext"
import i18n from "@/i18n"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import LanguageDropdown from "../components/LanguageDropdown"
import PhoneInput from "../components/PhoneInput"
import SelectDropdown from "../components/SelectDropdown"
import { COUNTRY_DIALS, NATIONALITIES } from "@/lib/countries"
import { getPendingReferral, isValidReferralCode, linkPilgrimToAgent, normalizeReferralCode } from "@/lib/referral"
import { supabase } from "../../lib/supabase"

const NATIONALITY_OPTIONS = NATIONALITIES.map(n => ({
  id: n.id,
  label: n.label,
  prefix: n.flag,
}))

const COUNTRY_OPTIONS = COUNTRY_DIALS.map(c => ({
  id: c.name,
  label: c.name,
  prefix: c.flag,
}))


export default function SetupScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { theme } = useTheme()
  const { t } = useTranslation()

  const [step, setStep] = useState<1 | 2>(1)
  const [userType, setUserType] = useState<"pilgrim" | "agent" | null>(null)

  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [nationality, setNationality] = useState("")
  const [gender, setGender] = useState<"male" | "female">("male")

  const [agencyName, setAgencyName] = useState("")
  const [agencyCountry, setAgencyCountry] = useState("")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [referralCode, setReferralCode] = useState("")
  const [referralError, setReferralError] = useState("")
  const [selectedLang, setSelectedLang] = useState(i18n.language || "en")
  const [langOpen, setLangOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      const saved = user?.user_metadata?.language
      if (saved && typeof saved === "string") {
        setSelectedLang(saved)
        i18n.changeLanguage(saved)
      }
    })
  }, [])

  useEffect(() => {
    getPendingReferral().then(code => {
      if (code) setReferralCode(normalizeReferralCode(code))
    })
  }, [])

  const handleContinue = async () => {
    if (!fullName || !phone || !nationality) {
      setError(t("pleaseFillAll"))
      return
    }
    if (userType === "agent" && !agencyName) {
      setError(t("pleaseEnterAgencyName"))
      return
    }

    setError("")
    setReferralError("")

    if (userType === "pilgrim") {
      const code = normalizeReferralCode(referralCode)
      if (code) {
        const valid = await isValidReferralCode(code)
        if (!valid) {
          setReferralError(t("agentCodeInvalid"))
          return
        }
      }
    }

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          phone,
          nationality,
          gender,
          language: selectedLang,
          user_type: userType,
          agency_name: userType === "agent" ? agencyName : null,
          agency_country: userType === "agent" ? agencyCountry : null,
          profile_complete: true,
        }
      })

      if (userType === "agent") {
        const { data: { user: freshUser } } = await supabase.auth.getUser()
        const { error: insertError } = await supabase.from("agents").insert({
          user_id: freshUser?.id,
          agency_name: agencyName,
          owner_name: fullName,
          phone,
          email: freshUser?.email,
          nationality,
          country: agencyCountry,
          plan: "trial",
        })
        if (insertError) {
          console.log("Agent insert error:", insertError.message)
        } else {
          console.log("Agent inserted successfully")
        }
        router.replace("/auth/plans" as any)
      } else {
        const code = normalizeReferralCode(referralCode)
        if (code) {
          await linkPilgrimToAgent(code)
        }
        router.replace("/(tabs)")
      }
    } catch {
      setError(t("somethingWentWrong"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.headerTitle}>
          {step === 1 ? t("welcomeSetup") : userType === "agent" ? t("agencySetup") : t("yourProfile")}
        </Text>
        <Text style={styles.headerSub}>
          {step === 1 ? t("tellUsWhoYouAre") : t("justFewDetails")}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {step === 1 && (
          <>
            <LanguageDropdown
              value={selectedLang}
              onChange={setSelectedLang}
              open={langOpen}
              onToggle={() => setLangOpen(open => !open)}
            />

            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>{t("iAmA")}</Text>

            <TouchableOpacity
              style={[
                styles.typeCard,
                { backgroundColor: theme.card, borderColor: theme.border },
                userType === "pilgrim" && styles.typeCardActive
              ]}
              onPress={() => setUserType("pilgrim")}
            >
              <Text style={styles.typeEmoji}>🕋</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.typeTitle, { color: theme.text }]}>{t("pilgrim")}</Text>
                <Text style={[styles.typeSub, { color: theme.textSecondary }]}>
                  {t("iAmPerforming")}
                </Text>
              </View>
              {userType === "pilgrim" && (
                <Ionicons name="checkmark-circle" size={24} color="#C9A84C" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeCard,
                { backgroundColor: theme.card, borderColor: theme.border },
                userType === "agent" && styles.typeCardActive
              ]}
              onPress={() => setUserType("agent")}
            >
              <Text style={styles.typeEmoji}>🏢</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.typeTitle, { color: theme.text }]}>{t("travelAgent")}</Text>
                <Text style={[styles.typeSub, { color: theme.textSecondary }]}>
                  {t("iManagePilgrims")}
                </Text>
              </View>
              {userType === "agent" && (
                <Ionicons name="checkmark-circle" size={24} color="#C9A84C" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, !userType && { opacity: 0.5 }]}
              onPress={() => {
                setLangOpen(false)
                if (userType) setStep(2)
              }}
              disabled={!userType}
            >
              <Text style={styles.btnText}>{t("continueBtn")}</Text>
            </TouchableOpacity>
          </>
        )}

        {step === 2 && (
          <>
            <Text style={[styles.label, { color: theme.text }]}>{t("fullName")}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
              placeholder={t("enterFullName")}
              placeholderTextColor={theme.textSecondary}
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />

            <PhoneInput
              label={t("phoneNumber")}
              value={phone}
              onChange={setPhone}
              placeholder={t("enterPhone")}
            />

            <SelectDropdown
              label={t("nationality")}
              placeholder={t("nationalityPlaceholder")}
              value={nationality}
              options={NATIONALITY_OPTIONS}
              onChange={setNationality}
              searchPlaceholder={t("search") || "Search"}
            />

            {userType === "pilgrim" && (
              <>
                <SelectDropdown
                  label={t("iAm")}
                  placeholder={t("gender")}
                  value={gender}
                  options={[
                    { id: "male", label: t("male"), prefix: "♂" },
                    { id: "female", label: t("female"), prefix: "♀" },
                  ]}
                  onChange={id => setGender(id as "male" | "female")}
                  variant="menu"
                  searchable={false}
                />

                <Text style={[styles.label, { color: theme.text }]}>{t("agentCodeOptional")}</Text>
                <Text style={[styles.fieldHint, { color: theme.textSecondary }]}>{t("agentCodeHint")}</Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: theme.card, borderColor: theme.border, color: theme.text },
                    referralCode.length > 0 && styles.inputApplied,
                    referralError && styles.inputError,
                  ]}
                  placeholder={t("agentCodePlaceholder")}
                  placeholderTextColor={theme.textSecondary}
                  value={referralCode}
                  onChangeText={text => {
                    setReferralCode(normalizeReferralCode(text))
                    if (referralError) setReferralError("")
                  }}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
                {referralError ? <Text style={styles.fieldError}>{referralError}</Text> : null}
              </>
            )}

            {userType === "agent" && (
              <>
                <Text style={[styles.label, { color: theme.text }]}>{t("agencyName")}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
                  placeholder={t("yourAgencyName")}
                  placeholderTextColor={theme.textSecondary}
                  value={agencyName}
                  onChangeText={setAgencyName}
                  autoCapitalize="words"
                />
                <SelectDropdown
                  label={t("agencyCountry")}
                  placeholder={t("countryPlaceholder")}
                  value={agencyCountry}
                  options={COUNTRY_OPTIONS}
                  onChange={setAgencyCountry}
                  searchPlaceholder={t("search") || "Search"}
                />
              </>
            )}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.btn, loading && { opacity: 0.6 }]}
              onPress={handleContinue}
              disabled={loading}
            >
              <Text style={styles.btnText}>
                {loading ? t("saving") : userType === "agent" ? t("seeplans") : t("startJourney")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
              <Text style={styles.backText}>{t("back")}</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { backgroundColor: "#1E3A5F", padding: 24, paddingBottom: 20 },
  headerTitle: { color: "#fff", fontSize: 26, fontWeight: "bold" },
  headerSub: { color: "#C9A84C", fontSize: 13, marginTop: 4 },
  content: { padding: 20 },
  sectionLabel: { fontSize: 13, fontWeight: "600", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  typeCard: { flexDirection: "row", alignItems: "center", gap: 14, padding: 18, borderRadius: 16, borderWidth: 0.5, marginBottom: 12 },
  typeCardActive: { borderColor: "#C9A84C", borderWidth: 1.5, backgroundColor: "rgba(201,168,76,0.05)" },
  typeEmoji: { fontSize: 36 },
  typeTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 2 },
  typeSub: { fontSize: 12, lineHeight: 18 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 8, marginTop: 16 },
  input: { borderRadius: 12, padding: 14, fontSize: 15, borderWidth: 0.5, marginBottom: 4 },
  inputApplied: { borderColor: "#C9A84C", borderWidth: 1.5, backgroundColor: "rgba(201,168,76,0.05)" },
  inputError: { borderColor: "#E24B4A", borderWidth: 1 },
  fieldError: { color: "#E24B4A", fontSize: 12, marginTop: 4, marginBottom: 4 },
  fieldHint: { fontSize: 12, marginBottom: 8, lineHeight: 18 },
  error: { color: "#E24B4A", fontSize: 13, marginTop: 8, textAlign: "center" },
  btn: { backgroundColor: "#C9A84C", borderRadius: 25, padding: 16, alignItems: "center", marginTop: 24 },
  btnText: { color: "#1E3A5F", fontSize: 16, fontWeight: "bold" },
  backBtn: { alignItems: "center", marginTop: 16 },
  backText: { color: "#C9A84C", fontSize: 14 },
})
