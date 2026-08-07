import { useTheme } from "@/context/themeContext"
import { NATIONALITIES } from "@/lib/countries"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import PhoneInput from "./components/PhoneInput"
import SelectDropdown from "./components/SelectDropdown"
import { sendAccountEmail } from "@/lib/accountEmails"
import { isNetworkError } from "@/lib/networkError"
import { supabase } from "../lib/supabase"

const NATIONALITY_OPTIONS = NATIONALITIES.map(n => ({
  id: n.id,
  label: n.label,
}))

export default function ProfileScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { theme } = useTheme()
  const [user, setUser] = useState<any>(null)
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [nationality, setNationality] = useState("")
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [gender, setGender] = useState<"male" | "female">("male")
  const { t } = useTranslation()

  const [passwordModal, setPasswordModal] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [passwordDone, setPasswordDone] = useState(false)

  useEffect(() => {
    getUser()
  }, [])

  const getUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      setUser(user)
      setFullName(user.user_metadata?.full_name || "")
      setPhone(user.user_metadata?.phone || "")
      setNationality(user.user_metadata?.nationality || "")
      setGender(user.user_metadata?.gender || "male")
    }
  }

  const handleDeleteAccount = async () => {
    const confirmDelete = async () => {
      setLoading(true)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        // Email before account is removed (fire-and-forget)
        await sendAccountEmail({
          type: "account_deleted",
          guest_email: user.email || "",
          guest_name: user.user_metadata?.full_name || fullName || "Pilgrim",
        })

        await supabase.from("bookings").delete().eq("user_id", user.id)
        await supabase.from("favorites").delete().eq("user_id", user.id)
        await supabase.from("umrah_progress").delete().eq("user_id", user.id)
        await supabase.from("hajj_progress").delete().eq("user_id", user.id)
        await supabase.rpc("delete_user")
        await supabase.auth.signOut()
        router.replace("/auth/login")
      } catch (e) {
        Alert.alert(
          t("error"),
          isNetworkError(e) ? t("networkError") : t("somethingWentWrong")
        )
      } finally {
        setLoading(false)
      }
    }

    Alert.alert("Delete Account", "We're sorry to see you go. Why are you leaving?", [
      { text: "Not using it anymore", onPress: confirmDelete },
      { text: "Privacy concerns", onPress: confirmDelete },
      { text: "Found a better app", onPress: confirmDelete },
      { text: t("cancel"), style: "cancel" },
    ])
  }

  const saveProfile = async () => {
    setLoading(true)
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName, phone, nationality, gender },
    })
    if (error) {
      console.log(error)
      Alert.alert(
        t("error"),
        isNetworkError(error) ? t("networkError") : t("somethingWentWrong")
      )
    } else {
      setEditing(false)
      await getUser()
    }
    setLoading(false)
  }

  const openPasswordModal = () => {
    setNewPassword("")
    setConfirmPassword("")
    setPasswordError("")
    setPasswordDone(false)
    setPasswordModal(true)
  }

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      setPasswordError(t("pleaseFillAll") || "Please fill in all fields")
      return
    }
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters")
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match")
      return
    }

    setPasswordLoading(true)
    setPasswordError("")
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPasswordLoading(false)

    if (error) {
      setPasswordError(error.message)
      return
    }

    void sendAccountEmail({
      type: "password_changed",
      guest_email: user?.email || "",
      guest_name: fullName || user?.user_metadata?.full_name || "Pilgrim",
    })

    setPasswordDone(true)
    setTimeout(() => {
      setPasswordModal(false)
      setPasswordDone(false)
      setNewPassword("")
      setConfirmPassword("")
    }, 1600)
  }

  const genderLabel = gender === "male" ? t("male") : t("female")

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.background }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
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

      <View style={[styles.avatarSection, { backgroundColor: theme.header }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {fullName ? fullName[0].toUpperCase() : "?"}
          </Text>
        </View>
        <Text style={styles.userName}>{fullName || "Your Name"}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <Text style={styles.memberSince}>
          {t("memberSince")}{" "}
          {user
            ? new Date(user.created_at).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })
            : ""}
        </Text>
      </View>

      <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          {t("personalInfo")}
        </Text>

        <View style={[styles.field, { borderBottomColor: theme.border }]}>
          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t("fullName")}</Text>
          {editing ? (
            <TextInput
              style={[
                styles.fieldInput,
                { color: theme.text, borderColor: theme.gold, backgroundColor: theme.inputBg },
              ]}
              value={fullName}
              onChangeText={setFullName}
              placeholder={t("enterFullName")}
              placeholderTextColor={theme.textSecondary}
            />
          ) : (
            <Text style={[styles.fieldValue, { color: theme.text }]}>
              {fullName || t("notSet")}
            </Text>
          )}
        </View>

        <View style={[styles.field, { borderBottomColor: theme.border }]}>
          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t("phone")}</Text>
          {editing ? (
            <PhoneInput
              value={phone}
              onChange={setPhone}
              placeholder={t("enterPhone")}
              compact
            />
          ) : (
            <Text style={[styles.fieldValue, { color: theme.text }]}>
              {phone || t("notSet")}
            </Text>
          )}
        </View>

        <View style={[styles.field, { borderBottomColor: theme.border }]}>
          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
            {t("nationality")}
          </Text>
          {editing ? (
            <SelectDropdown
              placeholder={t("enterNationality")}
              value={nationality}
              options={NATIONALITY_OPTIONS}
              onChange={setNationality}
              searchPlaceholder="Search nationality"
            />
          ) : (
            <Text style={[styles.fieldValue, { color: theme.text }]}>
              {nationality || t("notSet")}
            </Text>
          )}
        </View>

        <View style={[styles.field, { borderBottomWidth: 0 }]}>
          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t("gender")}</Text>
          {editing ? (
            <SelectDropdown
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
          ) : (
            <Text style={[styles.fieldValue, { color: theme.text }]}>{genderLabel}</Text>
          )}
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t("account")}</Text>

        <TouchableOpacity
          style={[styles.accountBtn, { borderBottomColor: theme.border }]}
          onPress={openPasswordModal}
        >
          <Ionicons name="lock-closed-outline" size={20} color={theme.text} />
          <Text style={[styles.accountBtnText, { color: theme.text }]}>{t("changePassword")}</Text>
          <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.accountBtn, { borderBottomColor: theme.border }]}
          onPress={handleDeleteAccount}
        >
          <Ionicons name="trash-outline" size={20} color="#E24B4A" />
          <Text style={[styles.accountBtnText, { color: "#E24B4A" }]}>{t("deleteAccount")}</Text>
          <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t("legal")}</Text>

        <TouchableOpacity
          style={[styles.accountBtn, { borderBottomColor: theme.border }]}
          onPress={() => router.push("/privacy")}
        >
          <Ionicons name="shield-checkmark-outline" size={20} color={theme.text} />
          <Text style={[styles.accountBtnText, { color: theme.text }]}>{t("privacyPolicy")}</Text>
          <Ionicons name="chevron-forward" size={18} color={theme.gold} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.accountBtn, { borderBottomWidth: 0 }]}
          onPress={() => router.push("/terms")}
        >
          <Ionicons name="document-text-outline" size={20} color={theme.text} />
          <Text style={[styles.accountBtnText, { color: theme.text }]}>{t("termsOfService")}</Text>
          <Ionicons name="chevron-forward" size={18} color={theme.gold} />
        </TouchableOpacity>
      </View>

      <View style={{ height: 60 }} />

      <Modal
        visible={passwordModal}
        animationType="slide"
        transparent
        onRequestClose={() => setPasswordModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: theme.card,
                paddingBottom: Math.max(insets.bottom, 20),
              },
            ]}
          >
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: theme.text }]}>{t("changePassword")}</Text>

            {passwordDone ? (
              <Text style={styles.successText}>Password updated successfully</Text>
            ) : (
              <>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                  New password
                </Text>
                <TextInput
                  style={[
                    styles.fieldInput,
                    {
                      color: theme.text,
                      borderColor: theme.border,
                      backgroundColor: theme.inputBg,
                      marginBottom: 12,
                    },
                  ]}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  placeholder="••••••••"
                  placeholderTextColor={theme.textSecondary}
                />
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                  Confirm password
                </Text>
                <TextInput
                  style={[
                    styles.fieldInput,
                    {
                      color: theme.text,
                      borderColor: theme.border,
                      backgroundColor: theme.inputBg,
                    },
                  ]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  placeholder="••••••••"
                  placeholderTextColor={theme.textSecondary}
                />
                {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

                <TouchableOpacity
                  style={[styles.saveBtn, passwordLoading && { opacity: 0.6 }]}
                  onPress={handleChangePassword}
                  disabled={passwordLoading}
                >
                  <Text style={styles.saveBtnText}>
                    {passwordLoading ? t("saving") : t("save")}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setPasswordModal(false)}>
              <Text style={styles.cancelText}>{t("cancel") || "Cancel"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    padding: 20,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, padding: 8 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  headerAction: { color: "#C9A84C", fontSize: 15, fontWeight: "600" },
  avatarSection: { alignItems: "center", padding: 24, paddingBottom: 32 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#C9A84C",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: { fontSize: 32, fontWeight: "bold", color: "#1E3A5F" },
  userName: { fontSize: 20, fontWeight: "bold", color: "#fff", marginBottom: 4 },
  userEmail: { fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 4 },
  memberSince: { fontSize: 12, color: "#C9A84C", marginTop: 4 },
  section: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    padding: 16,
    borderWidth: 0.5,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 14,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  field: { paddingVertical: 12, borderBottomWidth: 0.5 },
  fieldLabel: { fontSize: 12, marginBottom: 4 },
  fieldValue: { fontSize: 15, fontWeight: "500" },
  fieldInput: { fontSize: 15, borderWidth: 0.5, borderRadius: 8, padding: 8 },
  accountBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  accountBtnText: { flex: 1, fontSize: 15 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.2)",
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16 },
  saveBtn: {
    backgroundColor: "#C9A84C",
    borderRadius: 25,
    padding: 14,
    alignItems: "center",
    marginTop: 20,
  },
  saveBtnText: { color: "#1E3A5F", fontWeight: "700", fontSize: 15 },
  cancelBtn: { alignItems: "center", marginTop: 14 },
  cancelText: { color: "#C9A84C", fontSize: 14 },
  errorText: { color: "#E24B4A", fontSize: 13, marginTop: 8 },
  successText: {
    color: "#2E7D32",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    paddingVertical: 24,
  },
})
