import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useRef } from "react";
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;
const DRAWER_WIDTH = SCREEN_WIDTH * 0.75;

type props = {
    isOpen: boolean
    onClose: () => void 
}

export default function DrawerMenu({ isOpen, onClose } : props) {
    const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current
    const router = useRouter()

    React.useEffect(() => {
        if (isOpen) {
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
          }).start()
        } else {
          Animated.spring(slideAnim, {
            toValue: DRAWER_WIDTH,
            useNativeDriver: true,
          }).start()
        }
      }, [isOpen])



      return (
        <>
          {isOpen && (
            <TouchableOpacity
              style={styles.overlay}
              activeOpacity={1}
              onPress={onClose}
            />
          )}
          <Animated.View
            style={[
              styles.drawer,
              { transform: [{ translateX: slideAnim }] }
            ]}
          >
            <View style={styles.drawerHeader}>
              <View style={styles.drawerLogo}>
                <Text style={styles.drawerLogoText}>🌙</Text>
              </View>
              <Text style={styles.drawerTitle}>UmrahConnect</Text>
              <Text style={styles.drawerSubtitle}>Your Umrah companion</Text>
            </View>

            <View style={styles.menuItems}>
              <TouchableOpacity style={styles.menuItem} onPress={() => { router.push("/profile"); onClose(); }}>
                <Ionicons name="person-outline" size={22} color="#1E3A5F" />
                <Text style={styles.menuText}>Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="heart-outline" size={22} color="#1E3A5F" />
                <Text style={styles.menuText}>Favorites</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="notifications-outline" size={22} color="#1E3A5F" />
                <Text style={styles.menuText}>Notifications</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="settings-outline" size={22} color="#1E3A5F" />
                <Text style={styles.menuText}>Settings</Text>
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="information-circle-outline" size={22} color="#1E3A5F" />
                <Text style={styles.menuText}>About Us</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="call-outline" size={22} color="#1E3A5F" />
                <Text style={styles.menuText}>Contact Us</Text>
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity
                style={styles.menuItem}
                onPress={async () => {
                  await supabase.auth.signOut()
                  onClose()
                }}
              >
                <Ionicons name="log-out-outline" size={22} color="#E24B4A" />
                <Text style={[styles.menuText, { color: "#E24B4A" }]}>Logout</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </>
      )
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 999,
  },
  drawer: {
    position: "absolute",
    top: 0, right: 0, bottom: 90,
    width: DRAWER_WIDTH,
    backgroundColor: "#fff",
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  drawerHeader: {
    backgroundColor: "#1E3A5F",
    padding: 24,
    paddingTop: 80,
    paddingBottom: 24,
  },
  drawerLogo: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: "rgba(201,168,76,0.2)",
    borderWidth: 1.5, borderColor: "#C9A84C",
    alignItems: "center", justifyContent: "center",
    marginBottom: 12,
  },
  drawerLogoText: { fontSize: 24 },
  drawerTitle: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  drawerSubtitle: { color: "#C9A84C", fontSize: 12, marginTop: 4 },

  menuItems: { padding: 16, flex: 1 },
  menuItem: {
    flexDirection: "row", alignItems: "center",
    gap: 14, padding: 14, borderRadius: 10,
    marginBottom: 4,
  },
  menuText: { fontSize: 15, color: "#1E3A5F", fontWeight: "500" },
  menuDivider: { height: 0.5, backgroundColor: "#E0D9CE", marginVertical: 8 },
})