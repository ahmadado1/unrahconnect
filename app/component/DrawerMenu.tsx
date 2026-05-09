// Supabase client — used for signing out
import { supabase } from "@/lib/supabase";
// Icon library for menu icons
import { Ionicons } from "@expo/vector-icons";
// Lets us navigate between screens
import { Href, useRouter } from "expo-router";
// React core and useRef hook
import React, { useRef } from "react";
// Animated for slide animation, Dimensions to get screen size, rest are UI components
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Gets the full width of the phone screen in pixels
const SCREEN_WIDTH = Dimensions.get("window").width;
// Drawer takes up 75% of the screen width
const DRAWER_WIDTH = SCREEN_WIDTH * 0.75;

// Defines what props this component expects from the parent
type props = {
    // Whether the drawer is open or closed
    isOpen: boolean
    // Function to call when drawer should close
    onClose: () => void 
}

export default function DrawerMenu({ isOpen, onClose } : props) {
    // Animation value — starts at DRAWER_WIDTH (fully off screen to the right)
    const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current
    // Lets us navigate to other screens from the drawer
    const router = useRouter()

    // Runs every time isOpen changes
    React.useEffect(() => {
        if (isOpen) {
          // Animate drawer from its current position to 0 (fully visible)
          Animated.spring(slideAnim, {
            toValue: 0,
            // Runs on native thread for smooth 60fps animation
            useNativeDriver: true,
          }).start()
        } else {
          // Animate drawer back to DRAWER_WIDTH (fully hidden off screen)
          Animated.spring(slideAnim, {
            toValue: DRAWER_WIDTH,
            useNativeDriver: true,
          }).start()
        }
      }, [isOpen]) // Only re-runs when isOpen changes

      return (
        <>
          {/* Dark overlay — only renders when drawer is open */}
          {isOpen && (
            <TouchableOpacity
              style={styles.overlay}
              // activeOpacity 1 means no visual feedback when tapping overlay
              activeOpacity={1}
              // Tapping the dark overlay closes the drawer
              onPress={onClose}
            />
          )}

          {/* The drawer panel — always rendered but hidden off screen when closed */}
          <Animated.View
            style={[
              styles.drawer,
              // translateX moves drawer left/right — 0 = visible, DRAWER_WIDTH = hidden
              { transform: [{ translateX: slideAnim }] }
            ]}
          >
            {/* Navy blue header section at top of drawer */}
            <View style={styles.drawerHeader}>
              {/* Gold circle containing the moon emoji logo */}
              <View style={styles.drawerLogo}>
                <Text style={styles.drawerLogoText}>🌙</Text>
              </View>
              {/* App name */}
              <Text style={styles.drawerTitle}>UmrahConnect</Text>
              {/* Tagline below app name */}
              <Text style={styles.drawerSubtitle}>Your Umrah companion</Text>
            </View>

            {/* Container for all menu buttons */}
            <View style={styles.menuItems}>

              {/* Profile — pushes to profile screen and closes drawer */}
              <TouchableOpacity style={styles.menuItem} onPress={() => { router.push("/profile"); onClose(); }}>
                <Ionicons name="person-outline" size={22} color="#1E3A5F" />
                <Text style={styles.menuText}>Profile</Text>
              </TouchableOpacity>

              {/* Favorites —  */}
              <TouchableOpacity style={styles.menuItem} onPress={() => { router.push("/favorites" as Href); onClose(); }}>
                <Ionicons name="heart-outline" size={22} color="#1E3A5F" />
                <Text style={styles.menuText}>Favorites</Text>
              </TouchableOpacity>

              {/* Notifications — not connected yet */}
              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="notifications-outline" size={22} color="#1E3A5F" />
                <Text style={styles.menuText}>Notifications</Text>
              </TouchableOpacity>

              {/* Settings — not connected yet */}
              <TouchableOpacity style={styles.menuItem} onPress={() => { router.push("/settings"); onClose(); }}>
                <Ionicons name="settings-outline" size={22} color="#1E3A5F" />
                <Text style={styles.menuText}>Settings</Text>
              </TouchableOpacity>

              {/* Thin line separating main items from info items */}
              <View style={styles.menuDivider} />

              {/* About Us  */}
              <TouchableOpacity style={styles.menuItem} onPress={() => { router.push("/about"); onClose(); }}>
                <Ionicons name="information-circle-outline" size={22} color="#1E3A5F" />
                <Text style={styles.menuText}>About Us</Text>
              </TouchableOpacity>

              {/* Contact Us — not connected yet */}
              <TouchableOpacity style={styles.menuItem} onPress={() => { router.push("/contact"); onClose(); }}>
                <Ionicons name="call-outline" size={22} color="#1E3A5F" />
                <Text style={styles.menuText}>Contact Us</Text>
              </TouchableOpacity>

              {/* Thin line before logout */}
              <View style={styles.menuDivider} />

              {/* Logout button — red to signal destructive action */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={async () => {
                  // Signs out from Supabase — triggers onAuthStateChange in _layout.tsx which redirects to login
                  await supabase.auth.signOut()
                  // Close the drawer after signing out
                  onClose()
                }}
              >
                <Ionicons name="log-out-outline" size={22} color="#E24B4A" />
                {/* Red text to match the destructive action */}
                <Text style={[styles.menuText, { color: "#E24B4A" }]}>Logout</Text>
              </TouchableOpacity>

            </View>
          </Animated.View>
        </>
      )
}

const styles = StyleSheet.create({
  // Semi-transparent black cover over the whole screen behind the drawer
  overlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    // Must be below drawer's zIndex so drawer appears on top
    zIndex: 999,
  },
  // The white drawer panel itself
  drawer: {
    position: "absolute",
    // Sits at top right, stops 90px from bottom (above tab bar)
    top: 0, right: 0, bottom: 90,
    width: DRAWER_WIDTH,
    backgroundColor: "#fff",
    // Above the overlay
    zIndex: 1000,
    // Shadow on the left edge of the drawer
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  // Navy blue header section
  drawerHeader: {
    backgroundColor: "#1E3A5F",
    padding: 24,
    // Extra top padding to clear the dynamic island
    paddingTop: 80,
    paddingBottom: 24,
  },
  // Gold circle for the logo
  drawerLogo: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: "rgba(201,168,76,0.2)",
    borderWidth: 1.5, borderColor: "#C9A84C",
    alignItems: "center", justifyContent: "center",
    marginBottom: 12,
  },
  // Moon emoji size
  drawerLogoText: { fontSize: 24 },
  // App name text
  drawerTitle: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  // Tagline text in gold
  drawerSubtitle: { color: "#C9A84C", fontSize: 12, marginTop: 4 },

  // Container for all menu buttons
  menuItems: { padding: 16, flex: 1 },
  // Each menu row — icon + text side by side
  menuItem: {
    flexDirection: "row", alignItems: "center",
    gap: 14, padding: 14, borderRadius: 10,
    marginBottom: 4,
  },
  // Menu item text
  menuText: { fontSize: 15, color: "#1E3A5F", fontWeight: "500" },
  // Thin horizontal line divider between sections
  menuDivider: { height: 0.5, backgroundColor: "#E0D9CE", marginVertical: 8 },
})