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
        <Label>Umrah Guide</Label>
        <Icon sf={{ default: "moon", selected: "moon.fill" }} drawable="ic_menu_today" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="hotels">
        <Label>Hotels</Label>
        <Icon sf={{ default: "bed.double", selected: "bed.double.fill" }} drawable="ic_menu_myplaces" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="restaurants">
        <Label>Restaurants</Label>
        <Icon sf={{ default: "fork.knife", selected: "fork.knife.circle.fill" }} drawable="ic_menu_compass" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
