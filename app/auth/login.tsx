import { useTheme } from "@/context/themeContext";
import * as AppleAuthentication from "expo-apple-authentication";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SelectDropdown from "../components/SelectDropdown";
import { supabase } from "../../lib/supabase";
import { isExpoGo } from "../../lib/runtime";
import { getPendingReferral, isValidReferralCode, linkPilgrimToAgent, normalizeReferralCode, saveReferralCode } from "@/lib/referral";

// ─── GOOGLE SIGN IN ───────────────────────────────────────────────────────────
// Native module only exists in dev/production builds — not Expo Go.

let GoogleSignin: any = null
let statusCodes: any = null

if (!isExpoGo) {
  try {
    const googleSignIn = require("@react-native-google-signin/google-signin")
    GoogleSignin = googleSignIn.GoogleSignin
    statusCodes = googleSignIn.statusCodes
  } catch (e) {
    // Not available in this environment
  }
}

export default function LoginScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { theme } = useTheme()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [isSignUp, setIsSignUp] = useState(false)
  const [fullName, setFullName] = useState("")
  const [gender, setGender] = useState<"male" | "female">("male")
  const [agentCode, setAgentCode] = useState("")
  const [agentCodeError, setAgentCodeError] = useState("")
  const { t } = useTranslation()

  useEffect(() => {
    getPendingReferral().then(code => {
      if (code) setAgentCode(normalizeReferralCode(code))
    })
  }, [])

  // Configure Google Sign In on mount
  useEffect(() => {
    if (GoogleSignin) {
      GoogleSignin.configure({
        webClientId: "960037449593-q9he07c18iunb1id0hfrmiab2tou45eq.apps.googleusercontent.com",
        iosClientId: "960037449593-nsmd655ofr73ln844jap3171d0s92o17.apps.googleusercontent.com",
      })
    }
  }, [])

  // ─── RESET PASSWORD ────────────────────────────────────────────────────────

  const handleResetPassword = async () => {
    setError("")
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail) { setError("Please enter your email first"); return }
    if (!cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setError("Please enter a valid email address.")
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail)
    if (error) {
      if (error.message.includes("validate") || error.message.includes("invalid")) {
        setError("Please enter a valid email address.")
      } else {
        setError(error.message)
      }
    } else {
      setError("")
      router.push({ pathname: "/auth/reset-password", params: { email: cleanEmail } })
    }
    setLoading(false)
  }

  // ─── EMAIL AUTH ────────────────────────────────────────────────────────────

  const validateAgentCodeInput = async () => {
    const code = normalizeReferralCode(agentCode)
    if (!code) return true
    const valid = await isValidReferralCode(code)
    if (!valid) {
      setAgentCodeError(t("agentCodeInvalid"))
      return false
    }
    setAgentCodeError("")
    return true
  }

  const handleAuth = async () => {
    if (!email || !password) { setError("Please fill in all fields"); return }
    if (isSignUp && !fullName) { setError("Please enter your full name"); return }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return }
    if (!(await validateAgentCodeInput())) return
    setLoading(true)
    setError("")
  
    if (isSignUp) {
      const code = normalizeReferralCode(agentCode)
      if (code) await saveReferralCode(code)

      const { error: signUpError } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName, gender } }
      })
      if (signUpError) {
        if (signUpError.message.includes("already registered") || signUpError.message.includes("already exists")) {
          setError("This email is already registered. Please login instead.")
        } else {
          console.log("Signup error:", signUpError.message)
          setError("Something went wrong. Please try again.")
        }
      } else {
        fetch("https://yqabuipymbaylholmmoi.supabase.co/functions/v1/send-welcome-email", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxYWJ1aXB5bWJheWxob2xtbW9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyODM3OTcsImV4cCI6MjA2MTg1OTc5N30.yT2HGTjPkPlvGQDMpKSoMATCIRHmjFZKhTzD4Oau5MQ"
        },
        body: JSON.stringify({
          guest_name: fullName,
          guest_email: email,
        })
      }).then(r => r.text()).then(t => console.log("Welcome email response:", t))
        .catch(e => console.log("Welcome email error:", e))
        router.replace("/auth/setup" as any)
}
  
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        if (error.message.includes("Invalid login")) {
          setError("Wrong email or password. Please try again.")
        } else if (error.message.includes("Email not confirmed")) {
          setError("Please confirm your email before logging in.")
        } else {
          setError(error.message)
        }
      } else {
        const code = normalizeReferralCode(agentCode)
        if (code) await linkPilgrimToAgent(code)
        router.replace("/(tabs)")
      }
    }
  
    setLoading(false)
  }

  // ─── GOOGLE SIGN IN ────────────────────────────────────────────────────────
const handleGoogleSignIn = async () => {
  if (GoogleSignin) {
    try {
      await GoogleSignin.hasPlayServices()
      const userInfo = await GoogleSignin.signIn()
      const idToken = userInfo.data?.idToken ?? (userInfo as any).idToken

      if (idToken) {
        console.log("Got idToken, exchanging with Supabase...")
        const { error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: idToken,
        })
        console.log("Supabase error:", error)
        if (error) {
          setError(error.message)
        } else {
          const { data: { user } } = await supabase.auth.getUser()
          const profileComplete = user?.user_metadata?.profile_complete
          if (!profileComplete) {
            const code = normalizeReferralCode(agentCode)
            if (code) await saveReferralCode(code)
            fetch("https://yqabuipymbaylholmmoi.supabase.co/functions/v1/send-welcome-email", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxYWJ1aXB5bWJheWxob2xtbW9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyODM3OTcsImV4cCI6MjA2MTg1OTc5N30.yT2HGTjPkPlvGQDMpKSoMATCIRHmjFZKhTzD4Oau5MQ"
              },
              body: JSON.stringify({
                guest_name: user?.user_metadata?.full_name || "Pilgrim",
                guest_email: user?.email || "",
              })
            }).catch(e => console.log("Welcome email error:", e))
            router.replace("/auth/setup" as any)
          } else {
            const code = normalizeReferralCode(agentCode)
            if (code) await linkPilgrimToAgent(code)
            router.replace("/(tabs)")
          }}
      }
    } catch (err: any) {
      console.log("Google error full:", JSON.stringify(err))
      console.log("Google error code:", err.code)
      if (statusCodes && err.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled — do nothing
      } else {
        setError("Google sign in failed. Please try again.")
      }
    }
  } else {
    setError("Google Sign In only works in the installed app. Please use email/password.")
  }
}

  // ─── Apple Sign In ────────────────────────────────────────────────────────────────
  const handleAppleSignIn = async () => {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    })

    const { identityToken } = credential

    if (identityToken) {
      const { error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: identityToken,
      })
      if (error) setError(error.message)
    else {
       const { data: { user } } = await supabase.auth.getUser()
       const profileComplete = user?.user_metadata?.profile_complete
       if (!profileComplete) {
         const code = normalizeReferralCode(agentCode)
         if (code) await saveReferralCode(code)
         fetch("https://yqabuipymbaylholmmoi.supabase.co/functions/v1/send-welcome-email", {
           method: "POST",
           headers: { 
             "Content-Type": "application/json",
             "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxYWJ1aXB5bWJheWxob2xtbW9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyODM3OTcsImV4cCI6MjA2MTg1OTc5N30.yT2HGTjPkPlvGQDMpKSoMATCIRHmjFZKhTzD4Oau5MQ"
           },
           body: JSON.stringify({
             guest_name: user?.user_metadata?.full_name || "Pilgrim",
             guest_email: user?.email || "",
           })
         }).catch(e => console.log("Welcome email error:", e))
         router.replace("/auth/setup" as any)
       } else {
         const code = normalizeReferralCode(agentCode)
         if (code) await linkPilgrimToAgent(code)
         router.replace("/(tabs)")
       }
       }}
  } catch (e: any) {
    if (e.code === "ERR_REQUEST_CANCELED") {
      // User cancelled — do nothing
    } else {
      setError("Apple sign in failed. Please try again.")
    }
  }
}



  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={[styles.screen, { backgroundColor: theme.background }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          style={[styles.container, { paddingTop: insets.top + 20 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>🌙</Text>
            <Text style={[styles.title, { color: theme.text }]}>UmrahConnect</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {isSignUp ? t("createAccount") : t("welcomeBackAuth")}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>

            {/* Full Name */}
            {isSignUp && (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>{t("fullName")}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
                  placeholder={t("enterFullName")}
                  placeholderTextColor={theme.textSecondary}
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
              </View>
            )}

            {/* Gender */}
            {isSignUp && (
              <View style={styles.inputGroup}>
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
              </View>
            )}

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>{t("emailLabel")}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
                placeholder={t("enterEmail")}
                placeholderTextColor={theme.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>{t("passwordLabel")}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
                placeholder={t("enterPassword")}
                placeholderTextColor={theme.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {/* Agent code */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>{t("agentCodeOptional")}</Text>
              <Text style={[styles.fieldHint, { color: theme.textSecondary }]}>{t("agentCodeHint")}</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.card, borderColor: theme.border, color: theme.text },
                  agentCode.length > 0 && styles.inputApplied,
                  agentCodeError ? styles.inputError : null,
                ]}
                placeholder={t("agentCodePlaceholder")}
                placeholderTextColor={theme.textSecondary}
                value={agentCode}
                onChangeText={text => {
                  setAgentCode(normalizeReferralCode(text))
                  if (agentCodeError) setAgentCodeError("")
                }}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              {agentCodeError ? <Text style={styles.agentCodeError}>{agentCodeError}</Text> : null}
            </View>

            {/* Forgot password */}
            {!isSignUp && (
              <TouchableOpacity onPress={handleResetPassword} style={styles.forgotBtn}>
                <Text style={styles.forgotText}>{t("forgotPassword")}</Text>
              </TouchableOpacity>
            )}

            {/* Error */}
            {error ? <Text style={styles.error}>{error}</Text> : null}

            {/* Main button */}
            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleAuth}
              disabled={loading}
            >
              <Text style={styles.btnText}>
                {loading ? t("pleaseWait") : isSignUp ? t("signUp") : t("login")}
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
              <Text style={[styles.dividerText, { color: theme.textSecondary }]}>or</Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            </View>

            {/* Google Sign In */}
            <TouchableOpacity
              style={[styles.googleBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={handleGoogleSignIn}
            >
              <Text style={styles.googleIcon}>G</Text>
              <Text style={[styles.googleBtnText, { color: theme.text }]}>
                Continue with Google
              </Text>
            </TouchableOpacity>

            {/* Apple Sign In — only show on iOS */}
              {Platform.OS === "ios" && (
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                  cornerRadius={25}
                  style={{ height: 50, marginBottom: 16 }}
                  onPress={handleAppleSignIn}
                />
              )}

            {/* Toggle sign up / login */}
            <TouchableOpacity onPress={() => { setIsSignUp(!isSignUp); setError("") }}>
              <Text style={styles.toggle}>
                {isSignUp ? t("haveAccount") : t("noAccount")}
              </Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  )
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { flex: 1, padding: 24 },
  header: { alignItems: "center", marginBottom: 40 },
  logo: { fontSize: 60, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 6 },
  subtitle: { fontSize: 15 },
  genderRow: { flexDirection: "row", gap: 12 },
  genderBtn: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, alignItems: "center" },
  genderBtnActive: { backgroundColor: "#1E3A5F", borderColor: "#1E3A5F" },
  genderBtnText: { fontSize: 14, fontWeight: "500" },
  genderBtnTextActive: { color: "#fff" },
  form: { flex: 1 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 8 },
  input: { borderRadius: 12, padding: 14, fontSize: 15, borderWidth: 0.5 },
  inputApplied: { borderColor: "#C9A84C", borderWidth: 1.5 },
  inputError: { borderColor: "#E24B4A", borderWidth: 1 },
  fieldHint: { fontSize: 12, marginBottom: 8, lineHeight: 18 },
  agentCodeError: { color: "#E24B4A", fontSize: 12, marginTop: 6 },
  error: { color: "#E24B4A", fontSize: 13, marginBottom: 16, textAlign: "center" },
  btn: { backgroundColor: "#1E3A5F", borderRadius: 25, padding: 16, alignItems: "center", marginBottom: 16, marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  forgotBtn: { alignSelf: "flex-end", marginBottom: 16 },
  forgotText: { color: "#C9A84C", fontSize: 13 },
  toggle: { color: "#C9A84C", fontSize: 14, textAlign: "center", marginTop: 8, marginBottom: 40 },
  divider: { flexDirection: "row", alignItems: "center", marginVertical: 20, gap: 12 },
  dividerLine: { flex: 1, height: 0.5 },
  dividerText: { fontSize: 13 },
  googleBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, borderRadius: 25, padding: 14, borderWidth: 0.5, marginBottom: 16 },
  googleIcon: { fontSize: 16, fontWeight: "bold", color: "#4285F4" },
  googleBtnText: { fontSize: 15, fontWeight: "500" },
})