// Importing UI components we need from React Native
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
// Lets us navigate between screens
import { useRouter } from "expo-router";
// useState stores data that can change, useEffect runs code after screen loads
import { useEffect, useState } from "react";
// Our Supabase connection to talk to the database
import { supabase } from "../lib/supabase";
// Icon library for the back button and edit icons
import { Ionicons } from "@expo/vector-icons";
// Gets the dynamic island/notch height so content doesn't go behind it
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProfileScreen() {
    // Lets us go back or navigate to other screens
    const router = useRouter()
    // Gets the safe area padding for dynamic island
    const insets = useSafeAreaInsets()
    // Stores the full user object from Supabase (email, id, metadata etc)
    const [user, setUser] = useState<any>(null)
    // Stores the user's full name — starts empty until we fetch from Supabase
    const [fullName, setFullName] = useState("")
    // Stores the user's phone number — starts empty
    const [phone, setPhone] = useState("")
    // Stores the user's nationality — starts empty
    const [nationality, setNationality] = useState("")
    // Controls whether we're in view mode (false) or edit mode (true)
    const [editing, setEditing] = useState(false)
    // True while saving to Supabase, used to show loading and disable button
    const [loading, setLoading] = useState(false)

    // Runs getUser() once when the screen first opens
    useEffect(() => {
        getUser()
      }, [])
    
      // Fetches the currently logged in user's data from Supabase
      const getUser = async () => {
        // Asks Supabase "who is logged in right now?"
        const { data: { user } } = await supabase.auth.getUser()
        // Only run if a user was actually found
        if (user) {
          // Save the full user object to state
          setUser(user)
          // Get full_name from user_metadata, use empty string if not set yet
          setFullName(user.user_metadata?.full_name || "")
          // Get phone from user_metadata, use empty string if not set yet
          setPhone(user.user_metadata?.phone || "")
          // Get nationality from user_metadata, use empty string if not set yet
          setNationality(user.user_metadata?.nationality || "")
        }
      }

      // Saves the updated profile info back to Supabase
      const saveProfile = async () => {
        // Show loading state while saving
        setLoading(true)
        // Send updated data to Supabase to update the user's metadata
        const { error } = await supabase.auth.updateUser({
          data: {
            // Save the three fields we allow editing
            full_name: fullName,
            phone: phone,
            nationality: nationality,
          }
        })
        // If something went wrong, log it to the console
        if (error) console.log(error)
        // If save was successful, switch back to view mode
        else setEditing(false)
        // Hide loading state whether it succeeded or failed
        setLoading(false)
      }

      return (
            // Scrollable screen so content doesn't get cut off
            <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
        
            {/* Header — navy blue bar at top with back button */}
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        
                {/* Back button — goes back to previous screen */}
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
        
                <Text style={styles.headerTitle}>Profile</Text>
        
                {/* Edit/Save button — toggles between edit and save */}
                <TouchableOpacity onPress={editing ? saveProfile : () => setEditing(true)}>
                <Text style={styles.headerAction}>
                    {editing ? (loading ? "Saving..." : "Save") : "Edit"}
                </Text>
                </TouchableOpacity>
        
            </View>

            {/* Avatar circle showing user's initials */}
                    <View style={styles.avatarSection}>

                {/* Circle with first letter of user's name */}
                <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                    {fullName ? fullName[0].toUpperCase() : "?"}
                </Text>
                </View>

                {/* User's name below the circle */}
                <Text style={styles.userName}>{fullName || "Your Name"}</Text>

                {/* User's email below the name */}
                <Text style={styles.userEmail}>{user?.email}</Text>

                {/* When they joined */}
                <Text style={styles.memberSince}>
                Member since {user ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : ""}
                </Text>

                </View>

                {/* Personal info section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Personal Info</Text>

                    {/* Full Name field */}
                    <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Full Name</Text>
                    {editing ? (
                        // When editing — show text input
                        <TextInput
                        style={styles.fieldInput}
                        value={fullName}
                        onChangeText={setFullName}
                        placeholder="Enter your full name"
                        placeholderTextColor="#888"
                        />
                    ) : (
                        // When not editing — just show the value
                        <Text style={styles.fieldValue}>{fullName || "Not set"}</Text>
                    )}
                    </View>

                    {/* Phone field */}
                    <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Phone</Text>
                    {editing ? (
                        <TextInput
                        style={styles.fieldInput}
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="Enter your phone number"
                        placeholderTextColor="#888"
                        keyboardType="phone-pad"
                        />
                    ) : (
                        <Text style={styles.fieldValue}>{phone || "Not set"}</Text>
                    )}
                    </View>

                    {/* Nationality field */}
                    <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Nationality</Text>
                    {editing ? (
                        <TextInput
                        style={styles.fieldInput}
                        value={nationality}
                        onChangeText={setNationality}
                        placeholder="Enter your nationality"
                        placeholderTextColor="#888"
                        />
                    ) : (
                        <Text style={styles.fieldValue}>{nationality || "Not set"}</Text>
                    )}
                    </View>

                </View>

                {/* Account section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Account</Text>

                        {/* Change password button */}
                        <TouchableOpacity style={styles.accountBtn}>
                        <Ionicons name="lock-closed-outline" size={20} color="#1E3A5F" />
                        <Text style={styles.accountBtnText}>Change Password</Text>
                        <Ionicons name="chevron-forward" size={18} color="#888" />
                        </TouchableOpacity>

                        {/* Delete account button */}
                        <TouchableOpacity style={styles.accountBtn}>
                        <Ionicons name="trash-outline" size={20} color="#E24B4A" />
                        <Text style={[styles.accountBtnText, { color: "#E24B4A" }]}>Delete Account</Text>
                        <Ionicons name="chevron-forward" size={18} color="#888" />
                        </TouchableOpacity>

                    </View>

                    <View style={{ height: 60 }} />

                    </ScrollView>
                )
                }

                const styles = StyleSheet.create({
                    // Main screen background
                    screen: { flex: 1, backgroundColor: "#F5F0E8" },
                  
                    // Navy header at top
                    header: {
                      backgroundColor: "#1E3A5F",
                      padding: 20,
                      paddingBottom: 20,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    },
                    // Back arrow button
                    backBtn: {
                      backgroundColor: "rgba(255,255,255,0.2)",
                      borderRadius: 20,
                      padding: 8,
                    },
                    // "Profile" title in header
                    headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
                    // "Edit" / "Save" button text
                    headerAction: { color: "#C9A84C", fontSize: 15, fontWeight: "600" },
                  
                    // Section containing the avatar circle and name
                    avatarSection: {
                      alignItems: "center",
                      padding: 24,
                      backgroundColor: "#1E3A5F",
                      paddingBottom: 32,
                    },
                    // The circle itself
                    avatar: {
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      backgroundColor: "#C9A84C",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 12,
                    },
                    // The initial letter inside the circle
                    avatarText: { fontSize: 32, fontWeight: "bold", color: "#1E3A5F" },
                    // Name below circle
                    userName: { fontSize: 20, fontWeight: "bold", color: "#fff", marginBottom: 4 },
                    // Email below name
                    userEmail: { fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 4 },
                    // Member since text
                    memberSince: { fontSize: 12, color: "#C9A84C", marginTop: 4 },
                  
                    // White card section
                    section: {
                      backgroundColor: "#fff",
                      marginHorizontal: 16,
                      marginTop: 16,
                      borderRadius: 14,
                      padding: 16,
                      borderWidth: 0.5,
                      borderColor: "#E0D9CE",
                    },
                    // Section title like "Personal Info"
                    sectionTitle: {
                      fontSize: 13,
                      fontWeight: "600",
                      color: "#888",
                      marginBottom: 14,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    },
                    // Each row in the section
                    field: {
                      paddingVertical: 12,
                      borderBottomWidth: 0.5,
                      borderBottomColor: "#E0D9CE",
                    },
                    // Label above the value like "Full Name"
                    fieldLabel: { fontSize: 12, color: "#888", marginBottom: 4 },
                    // The actual value text when not editing
                    fieldValue: { fontSize: 15, color: "#1E3A5F", fontWeight: "500" },
                    // The text input when editing
                    fieldInput: {
                      fontSize: 15,
                      color: "#1E3A5F",
                      borderWidth: 0.5,
                      borderColor: "#C9A84C",
                      borderRadius: 8,
                      padding: 8,
                    },
                  
                    // Each button in account section
                    accountBtn: {
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      paddingVertical: 14,
                      borderBottomWidth: 0.5,
                      borderBottomColor: "#E0D9CE",
                    },
                    // Button text
                    accountBtnText: { flex: 1, fontSize: 15, color: "#1E3A5F" },
                  })