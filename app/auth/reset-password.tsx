import { AnimatedHeroIcon } from "@/components/AnimatedHeroIcon";
import { AppIcon } from "@/components/AppIcon";
import { useTheme } from "@/context/themeContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
    Keyboard, KeyboardAvoidingView, Platform, StyleSheet,
    Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { sendAccountEmail } from "@/lib/accountEmails"
import { supabase } from "../../lib/supabase";

export default function ResetPasswordScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { theme } = useTheme()
  const { email } = useLocalSearchParams<{ email: string }>()

  const [step, setStep] = useState<"code" | "password">("code")
  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)

  const handleVerifyCode = async () => {
    if (!code) { setError("Please enter the code"); return }
    setLoading(true)
    setError("")

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "recovery"
    })

    if (error) {
      setError("Invalid or expired code. Please try again.")
    } else {
      setStep("password")
    }
    setLoading(false)
  }

  const handleUpdatePassword = async () => {
    if (!password || !confirm) { setError("Please fill in all fields"); return }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return }
    if (password !== confirm) { setError("Passwords do not match"); return }

    setLoading(true)
    setError("")

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
    } else {
      void sendAccountEmail({
        type: "password_changed",
        guest_email: String(email || ""),
        guest_name: "Pilgrim",
      })
      setDone(true)
      setTimeout(() => {
        supabase.auth.signOut()
        router.replace("/(tabs)")
      }, 2500)
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
            <AnimatedHeroIcon name="key" size={60} accent="gold" style={{ marginBottom: 12 }} />
            <Text style={[styles.title, { color: theme.text }]}>
              {done ? "Password Updated!" : step === "code" ? "Check your email" : "New Password"}
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {done
                ? "Redirecting you to login..."
                : step === "code"
                ? `We sent a 6-digit code to ${email}`
                : "Choose a strong new password"}
            </Text>
          </View>

          {done ? (
            <View style={styles.successBox}>
              <AppIcon name="checkmarkCircle" size={28} color="#2E7D32" />
              <Text style={styles.successText}>All done!</Text>
            </View>
          ) : step === "code" ? (
            <View style={styles.form}>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>8-digit code</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
                  placeholder="Enter the code from your email"
                  placeholderTextColor={theme.textSecondary}
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  
                />
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.btn, loading && styles.btnDisabled]}
                onPress={handleVerifyCode}
                disabled={loading}
              >
                <Text style={styles.btnText}>
                  {loading ? "Verifying..." : "Verify Code"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.replace("/auth/login")}>
                <Text style={[styles.toggle, { color: "#C9A84C" }]}>Back to Login</Text>
              </TouchableOpacity>

            </View>
          ) : (
            <View style={styles.form}>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>New Password</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
                  placeholder="Enter new password"
                  placeholderTextColor={theme.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Confirm Password</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
                  placeholder="Confirm new password"
                  placeholderTextColor={theme.textSecondary}
                  value={confirm}
                  onChangeText={setConfirm}
                  secureTextEntry
                />
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.btn, loading && styles.btnDisabled]}
                onPress={handleUpdatePassword}
                disabled={loading}
              >
                <Text style={styles.btnText}>
                  {loading ? "Updating..." : "Update Password"}
                </Text>
              </TouchableOpacity>

            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { flex: 1, padding: 24 },
  header: { alignItems: "center", marginBottom: 40 },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 6, textAlign: "center" },
  subtitle: { fontSize: 15, textAlign: "center" },
  form: { flex: 1 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 8 },
  input: { borderRadius: 12, padding: 14, fontSize: 15, borderWidth: 0.5 },
  error: { color: "#E24B4A", fontSize: 13, marginBottom: 16, textAlign: "center" },
  btn: { backgroundColor: "#1E3A5F", borderRadius: 25, padding: 16, alignItems: "center", marginBottom: 16, marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  toggle: { fontSize: 14, textAlign: "center", marginTop: 8 },
  successBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  successText: { fontSize: 22, fontWeight: "bold" },
})