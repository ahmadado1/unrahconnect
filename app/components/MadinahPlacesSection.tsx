import { MADINAH_PLACES } from "@/lib/madinahPlaces"
import PhaseStepCard from "@/app/components/PhaseStepCard"
import RawdahVisitCard from "@/app/components/RawdahVisitCard"
import ZoomableImage from "@/app/components/ZoomableImage"
import { useTheme } from "@/context/themeContext"
import { useTranslation } from "react-i18next"
import { ImageSourcePropType, StyleSheet, Text, View } from "react-native"
import Animated, { FadeInDown } from "react-native-reanimated"

type Props = {
  badgeColor: string
}

const PLACE_IMAGES: Record<string, ImageSourcePropType> = {
  "1": require("../../assets/photos/masjid-nabawi.jpg"),
  "2": require("../../assets/photos/riyad-al-jannah.jpg"),
  "3": require("../../assets/photos/prophet-grave.jpg"),
  "4": require("../../assets/photos/jannat-al-baqi.jpg"),
  "5": require("../../assets/photos/masjid-quba.jpg"),
  "6": require("../../assets/photos/masjid-qiblatayn.jpg"),
  "7": require("../../assets/photos/uhud-mountain.png"),
  "8": require("../../assets/photos/seven-mosques.jpg"),
  "9": require("../../assets/photos/jabal-ayr.png"),
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
        {MADINAH_PLACES.map((place, index) => {
          const image = PLACE_IMAGES[place.number]
          return (
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
                {image ? (
                  <ZoomableImage
                    source={image}
                    style={styles.photoFrame}
                    imageStyle={styles.photo}
                    accessibilityLabel={`${t(place.titleKey)} — tap to zoom`}
                  />
                ) : null}
                {place.subItems?.map(sub => (
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
              {place.number === "2" && <RawdahVisitCard compact />}
            </View>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  sectionTitle: { fontSize: 17, fontWeight: "bold", marginBottom: 14, marginTop: 4 },
  list: { gap: 12 },
  photoFrame: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "rgba(30,58,95,0.08)",
    borderWidth: 0.5,
    borderColor: "rgba(201,168,76,0.35)",
    marginBottom: 4,
  },
  photo: {
    width: "100%",
    height: "100%",
  },
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
