import { useRouter } from "expo-router";
import { useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";

export default function LoginScreen() {
    const router = useRouter()
    const insets = useSafeAreaInsets()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [isSignUp, setIsSignUp] = useState(false)
    const [fullName, setFullName] = useState("")

    const handleResetPassword = async () => {
      if (!email) {
        setError("Please enter your email first")
        return
      }
      setLoading(true)
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) setError(error.message)
      else setError("✅ Password reset email sent! Check your inbox.")
      setLoading(false)
    }
  

    const handleAuth = async () => {
        // Validation
        if (!email || !password) {
          setError("Please fill in all fields")
          return
        }
        if (isSignUp && !fullName) {
          setError("Please enter your full name")
          return
        }
        if (password.length < 6) {
          setError("Password must be at least 6 characters")
          return
        }
    
        setLoading(true)
        setError("")
       
        setLoading(true)
        setError("")
    
        if (isSignUp) {
            const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } })
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
              style={styles.screen}
              behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
              <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
    
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.logo}>🌙</Text>
              <Text style={styles.title}>UmrahConnect</Text>
              <Text style={styles.subtitle}>
                {isSignUp ? "Create your account" : "Welcome back"}
              </Text>
            </View>
    
            {/* Form */}
            <View style={styles.form}>

            {isSignUp && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor="#888"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>
          )}
    
              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#888"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
    
              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#888"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              {!isSignUp && (
            <TouchableOpacity onPress={handleResetPassword} style={styles.forgotBtn}>
              <Text style={styles.forgotText}>Forgot password?</Text>
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
                  {loading ? "Please wait..." : isSignUp ? "Create Account" : "Login"}
                </Text>
              </TouchableOpacity>
    
              {/* Toggle */}
              <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
                <Text style={styles.toggle}>
                  {isSignUp ? "Already have an account? Login" : "Don't have an account? Sign up"}
                </Text>
              </TouchableOpacity>
    
            </View>
          </View>
        </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      )
    }

    




const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#F5F0E8" },
    container: { flex: 1, padding: 24 },
  
    header: { alignItems: "center", marginBottom: 40 },
    logo: { fontSize: 60, marginBottom: 12 },
    title: { fontSize: 28, fontWeight: "bold", color: "#1E3A5F", marginBottom: 6 },
    subtitle: { fontSize: 15, color: "#888" },
  
    form: { flex: 1 },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 13, fontWeight: "600", color: "#1E3A5F", marginBottom: 8 },
    input: {
      backgroundColor: "#fff",
      borderRadius: 12,
      padding: 14,
      fontSize: 15,
      borderWidth: 0.5,
      borderColor: "#E0D9CE",
      color: "#1E3A5F",
    },
  
    error: { color: "#E24B4A", fontSize: 13, marginBottom: 16, textAlign: "center" },
  
    btn: {
      backgroundColor: "#1E3A5F",
      borderRadius: 25,
      padding: 16,
      alignItems: "center",
      marginBottom: 16,
      marginTop: 8,
    },
    btnDisabled: { opacity: 0.6 },
    btnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
    
    forgotBtn: { alignSelf: "flex-end", marginBottom: 16 },
    forgotText: { color: "#C9A84C", fontSize: 13 },
  
    toggle: { color: "#C9A84C", fontSize: 14, textAlign: "center", marginTop: 8 },
  })