import { useTheme } from "@/context/themeContext";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { Href, useRouter } from "expo-router";
import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;
const DRAWER_WIDTH = SCREEN_WIDTH * 0.75;

type props = {
  isOpen: boolean
  onClose: () => void
}

export default function DrawerMenu({ isOpen, onClose }: props) {
  const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current
  const router = useRouter()
  const { theme } = useTheme()
  const { t } = useTranslation()

  React.useEffect(() => {
    if (isOpen) {
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }).start()
    } else {
      Animated.spring(slideAnim, { toValue: DRAWER_WIDTH, useNativeDriver: true }).start()
    }
  }, [isOpen])

  return (
    <>
      {/* Dark overlay — only renders when drawer is open */}
      {isOpen && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={onClose}
        />
      )}

      {/* The drawer panel */}
      <Animated.View
        style={[
          styles.drawer,
          { backgroundColor: theme.card, transform: [{ translateX: slideAnim }] }
        ]}
      >
        {/* Header — always navy */}
        <View style={styles.drawerHeader}>
          <View style={styles.drawerLogo}>
            <Text style={styles.drawerLogoText}>🌙</Text>
          </View>
          <Text style={styles.drawerTitle}>UmrahConnect</Text>
          <Text style={styles.drawerSubtitle}>{t("drawerTagline")}</Text>
        </View>

        {/* Menu items */}
        <View style={styles.menuItems}>

          {/* Profile */}
          <TouchableOpacity style={styles.menuItem} onPress={() => { router.push("/profile"); onClose(); }}>
            <Ionicons name="person-outline" size={22} color={theme.text} />
            <Text style={[styles.menuText, { color: theme.text }]}>{t("profile")}</Text>
          </TouchableOpacity>

          {/* Favorites */}
          <TouchableOpacity style={styles.menuItem} onPress={() => { router.push("/favorites" as Href); onClose(); }}>
            <Ionicons name="heart-outline" size={22} color={theme.text} />
            <Text style={[styles.menuText, { color: theme.text }]}>{t("favorites")}</Text>
          </TouchableOpacity>

          {/* Notifications */}
          <TouchableOpacity style={styles.menuItem} >
            <Ionicons name="notifications-outline" size={22} color={theme.text} />
            <Text style={[styles.menuText, { color: theme.text }]}>{t("notifications")}</Text>
          </TouchableOpacity>

          {/* Settings */}
          <TouchableOpacity style={styles.menuItem} onPress={() => { router.push("/settings"); onClose(); }}>
            <Ionicons name="settings-outline" size={22} color={theme.text} />
            <Text style={[styles.menuText, { color: theme.text }]}>{t("settings")}</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />

          {/* About Us */}
          <TouchableOpacity style={styles.menuItem} onPress={() => { router.push("/about"); onClose(); }}>
            <Ionicons name="information-circle-outline" size={22} color={theme.text} />
            <Text style={[styles.menuText, { color: theme.text }]}>{t("aboutUs")}</Text>
          </TouchableOpacity>

          {/* Contact Us */}
          <TouchableOpacity style={styles.menuItem} onPress={() => { router.push("/contact"); onClose(); }}>
            <Ionicons name="call-outline" size={22} color={theme.text} />
            <Text style={[styles.menuText, { color: theme.text }]}>{t("contactUs")}</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />

          {/* Logout — always red */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={async () => {
              await supabase.auth.signOut()
              onClose()
            }}
          >
            <Ionicons name="log-out-outline" size={22} color="#E24B4A" />
            <Text style={[styles.menuText, { color: "#E24B4A" }]}>{t("logout")}</Text>
          </TouchableOpacity>

        </View>
      </Animated.View>
    </>
  )
}

const styles = StyleSheet.create({
  // Semi-transparent overlay behind drawer
  overlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 999,
  },
  // Drawer panel
  drawer: {
    position: "absolute",
    top: 0, right: 0, bottom: 90,
    width: DRAWER_WIDTH,
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  // Always navy header
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
  menuItem: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14, borderRadius: 10, marginBottom: 4 },
  menuText: { fontSize: 15, fontWeight: "500" },
  menuDivider: { height: 0.5, marginVertical: 8 },
})