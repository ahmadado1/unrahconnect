import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from "@/lib/legalUrls"
import * as WebBrowser from "expo-web-browser"
import { useTranslation } from "react-i18next"
import { StyleSheet, Text, type StyleProp, type TextStyle } from "react-native"

type Props = {
  style?: StyleProp<TextStyle>
}

export default function LegalAgreementText({ style }: Props) {
  const { t } = useTranslation()

  const openTerms = () => {
    void WebBrowser.openBrowserAsync(TERMS_OF_SERVICE_URL)
  }

  const openPrivacy = () => {
    void WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL)
  }

  return (
    <Text style={[styles.text, style]}>
      {t("signupLegalAgree")}{" "}
      <Text style={styles.link} onPress={openTerms}>
        {t("termsOfService")}
      </Text>{" "}
      {t("signupLegalAnd")}{" "}
      <Text style={styles.link} onPress={openPrivacy}>
        {t("privacyPolicy")}
      </Text>
    </Text>
  )
}

const styles = StyleSheet.create({
  text: {
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(30, 58, 95, 0.65)",
    textAlign: "center",
    marginBottom: 4,
  },
  link: {
    color: "#C9A84C",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
})
