import i18n from "@/i18n"
import {
  SURAH_META,
  ayahCountForSurah,
  type SurahMeta,
} from "@/lib/quranSurahMeta"
import {
  normalizeReadLanguage,
  peekCachedSurah,
  readSurahOfflineFirst,
} from "@/lib/quranReadCache"
import { fetchWithTimeout } from "@/lib/fetchWithTimeout"
import { Ionicons } from "@expo/vector-icons"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"

export type QuranJumpTarget = {
  surah: SurahMeta
  ayah: number
  page: number
}

type Props = {
  visible: boolean
  onClose: () => void
  onJump: (target: QuranJumpTarget) => void
  initialSurah?: number
  initialAyah?: number
}

async function resolvePageForAyah(surah: number, ayah: number): Promise<number | null> {
  const lang = normalizeReadLanguage(i18n.language)
  const instant = peekCachedSurah(surah, lang)
  const fromInstant = instant?.find(v => v.number === ayah)?.page
  if (typeof fromInstant === "number" && fromInstant >= 1) return fromInstant

  const offline = await readSurahOfflineFirst(surah, lang)
  const fromOffline = offline?.find(v => v.number === ayah)?.page
  if (typeof fromOffline === "number" && fromOffline >= 1) return fromOffline

  try {
    const res = await fetchWithTimeout(
      `https://api.quran.com/api/v4/verses/by_key/${surah}:${ayah}?fields=page_number`,
      {},
      8000,
    )
    if (!res.ok) return null
    const json = await res.json()
    const page = Number(json?.verse?.page_number)
    return page >= 1 && page <= 604 ? page : null
  } catch {
    return null
  }
}

export default function QuranJumpPicker({
  visible,
  onClose,
  onJump,
  initialSurah = 1,
  initialAyah = 1,
}: Props) {
  const insets = useSafeAreaInsets()
  const surahListRef = useRef<FlatList>(null)
  const ayahListRef = useRef<FlatList>(null)

  const [surahNumber, setSurahNumber] = useState(initialSurah)
  const [ayah, setAyah] = useState(initialAyah)
  const [resolving, setResolving] = useState(false)

  const ayahCount = ayahCountForSurah(surahNumber)
  const ayahs = useMemo(
    () => Array.from({ length: ayahCount }, (_, i) => i + 1),
    [ayahCount],
  )

  useEffect(() => {
    if (!visible) return
    const s = Math.min(Math.max(initialSurah || 1, 1), 114)
    const maxAyah = ayahCountForSurah(s)
    const a = Math.min(Math.max(initialAyah || 1, 1), maxAyah)
    setSurahNumber(s)
    setAyah(a)

    const t = setTimeout(() => {
      surahListRef.current?.scrollToIndex({ index: s - 1, animated: false, viewPosition: 0.35 })
      ayahListRef.current?.scrollToIndex({
        index: Math.min(a - 1, maxAyah - 1),
        animated: false,
        viewPosition: 0.35,
      })
    }, 80)
    return () => clearTimeout(t)
  }, [visible, initialSurah, initialAyah])

  const selectSurah = (n: number) => {
    setSurahNumber(n)
    setAyah(1)
    requestAnimationFrame(() => {
      ayahListRef.current?.scrollToOffset({ offset: 0, animated: true })
    })
  }

  const handleDone = async () => {
    const meta = SURAH_META[surahNumber - 1]
    if (!meta) return
    setResolving(true)
    try {
      const page = (await resolvePageForAyah(surahNumber, ayah)) ?? 1
      onJump({ surah: meta, ayah, page })
      onClose()
    } finally {
      setResolving(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.handle} />
          <View style={styles.titleRow}>
            <Text style={styles.title}>Go to</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>

          <View style={styles.columns}>
            <View style={styles.column}>
              <Text style={styles.columnLabel}>Surah</Text>
              <FlatList
                ref={surahListRef}
                data={SURAH_META}
                keyExtractor={item => String(item.number)}
                showsVerticalScrollIndicator={false}
                getItemLayout={(_, index) => ({ length: 48, offset: 48 * index, index })}
                onScrollToIndexFailed={info => {
                  surahListRef.current?.scrollToOffset({
                    offset: 48 * info.index,
                    animated: false,
                  })
                }}
                renderItem={({ item }) => {
                  const selected = item.number === surahNumber
                  return (
                    <TouchableOpacity
                      style={[styles.row, selected && styles.rowSelected]}
                      onPress={() => selectSurah(item.number)}
                    >
                      <Text style={[styles.rowText, selected && styles.rowTextSelected]}>
                        {item.number}. {item.englishName}
                      </Text>
                    </TouchableOpacity>
                  )
                }}
              />
            </View>

            <View style={styles.divider} />

            <View style={[styles.column, styles.ayahColumn]}>
              <Text style={styles.columnLabel}>Ayah</Text>
              <FlatList
                ref={ayahListRef}
                data={ayahs}
                keyExtractor={item => String(item)}
                showsVerticalScrollIndicator={false}
                getItemLayout={(_, index) => ({ length: 48, offset: 48 * index, index })}
                onScrollToIndexFailed={info => {
                  ayahListRef.current?.scrollToOffset({
                    offset: 48 * info.index,
                    animated: false,
                  })
                }}
                renderItem={({ item }) => {
                  const selected = item === ayah
                  return (
                    <TouchableOpacity
                      style={[styles.row, selected && styles.rowSelected]}
                      onPress={() => setAyah(item)}
                    >
                      <Text style={[styles.rowText, selected && styles.rowTextSelected]}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  )
                }}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.doneBtn, resolving && styles.doneBtnDisabled]}
            onPress={handleDone}
            disabled={resolving}
          >
            {resolving ? (
              <ActivityIndicator color={NAVY} />
            ) : (
              <Text style={styles.doneText}>
                Done · {surahNumber}:{ayah}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    backgroundColor: NAVY,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingHorizontal: 16,
    maxHeight: "72%",
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  columns: {
    flexDirection: "row",
    height: 320,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.35)",
  },
  column: { flex: 1.6 },
  ayahColumn: { flex: 1 },
  columnLabel: {
    color: GOLD,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.12)",
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  row: {
    height: 48,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  rowSelected: {
    backgroundColor: "rgba(201,168,76,0.22)",
  },
  rowText: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 15,
  },
  rowTextSelected: {
    color: GOLD,
    fontWeight: "700",
  },
  doneBtn: {
    marginTop: 14,
    backgroundColor: GOLD,
    borderRadius: 12,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  doneBtnDisabled: { opacity: 0.7 },
  doneText: {
    color: NAVY,
    fontSize: 16,
    fontWeight: "800",
  },
})
