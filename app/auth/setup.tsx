import { useTheme } from "@/context/themeContext"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { supabase } from "../../lib/supabase"


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

  const handleContinue = async () => {
    if (!fullName || !phone || !nationality) {
      setError(t("pleaseFillAll"))
      return
    }
    if (userType === "agent" && !agencyName) {
      setError(t("pleaseEnterAgencyName"))
      return
    }

    setLoading(true)
    setError("")

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          phone,
          nationality,
          gender,
          user_type: userType,
          agency_name: userType === "agent" ? agencyName : null,
          agency_country: userType === "agent" ? agencyCountry : null,
          profile_complete: true,
        }
      })

      if (userType === "agent") {
        const { data: { user } } = await supabase.auth.getUser()
        await supabase.from("agents").insert({
          user_id: user?.id,
          agency_name: agencyName,
          owner_name: fullName,
          phone,
          email: user?.email,
          nationality,
          country: agencyCountry,
          plan: "trial",
        })
        router.replace("/auth/plans" as any)
      } else {
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
              onPress={() => userType && setStep(2)}
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

            <Text style={[styles.label, { color: theme.text }]}>{t("phoneNumber")}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
              placeholder={t("enterPhone")}
              placeholderTextColor={theme.textSecondary}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            <Text style={[styles.label, { color: theme.text }]}>{t("nationality")}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
              placeholder={t("nationalityPlaceholder")}
              placeholderTextColor={theme.textSecondary}
              value={nationality}
              onChangeText={setNationality}
              autoCapitalize="words"
            />

            {userType === "pilgrim" && (
              <>
                <Text style={[styles.label, { color: theme.text }]}>{t("iAm")}</Text>
                <View style={styles.genderRow}>
                  <TouchableOpacity
                    style={[styles.genderBtn, { borderColor: theme.border, backgroundColor: theme.card }, gender === "male" && styles.genderActive]}
                    onPress={() => setGender("male")}
                  >
                    <Text style={[styles.genderText, gender === "male" && { color: "#fff" }]}>{t("male")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.genderBtn, { borderColor: theme.border, backgroundColor: theme.card }, gender === "female" && styles.genderActive]}
                    onPress={() => setGender("female")}
                  >
                    <Text style={[styles.genderText, gender === "female" && { color: "#fff" }]}>{t("female")}</Text>
                  </TouchableOpacity>
                </View>
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
                <Text style={[styles.label, { color: theme.text }]}>{t("agencyCountry")}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
                  placeholder={t("countryPlaceholder")}
                  placeholderTextColor={theme.textSecondary}
                  value={agencyCountry}
                  onChangeText={setAgencyCountry}
                  autoCapitalize="words"
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
  genderRow: { flexDirection: "row", gap: 12, marginBottom: 4 },
  genderBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, alignItems: "center" },
  genderActive: { backgroundColor: "#1E3A5F", borderColor: "#1E3A5F" },
  genderText: { fontSize: 14, fontWeight: "500", color: "#1E3A5F" },
  error: { color: "#E24B4A", fontSize: 13, marginTop: 8, textAlign: "center" },
  btn: { backgroundColor: "#C9A84C", borderRadius: 25, padding: 16, alignItems: "center", marginTop: 24 },
  btnText: { color: "#1E3A5F", fontSize: 16, fontWeight: "bold" },
  backBtn: { alignItems: "center", marginTop: 16 },
  backText: { color: "#C9A84C", fontSize: 14 },
})
