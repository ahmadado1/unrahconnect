import { MADINAH_PLACES } from "@/lib/madinahPlaces"
import PhaseStepCard from "@/app/components/PhaseStepCard"
import RawdahVisitCard from "@/app/components/RawdahVisitCard"
import { useTheme } from "@/context/themeContext"
import { useTranslation } from "react-i18next"
import { StyleSheet, Text, View } from "react-native"
import Animated, { FadeInDown } from "react-native-reanimated"

type Props = {
  badgeColor: string
}

export default function MadinahPlacesSection({ badgeColor }: Props) {
  const { theme } = useTheme()
  const { t } = useTranslation()

  return (
    <View style={styles.container}>
      <Animated.Text
        entering={FadeInDown.duration(400)}
        style={[styles.sectionTitle, { color: theme.text }]}
      >
        {t("whatToDo")}
      </Animated.Text>

      <View style={styles.list}>
        {MADINAH_PLACES.map((place, index) => (
          <View key={place.number}>
            <PhaseStepCard
              number={Number(place.number)}
              index={index}
              title={t(place.titleKey)}
              text={t(place.descriptionKey)}
              badgeColor={badgeColor}
              crucial={place.crucial}
              citation={place.citationKey ? t(place.citationKey) : undefined}
            >
              {place.subItems?.map((sub) => (
                <View key={sub.titleKey} style={styles.subItem}>
                  <Text style={[styles.subTitle, { color: theme.text }]}>
                    {t(sub.titleKey)}
                  </Text>
                  <Text style={[styles.subDesc, { color: theme.textSecondary }]}>
                    {t(sub.descriptionKey)}
                  </Text>
                </View>
              ))}
            </PhaseStepCard>
            {/* After Riyad Al Jannah — Rawdah visit windows + Nusuk for daytime */}
            {place.number === "2" && <RawdahVisitCard compact />}
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  sectionTitle: { fontSize: 17, fontWeight: "bold", marginBottom: 14, marginTop: 4 },
  list: { gap: 12 },
  subItem: {
    gap: 4,
    paddingTop: 4,
    paddingLeft: 4,
    borderLeftWidth: 2,
    borderLeftColor: "rgba(201, 168, 76, 0.4)",
    paddingHorizontal: 10,
  },
  subTitle: { fontSize: 14, fontWeight: "600", lineHeight: 20 },
  subDesc: { fontSize: 13, lineHeight: 20 },
})
