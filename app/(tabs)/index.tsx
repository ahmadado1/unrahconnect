// Icon library for search and hamburger menu icons
import { Ionicons } from "@expo/vector-icons";
// Lets us navigate between screens
import { useRouter } from "expo-router";
// Controls the status bar style (light = white text)
import { StatusBar } from "expo-status-bar";
// React core, useEffect runs code after screen loads, useState stores changing data
import React, { useEffect, useState } from "react";
// UI components from React Native
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
// Handles safe area so content doesn't go behind dynamic island
import { SafeAreaView } from "react-native-safe-area-context";
// Our custom drawer component
import DrawerMenu from "../component/DrawerMenu";
// Supabase connection to get the logged in user's data
import { supabase } from "../../lib/supabase";

export default function HomeScreen() {
  // Lets us navigate to other screens
  const router = useRouter();
  // Controls whether the drawer is open or closed — starts closed
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Stores the Quran verse text — starts with loading message
  const [ayah, setAyah] = useState("Loading verse...");
  // Stores the verse reference like "Quran — Al-Baqarah 255"
  const [ayahRef, setAyahRef] = useState("");
  // Stores the logged in user's first name — starts empty
  const [userName, setUserName] = useState("")

  // Runs once when screen loads — fetches the logged in user's name
  useEffect(() => {
    const getUser = async () => {
      // Asks Supabase who is currently logged in
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Gets full_name from user_metadata, splits by space and takes first word
        // So "Ahmad Muktar" becomes just "Ahmad"
        setUserName(user.user_metadata?.full_name?.split(" ")[0] || "")
      }
    }
    getUser()
  }, [])

  // Runs once when screen loads — fetches a random Quran verse
  useEffect(() => {
    // Picks a random number between 1 and 6236 (total verses in Quran)
    const randomVerse = Math.floor(Math.random() * 6236) + 1
    // Calls the Quran API with that random verse number
    fetch(`https://api.alquran.cloud/v1/ayah/${randomVerse}/en.asad`)
      // Converts the response to readable JavaScript data
      .then(res => res.json())
      .then(data => {
        // Only update if API returned success code 200
        if (data.code === 200) {
          // Sets the verse text wrapped in quotes
          setAyah(`"${data.data.text}"`)
          // Sets the reference like "Quran — Al-Baqarah 255"
          setAyahRef(`Quran — ${data.data.surah.englishName} ${data.data.numberInSurah}`)
        }
      })
      // If API fails or no internet, show this fallback verse
      .catch(() => {
        setAyah("In the name of Allah, the Most Gracious, the Most Merciful.")
        setAyahRef("Quran — 1:1")
      })
  }, [])
  
  return (
    // Main screen wrapper with cream background
    <View style={styles.screen}>
      {/* Makes status bar text white so it shows on dark header */}
      <StatusBar style="light" />
      {/* Fills the area behind the dynamic island with navy blue */}
      <SafeAreaView edges={["top"]} style={styles.safeTop} />

      {/* Scrollable content so nothing gets cut off */}
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* Navy blue header section */}
        <View style={styles.header}>
          {/* Top row — logo on left, icons on right */}
          <View style={styles.headerTop}>

            {/* Left side — moon logo circle and greeting */}
            <View style={styles.headerLeft}>
              {/* Gold circle containing the moon emoji */}
              <View style={styles.logoCircle}>
                <Text style={styles.logoEmoji}>🌙</Text>
              </View>
              <View>
                {/* Gold greeting text */}
                <Text style={styles.greeting}>Assalamu Alaikum 👋</Text>
                {/* White app name in bold */}
                <Text style={styles.appName}>UmrahConnect</Text>
              </View>
            </View>

            {/* Right side — search and hamburger buttons */}
            <View style={styles.iconRow}>
              {/* Search button — not connected yet */}
              <TouchableOpacity style={styles.iconBtn}>
                <Ionicons name="search" size={24} color="#fff" />
              </TouchableOpacity>
              {/* Hamburger button — opens the drawer when tapped */}
              <TouchableOpacity style={styles.iconBtn} onPress={() => setDrawerOpen(true)}>
                <View style={styles.hamburger}>
                  {/* Three horizontal bars making the hamburger icon */}
                  <View style={styles.bar} />
                  <View style={styles.bar} />
                  <View style={styles.bar} />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Blue hero banner below the header */}
        <View style={styles.heroBanner}>
          <Text style={styles.heroWelcome}>Welcome back, {userName || "Pilgrim"} 🌙</Text>
          <Text style={styles.heroText}>Your complete Umrah companion</Text>
          <Text style={styles.heroSub}>Hotels · Restaurants · Guide</Text>
        </View>

        {/* "Explore" section title */}
        <Text style={styles.sectionTitle}>Explore</Text>

        {/* Wide card for Umrah Guide — takes full width */}
        <TouchableOpacity style={styles.cardWide} onPress={() => router.push("/umrah")}>
          <Text style={styles.cardIcon}>📖</Text>
          <View>
            <Text style={styles.cardTitle}>Umrah Guide</Text>
            <Text style={styles.cardSub}>Step by step for beginners</Text>
          </View>
        </TouchableOpacity>
        
        {/* Row of two cards side by side — Hotels and Restaurants */}
        <View style={styles.cardsRow}>
          {/* Hotels card — navigates to hotels screen when tapped */}
          <TouchableOpacity style={styles.card} onPress={() => router.push("/hotels")}>
            <Text style={styles.cardIcon}>🏨</Text>
            <Text style={styles.cardTitle}>Hotels</Text>
            <Text style={styles.cardSub}>Find your stay</Text>
          </TouchableOpacity>

          {/* Restaurants card — navigates to restaurants screen when tapped */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push("/restaurants")}
          >
            <Text style={styles.cardIcon}>🍽️</Text>
            <Text style={styles.cardTitle}>Restaurants</Text>
            <Text style={styles.cardSub}>Near the Haram</Text>
          </TouchableOpacity>
        </View>

        {/* Dark navy box showing today's Quran verse */}
        <View style={styles.tipBox}>
          {/* Gold label */}
          <Text style={styles.tipLabel}>✨ Verse of the day</Text>
          {/* The actual verse text — changes every time app opens */}
          <Text style={styles.tipText}>{ayah}</Text>
          {/* Reference like "Quran — Abasa 10" aligned to the right */}
          <Text style={styles.tipRef}>{ayahRef}</Text>
        </View>

      </ScrollView>

      {/* Drawer menu — slides in from right when hamburger is tapped */}
      {/* isOpen tells it whether to show, onClose tells it how to close */}
      <DrawerMenu isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  // Full screen cream background
  screen: { flex: 1, backgroundColor: "#F5F0E8" },
  // Fills dynamic island area with navy blue
  safeTop: { backgroundColor: "#1E3A5F" },
  // Scrollable content area
  container: { flex: 1, backgroundColor: "#F5F0E8" },
  // Navy blue header with bottom padding
  header: { backgroundColor: "#1E3A5F", paddingBottom: 20 },
  // Top row of header — space between left and right
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  // Left side of header — logo and text side by side
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  // Gold bordered circle for the moon logo
  logoCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(201,168,76,0.2)",
    borderWidth: 1.5,
    borderColor: "#C9A84C",
    alignItems: "center",
    justifyContent: "center",
  },
  // Moon emoji size
  logoEmoji: { fontSize: 26 },
  // Gold greeting text
  greeting: { color: "#C9A84C", fontSize: 13 },
  // White app name
  appName: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  // Row of icon buttons on right side of header
  iconRow: { flexDirection: "row", gap: 10 },
  // Each icon button — dark rounded square
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  // Unused — can be removed
  iconText: { fontSize: 20 },
  // Unused — can be removed
  notifDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#C9A84C",
    position: "absolute",
    top: 6,
    right: 6,
  },
  // Three bars container for hamburger icon
  hamburger: { gap: 5, alignItems: "center", justifyContent: "center" },
  // Each individual bar in the hamburger
  bar: { width: 22, height: 2, backgroundColor: "#fff", borderRadius: 2 },
  // Hero banner text — white and bold
  // greeting: { color: "#C9A84C", fontSize: 13 },
  // appName: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  heroWelcome: { color: "#C9A84C", fontSize: 13, marginBottom: 6 },
  heroText: { color: "#fff", fontSize: 20, fontWeight: "bold", textAlign: "center" },
  heroSub: { color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 6 },
  // "Explore" section title
  sectionTitle: {
    color: "#1E3A5F",
    fontSize: 18,
    fontWeight: "bold",
    marginHorizontal: 16,
    marginBottom: 10,
  },
  // Verse reference text — gold, small, right aligned
  tipRef: { color: "#C9A84C", fontSize: 11, marginTop: 8, textAlign: "right" },
  // Blue hero banner card
  heroBanner: {
    backgroundColor: '#2C5F8A',
    margin: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  // Row of two side by side cards
  cardsRow: { flexDirection: "row", marginHorizontal: 16, gap: 12, marginBottom: 12 },
  // Individual card — white rounded square
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0D9CE",
  },
  // Wide full width card for Umrah Guide
  cardWide: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderWidth: 1,
    borderColor: "#E0D9CE",
    marginBottom: 12,
  },
  // Emoji icon size on cards
  cardIcon: { fontSize: 28, marginBottom: 8 },
  // Card title text
  cardTitle: { color: "#1E3A5F", fontSize: 15, fontWeight: "bold" },
  // Card subtitle text
  cardSub: { color: "#888", fontSize: 12, textAlign: "center", marginTop: 4 },
  // Dark navy verse box at bottom
  tipBox: {
    backgroundColor: "#1E3A5F",
    margin: 16,
    borderRadius: 16,
    padding: 20,
    // Extra bottom margin so content clears the tab bar
    marginBottom: 80,
  },
  // Gold "Verse of the day" label
  tipLabel: { color: "#C9A84C", fontSize: 12, fontWeight: "bold", margin: 8 },
  // White italic verse text
  tipText: { color: "#fff", fontSize: 14, lineHeight: 22, fontStyle: "italic" },
});