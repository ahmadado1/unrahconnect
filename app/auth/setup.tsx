import { AppIcon, ICON_GOLD } from "@/components/AppIcon"
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
}))

const COUNTRY_OPTIONS = COUNTRY_DIALS.map(c => ({
  id: c.name,
  label: c.name,
  prefix: c.code,
}))


export default function SetupScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { theme } = useTheme()
  const { t } = useTranslation()

  const [step, setStep] = useState<1 | 2>(1)
  const [userType, setUserType] = useState<"pilgrim" | "agent" | null>(null)

  const [fullName, setFullName] = useState("")
  const [nameFromProvider, setNameFromProvider] = useState(false)
  const [phone, setPhone] = useState("")
  const [nationality, setNationality] = useState("")
  const [gender, setGender] = useState<"male" | "female" | "">("")

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
      if (!user) return

      const saved = user.user_metadata?.language
      if (saved && typeof saved === "string") {
        setSelectedLang(saved)
        i18n.changeLanguage(saved)
      }

      // Prefill Apple/Google name if already stored — don't force re-entry.
      const savedName = (user.user_metadata?.full_name || "").trim()
      if (savedName) {
        setFullName(savedName)
        setNameFromProvider(true)
      }

      const savedPhone = (user.user_metadata?.phone || "").trim()
      if (savedPhone) setPhone(savedPhone)
      const savedNationality = (user.user_metadata?.nationality || "").trim()
      if (savedNationality) setNationality(savedNationality)
      const savedGender = user.user_metadata?.gender
      if (savedGender === "male" || savedGender === "female") setGender(savedGender)
    })
  }, [])

  useEffect(() => {
    getPendingReferral().then(code => {
      if (code) setReferralCode(normalizeReferralCode(code))
    })
  }, [])

  const finishSetup = async () => {
    setError("")
    setReferralError("")

    // Only validate agent code when the user typed one — never block empty form.
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

      const existingName = (user.user_metadata?.full_name || "").trim()
      const resolvedName = fullName.trim() || existingName

      const code = userType === "pilgrim" ? normalizeReferralCode(referralCode) : ""

      await supabase.auth.updateUser({
        data: {
          ...(resolvedName ? { full_name: resolvedName } : {}),
          ...(phone.trim() ? { phone: phone.trim() } : {}),
          ...(nationality.trim() ? { nationality: nationality.trim() } : {}),
          ...(gender ? { gender } : {}),
          ...(code ? { agent_code: code } : {}),
          language: selectedLang,
          user_type: userType,
          ...(userType === "agent" && agencyName.trim()
            ? { agency_name: agencyName.trim() }
            : {}),
          ...(userType === "agent" && agencyCountry.trim()
            ? { agency_country: agencyCountry.trim() }
            : {}),
          profile_complete: true,
        },
      })

      if (userType === "agent") {
        if (agencyName.trim()) {
          const { data: { user: freshUser } } = await supabase.auth.getUser()
          const { error: insertError } = await supabase.from("agents").insert({
            user_id: freshUser?.id,
            agency_name: agencyName.trim(),
            owner_name: resolvedName || "Agent",
            phone: phone.trim() || null,
            email: freshUser?.email,
            nationality: nationality.trim() || null,
            country: agencyCountry.trim() || null,
            plan: "trial",
          })
          if (insertError) {
            console.log("Agent insert error:", insertError.message)
          }
        }
        router.replace("/auth/plans" as any)
      } else {
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
          {step === 1 ? t("tellUsWhoYouAre") : t("setupOptionalHint")}
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
              <AppIcon name="kaaba" size={36} color={ICON_GOLD} />
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
              <AppIcon name="business" size={36} color={ICON_GOLD} />
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
            {/* Hide Full Name when Apple/Google already provided it */}
            {!nameFromProvider ? (
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
              </>
            ) : null}

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
                    { id: "male", label: t("male"), icon: "male" },
                    { id: "female", label: t("female"), icon: "female" },
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
              onPress={finishSetup}
              disabled={loading}
            >
              <Text style={styles.btnText}>
                {loading
                  ? t("saving")
                  : userType === "agent"
                    ? t("seeplans")
                    : t("startJourney")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipBtn}
              onPress={finishSetup}
              disabled={loading}
            >
              <Text style={styles.skipText}>{t("skipForNow")}</Text>
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
  skipBtn: { alignItems: "center", marginTop: 14 },
  skipText: { color: "#C9A84C", fontSize: 14, fontWeight: "500" },
  backBtn: { alignItems: "center", marginTop: 16 },
  backText: { color: "#C9A84C", fontSize: 14 },
})
