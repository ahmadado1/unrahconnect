import { useTheme } from "@/context/themeContext";
import { isExpoGo } from "@/lib/runtime";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { Platform } from "react-native";
import { useTranslation } from "react-i18next";

function StandardTabs() {
  const { theme } = useTheme()
  const { t } = useTranslation()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopWidth: 0.5,
          borderTopColor: theme.border,
          height: 90,
          paddingBottom: 22,
          paddingTop: 10,
        },
        tabBarActiveTintColor: "#C9A84C",
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t("home"), tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} /> }} />
      <Tabs.Screen name="umrah" options={{ title: t("guide"), tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "book" : "book-outline"} size={24} color={color} /> }} />
      <Tabs.Screen name="maps" options={{ title: t("maps"), tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "map" : "map-outline"} size={24} color={color} /> }} />
      <Tabs.Screen name="services" options={{ title: t("services"), tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "grid" : "grid-outline"} size={24} color={color} /> }} />
      <Tabs.Screen name="me" options={{ title: t("me"), tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} /> }} />
    </Tabs>
  )
}

export default function TabsLayout() {
  const { t } = useTranslation()

  if (Platform.OS === "ios" && !isExpoGo) {
    return (
      <NativeTabs
        iconColor={{ default: "#94A3B8", selected: "#C9A84C" }}
        labelStyle={{ color: "#0F172A" }}
        tintColor="#C9A84C"
        disableTransparentOnScrollEdge
      >
        <NativeTabs.Trigger name="index">
          <Label>{t("home")}</Label>
          <Icon sf={{ default: "house", selected: "house.fill" }} drawable="ic_menu_view" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="umrah">
          <Label>{t("guide")}</Label>
          <Icon sf={{ default: "book", selected: "book.fill" }} drawable="ic_menu_today" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="maps">
          <Label>{t("maps")}</Label>
          <Icon sf={{ default: "map", selected: "map.fill" }} drawable="ic_menu_mylocation" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="services">
          <Label>{t("services")}</Label>
          <Icon sf={{ default: "square.grid.2x2", selected: "square.grid.2x2.fill" }} drawable="ic_menu_manage" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="me">
          <Label>{t("me")}</Label>
          <Icon sf={{ default: "person", selected: "person.fill" }} drawable="ic_menu_myplaces" />
        </NativeTabs.Trigger>
      </NativeTabs>
    )
  }

  return <StandardTabs />
}
