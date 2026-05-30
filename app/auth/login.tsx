import { useTheme } from "@/context/themeContext";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";

export default function LoginScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { theme, isDark } = useTheme()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [isSignUp, setIsSignUp] = useState(false)
  const [fullName, setFullName] = useState("")
  const [gender, setGender] = useState<"male" | "female">("male")
  const { t } = useTranslation()

  const handleResetPassword = async () => {
    if (!email) { setError("Please enter your email first"); return }
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) setError(error.message)
    else setError("✅ Password reset email sent! Check your inbox.")
    setLoading(false)
  }

  const handleAuth = async () => {
    if (!email || !password) { setError("Please fill in all fields"); return }
    if (isSignUp && !fullName) { setError("Please enter your full name"); return }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return }
    setLoading(true)
    setError("")
    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName, gender } }
      })
      if (error) setError(error.message)
      else router.replace("/(tabs)")
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else router.replace("/(tabs)")
    }
    setLoading(false)
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={[styles.screen, { backgroundColor: theme.background }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={[styles.container, { paddingTop: insets.top + 20 }]}>

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
                <Text style={[styles.label, { color: theme.text }]}>{t("iAm")}</Text>
                <View style={styles.genderRow}>
                  <TouchableOpacity
                    style={[styles.genderBtn, { borderColor: theme.border, backgroundColor: theme.card }, gender === "male" && styles.genderBtnActive]}
                    onPress={() => setGender("male")}
                  >
                    <Text style={[styles.genderBtnText, { color: theme.textSecondary }, gender === "male" && styles.genderBtnTextActive]}>{t("male")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.genderBtn, { borderColor: theme.border, backgroundColor: theme.card }, gender === "female" && styles.genderBtnActive]}
                    onPress={() => setGender("female")}
                  >
                    <Text style={[styles.genderBtnText, { color: theme.textSecondary }, gender === "female" && styles.genderBtnTextActive]}>{t("female")}</Text>
                  </TouchableOpacity>
                </View>
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

            {/* Forgot password */}
            {!isSignUp && (
              <TouchableOpacity onPress={handleResetPassword} style={styles.forgotBtn}>
                <Text style={styles.forgotText}>{t("forgotPassword")}</Text>
              </TouchableOpacity>
            )}

            {/* Error */}
            {error ? <Text style={styles.error}>{error}</Text> : null}

            {/* Button */}
            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleAuth}
              disabled={loading}
            >
              <Text style={styles.btnText}>
                {loading ? t("pleaseWait") : isSignUp ? t("signUp") : t("login")}
              </Text>
            </TouchableOpacity>

            {/* Toggle */}
            <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
              <Text style={styles.toggle}>
                {isSignUp ? t("haveAccount") : t("noAccount")}
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  )
}

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
  error: { color: "#E24B4A", fontSize: 13, marginBottom: 16, textAlign: "center" },
  btn: { backgroundColor: "#1E3A5F", borderRadius: 25, padding: 16, alignItems: "center", marginBottom: 16, marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  forgotBtn: { alignSelf: "flex-end", marginBottom: 16 },
  forgotText: { color: "#C9A84C", fontSize: 13 },
  toggle: { color: "#C9A84C", fontSize: 14, textAlign: "center", marginTop: 8 },
})