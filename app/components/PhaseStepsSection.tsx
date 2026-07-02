import BlackStoneStepCard from "@/app/components/BlackStoneStepCard"
import PhaseStepCard from "@/app/components/PhaseStepCard"
import TalbiyahStopStepCard from "@/app/components/TalbiyahStopStepCard"
import YamaniDuaExpander from "@/app/components/YamaniDuaExpander"
import type { ResolvedPhase } from "@/lib/resolvePhase"
import {
  getStepMeta,
  stepBadgeKey,
  stepTitleKey,
} from "@/lib/phaseStepMeta"
import { useTheme } from "@/context/themeContext"
import { useTranslation } from "react-i18next"
import { StyleSheet, Text, View } from "react-native"
import Animated, { FadeInDown } from "react-native-reanimated"
import type { SharedValue } from "react-native-reanimated"

type Props = {
  journey?: "umrah" | "hajj"
  phaseId: string
  stepsKeys: string[]
  data: ResolvedPhase
  scrollY: SharedValue<number>
  showIntro?: boolean
}

export default function PhaseStepsSection({
  journey = "umrah",
  phaseId,
  stepsKeys,
  data,
  scrollY,
  showIntro = false,
}: Props) {
  const { theme } = useTheme()
  const { t } = useTranslation()

  return (
    <View style={styles.container}>
      {showIntro ? (
        <Animated.View entering={FadeInDown.duration(450)}>
          <Text style={[styles.intro, { color: theme.textSecondary }]}>
            {data.description}
          </Text>
        </Animated.View>
      ) : null}

      <Animated.Text
        entering={FadeInDown.duration(400).delay(showIntro ? 60 : 0)}
        style={[styles.sectionTitle, { color: theme.text }]}
      >
        {t("whatToDo")}
      </Animated.Text>

      <View style={styles.list}>
        {data.steps.map((stepText, index) => {
          const stepKey = stepsKeys[index]
          if (!stepKey) return null

          if (journey === "umrah" && phaseId === "3" && index === 5) {
            return <TalbiyahStopStepCard key={stepKey} scrollY={scrollY} />
          }
          if (journey === "umrah" && phaseId === "3" && index === 7) {
            return <BlackStoneStepCard key={stepKey} />
          }

          const meta = getStepMeta(journey, phaseId, index)
          const titleKey = stepTitleKey(stepKey)
          const title = t(titleKey, { defaultValue: "" })
          const badge = t(stepBadgeKey(stepKey), { defaultValue: "" })
          const detail = data.stepDetails?.[index]

          return (
            <PhaseStepCard
              key={stepKey}
              number={index + 1}
              index={index}
              text={stepText}
              title={title || undefined}
              badgeLabel={badge || undefined}
              badgeColor={data.textColor}
              crucial={meta.crucial}
              menOnly={meta.menOnly}
              noteKey={meta.noteKey}
              arabic={detail?.arabic}
              transliteration={detail?.transliteration}
              translation={detail?.translation}
              citation={detail?.citation}
            >
              {meta.variant === "yamani-dua" ? <YamaniDuaExpander /> : null}
            </PhaseStepCard>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  intro: { fontSize: 15, lineHeight: 24, marginBottom: 8 },
  sectionTitle: { fontSize: 17, fontWeight: "bold", marginBottom: 14, marginTop: 4 },
  list: { gap: 12 },
})
