import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";

export default function TabsLayout() {
  return (
    <NativeTabs
      iconColor={{ default: "#94A3B8", selected: "#0EA5E9" }}
      labelStyle={{ color: "#0F172A" }}
      tintColor="#0EA5E9"
      disableTransparentOnScrollEdge
    >
      <NativeTabs.Trigger name="index">
        <Label>Home</Label>
        <Icon sf={{ default: "house", selected: "house.fill" }} drawable="ic_menu_view" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="umrah">
        <Label>Umrah</Label>
        <Icon sf={{ default: "moon", selected: "moon.fill" }} drawable="ic_menu_today" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="favorite">
        <Label>Favorite</Label>
        <Icon sf={{ default: "heart", selected: "heart.fill" }} drawable="btn_star" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
