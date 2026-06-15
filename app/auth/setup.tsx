import { useTheme } from "@/context/themeContext"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useState } from "react"
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { supabase } from "../../lib/supabase"


export default function SetupScreen() {
    const router = useRouter()
    const insets = useSafeAreaInsets()
    const { theme } = useTheme()
  
    // Step 1 — who are you
    // Step 2 — fill your details
    const [step, setStep] = useState<1 | 2>(1)
    const [userType, setUserType] = useState<"pilgrim" | "agent" | null>(null)
  
    // Shared fields
    const [fullName, setFullName] = useState("")
    const [phone, setPhone] = useState("")
    const [nationality, setNationality] = useState("")
    const [gender, setGender] = useState<"male" | "female">("male")
  
    // Agent only fields
    const [agencyName, setAgencyName] = useState("")
    const [agencyCountry, setAgencyCountry] = useState("")
  
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const handleContinue = async () => {
        if (!fullName || !phone || !nationality) {
          setError("Please fill in all fields")
          return
        }
        if (userType === "agent" && !agencyName) {
          setError("Please enter your agency name")
          return
        }
    
        setLoading(true)
        setError("")
    
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return
    
          // Save profile to Supabase user metadata
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
          
          // If agent — insert into agents table
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
        } catch (e) {
          setError("Something went wrong. Please try again.")
        } finally {
          setLoading(false)
        }
      }

      
return (
        <View style={[styles.screen, { backgroundColor: theme.background }]}>
          <StatusBar style="light" />
    
          {/* Header */}
          <View style={[styles.header, { paddingTop: insets.top }]}>
            <Text style={styles.headerTitle}>
              {step === 1 ? "Welcome 🌙" : userType === "agent" ? "Agency Setup" : "Your Profile"}
            </Text>
            <Text style={styles.headerSub}>
              {step === 1 ? "Tell us who you are" : "Just a few more details"}
            </Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* ── STEP 1 — Choose type ── */}
        {step === 1 && (
          <>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>I am a...</Text>

            {/* Pilgrim card */}
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
                <Text style={[styles.typeTitle, { color: theme.text }]}>Pilgrim</Text>
                <Text style={[styles.typeSub, { color: theme.textSecondary }]}>
                  I am performing Umrah or Hajj
                </Text>
              </View>
              {userType === "pilgrim" && (
                <Ionicons name="checkmark-circle" size={24} color="#C9A84C" />
              )}
            </TouchableOpacity>

            {/* Agent card */}
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
                    <Text style={[styles.typeTitle, { color: theme.text }]}>Travel Agent</Text>
                    <Text style={[styles.typeSub, { color: theme.textSecondary }]}>
                    I manage pilgrims and bookings
                    </Text>
                </View>
                {userType === "agent" && (
                    <Ionicons name="checkmark-circle" size={24} color="#C9A84C" />
                )}
                </TouchableOpacity>

            {/* Next button */}
            <TouchableOpacity
              style={[styles.btn, !userType && { opacity: 0.5 }]}
              onPress={() => userType && setStep(2)}
              disabled={!userType}
            >
              <Text style={styles.btnText}>Continue →</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── STEP 2 — Fill details ── */}
        {step === 2 && (
          <>
            {/* Full Name */}
            <Text style={[styles.label, { color: theme.text }]}>Full Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
              placeholder="Enter your full name"
              placeholderTextColor={theme.textSecondary}
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />

            {/* Phone */}
            <Text style={[styles.label, { color: theme.text }]}>Phone Number</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
              placeholder="Enter your phone number"
              placeholderTextColor={theme.textSecondary}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            {/* Nationality */}
            <Text style={[styles.label, { color: theme.text }]}>Nationality</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
              placeholder="e.g. Nigerian, Egyptian, Pakistani"
              placeholderTextColor={theme.textSecondary}
              value={nationality}
              onChangeText={setNationality}
              autoCapitalize="words"
            />

            {/* Gender — pilgrim only */}
            {userType === "pilgrim" && (
              <>
                <Text style={[styles.label, { color: theme.text }]}>I am</Text>
                <View style={styles.genderRow}>
                  <TouchableOpacity
                    style={[styles.genderBtn, { borderColor: theme.border, backgroundColor: theme.card }, gender === "male" && styles.genderActive]}
                    onPress={() => setGender("male")}
                  >
                    <Text style={[styles.genderText, gender === "male" && { color: "#fff" }]}>👨 Male</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.genderBtn, { borderColor: theme.border, backgroundColor: theme.card }, gender === "female" && styles.genderActive]}
                    onPress={() => setGender("female")}
                  >
                    <Text style={[styles.genderText, gender === "female" && { color: "#fff" }]}>👩 Female</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

             {/* Agency fields — agent only */}
             {userType === "agent" && (
              <>
                <Text style={[styles.label, { color: theme.text }]}>Agency Name</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
                  placeholder="Your travel agency name"
                  placeholderTextColor={theme.textSecondary}
                  value={agencyName}
                  onChangeText={setAgencyName}
                  autoCapitalize="words"
                />
                <Text style={[styles.label, { color: theme.text }]}>Country</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
                  placeholder="e.g. Nigeria, Egypt, UK"
                  placeholderTextColor={theme.textSecondary}
                  value={agencyCountry}
                  onChangeText={setAgencyCountry}
                  autoCapitalize="words"
                />
              </>
            )}

                {error ? <Text style={styles.error}>{error}</Text> : null}

                {/* Submit button */}
                <TouchableOpacity
                style={[styles.btn, loading && { opacity: 0.6 }]}
                onPress={handleContinue}
                disabled={loading}
                >
                <Text style={styles.btnText}>
                    {loading ? "Saving..." : userType === "agent" ? "See Plans →" : "Start Journey 🕋"}
                </Text>
                </TouchableOpacity>

                {/* Back */}
                <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
                <Text style={styles.backText}>← Back</Text>
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
  