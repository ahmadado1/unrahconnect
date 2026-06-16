import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

export default function SearchScreen() {
  const { t } = useTranslation()
  return (
    <View>
      <Text>{t("search")}</Text>
    </View>
  );
}
