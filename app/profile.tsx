import { useTheme } from "@/context/themeContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";

export default function ProfileScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { theme, isDark } = useTheme()
  const [user, setUser] = useState<any>(null)
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [nationality, setNationality] = useState("")
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [gender, setGender] = useState<"male" | "female">("male")
  const { t } = useTranslation()

  useEffect(() => {
    getUser()
  }, [])

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUser(user)
      setFullName(user.user_metadata?.full_name || "")
      setPhone(user.user_metadata?.phone || "")
      setNationality(user.user_metadata?.nationality || "")
      setGender(user.user_metadata?.gender || "male")
    }
  }

  const saveProfile = async () => {
    setLoading(true)
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName, phone, nationality, gender }
    })
    if (error) console.log(error)
    else setEditing(false)
    setLoading(false)
  }

  return (
    <ScrollView style={[styles.screen, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: theme.header }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("profile")}</Text>
        <TouchableOpacity onPress={editing ? saveProfile : () => setEditing(true)}>
          <Text style={styles.headerAction}>
            {editing ? (loading ? t("saving") : t("save")) : t("edit")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Avatar section — always navy */}
      <View style={[styles.avatarSection, { backgroundColor: theme.header }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {fullName ? fullName[0].toUpperCase() : "?"}
          </Text>
        </View>
        <Text style={styles.userName}>{fullName || "Your Name"}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <Text style={styles.memberSince}>
          {t("memberSince")} {user ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : ""}
        </Text>
      </View>

      {/* Personal Info */}
      <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t("personalInfo")}</Text>

        {/* Full Name */}
        <View style={[styles.field, { borderBottomColor: theme.border }]}>
         <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t("fullName")}</Text>
          {editing ? (
            <TextInput
              style={[styles.fieldInput, { color: theme.text, borderColor: theme.gold, backgroundColor: theme.inputBg }]}
              value={fullName}
              onChangeText={setFullName}
                placeholder={t("enterFullName")}
              placeholderTextColor={theme.textSecondary}
            />
          ) : (
            <Text style={[styles.fieldValue, { color: theme.text }]}>{fullName || t("notSet")}</Text>
          )}
        </View>

        {/* Phone */}
        <View style={[styles.field, { borderBottomColor: theme.border }]}>
        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t("phone")}</Text>
          {editing ? (
            <TextInput
              style={[styles.fieldInput, { color: theme.text, borderColor: theme.gold, backgroundColor: theme.inputBg }]}
              value={phone}
              onChangeText={setPhone}
              placeholder={t("enterPhone")}
              placeholderTextColor={theme.textSecondary}
              keyboardType="phone-pad"
            />
          ) : (
            <Text style={[styles.fieldValue, { color: theme.text }]}>{phone || t("notSet")}</Text>
          )}
        </View>

        {/* Nationality */}
        <View style={[styles.field, { borderBottomColor: theme.border }]}>
          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t("nationality")}</Text>
          {editing ? (
            <TextInput
              style={[styles.fieldInput, { color: theme.text, borderColor: theme.gold, backgroundColor: theme.inputBg }]}
              value={nationality}
              onChangeText={setNationality}
              placeholder={t("enterNationality")}
              placeholderTextColor={theme.textSecondary}
            />
          ) : (
            <Text style={[styles.fieldValue, { color: theme.text }]}>{nationality || t("notSet")}</Text>
          )}
        </View>

        {/* Gender */}
        <View style={[styles.field, { borderBottomColor: theme.border }]}>
          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t("gender")}</Text>
          {editing ? (
            <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
              <TouchableOpacity
                style={[styles.genderBtn, { borderColor: theme.border }, gender === "male" && styles.genderBtnActive]}
                onPress={() => setGender("male")}
              >
                <Text style={[styles.genderBtnText, { color: theme.textSecondary }, gender === "male" && styles.genderBtnTextActive]}>{t("male")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.genderBtn, { borderColor: theme.border }, gender === "female" && styles.genderBtnActive]}
                onPress={() => setGender("female")}
              >
                <Text style={[styles.genderBtnText, { color: theme.textSecondary }, gender === "female" && styles.genderBtnTextActive]}>{t("female")}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={[styles.fieldValue, { color: theme.text }]}>{gender === "male" ? t("male") : t("female")}</Text>
          )}
        </View>
      </View>

      {/* Account section */}
      <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t("account")}</Text>

        <TouchableOpacity style={[styles.accountBtn, { borderBottomColor: theme.border }]}>
          <Ionicons name="lock-closed-outline" size={20} color={theme.text} />
          <Text style={[styles.accountBtnText, { color: theme.text }]}>{t("changePassword")}</Text>
          <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.accountBtn, { borderBottomColor: theme.border }]}>
          <Ionicons name="trash-outline" size={20} color="#E24B4A" />
          <Text style={[styles.accountBtnText, { color: "#E24B4A" }]}>{t("deleteAccount")}</Text>
          <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={{ height: 60 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { padding: 20, paddingBottom: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, padding: 8 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  headerAction: { color: "#C9A84C", fontSize: 15, fontWeight: "600" },
  avatarSection: { alignItems: "center", padding: 24, paddingBottom: 32 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#C9A84C", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  avatarText: { fontSize: 32, fontWeight: "bold", color: "#1E3A5F" },
  userName: { fontSize: 20, fontWeight: "bold", color: "#fff", marginBottom: 4 },
  userEmail: { fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 4 },
  memberSince: { fontSize: 12, color: "#C9A84C", marginTop: 4 },
  section: { marginHorizontal: 16, marginTop: 16, borderRadius: 14, padding: 16, borderWidth: 0.5 },
  sectionTitle: { fontSize: 13, fontWeight: "600", marginBottom: 14, textTransform: "uppercase", letterSpacing: 0.5 },
  field: { paddingVertical: 12, borderBottomWidth: 0.5 },
  fieldLabel: { fontSize: 12, marginBottom: 4 },
  fieldValue: { fontSize: 15, fontWeight: "500" },
  fieldInput: { fontSize: 15, borderWidth: 0.5, borderRadius: 8, padding: 8 },
  accountBtn: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, borderBottomWidth: 0.5 },
  accountBtnText: { flex: 1, fontSize: 15 },
  genderBtn: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  genderBtnActive: { backgroundColor: "#1E3A5F", borderColor: "#1E3A5F" },
  genderBtnText: { fontSize: 13 },
  genderBtnTextActive: { color: "#fff" },
})