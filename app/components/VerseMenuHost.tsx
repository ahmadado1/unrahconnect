// Ready-made verse menu for Mushaf screens that don't have their own player logic
// (Al-Mulk and Al-Kahf readers). Tap a verse number → play the verse, tafsir, choose reciter.
import MushafVerseMenu from "@/app/components/MushafVerseMenu"
import TafsirSheet from "@/app/components/TafsirSheet"
import VerseReciterPicker from "@/app/components/VerseReciterPicker"
import { getVerseReciter, loadVerseReciterId, pauseQuran, playVerse, resumeQuran, saveVerseReciterId } from "@/lib/quranAudio"
import { useQuranPlayback } from "@/lib/useQuranPlayback"
import { useEffect, useState } from "react"

export type VerseTarget = { surah: number; ayah: number; name: string }

export default function VerseMenuHost({ target, onClose }: { target: VerseTarget | null; onClose: () => void }) {
  const playback = useQuranPlayback()
  const [reciterId, setReciterId] = useState("alafasy")
  const [tafsir, setTafsir] = useState<VerseTarget | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)

  useEffect(() => {
    void loadVerseReciterId().then(id => setReciterId(getVerseReciter(id).id))
  }, [])

  const playingThis = Boolean(
    target && playback.kind === "verse" && playback.surah === target.surah && playback.ayah === target.ayah
  )

  return (
    <>
      <MushafVerseMenu
        target={target}
        onClose={onClose}
        isPlayingThis={playingThis && playback.playing}
        isBookmarked={false}
        canBookmark={false}
        onBookmark={() => {}}
        onPlay={() => {
          const v = target
          onClose()
          if (!v) return
          if (playingThis) {
            if (playback.playing) pauseQuran()
            else resumeQuran()
            return
          }
          void playVerse({ surah: v.surah, ayah: v.ayah, lastAyah: v.ayah, reciter: getVerseReciter(reciterId), continuous: false, title: v.name })
        }}
        onTafsir={() => {
          const v = target
          onClose()
          if (v) setTimeout(() => setTafsir(v), 250)
        }}
        onReciter={() => {
          onClose()
          setTimeout(() => setPickerOpen(true), 250)
        }}
      />
      <TafsirSheet
        visible={tafsir !== null}
        surah={tafsir?.surah ?? 1}
        ayah={tafsir?.ayah ?? 1}
        surahName={tafsir?.name ?? ""}
        onClose={() => setTafsir(null)}
      />
      <VerseReciterPicker
        visible={pickerOpen}
        selectedId={reciterId}
        onClose={() => setPickerOpen(false)}
        onSelect={reciter => {
          setReciterId(reciter.id)
          void saveVerseReciterId(reciter.id)
          setPickerOpen(false)
        }}
      />
    </>
  )
}
