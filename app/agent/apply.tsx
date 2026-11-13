// Agency application in the app.
// Main way: the website form opens in the in-app browser, already logged in
//   (agency details, then documents: PDF, photos or camera all work there).
// Backup: the same two forms built into the app ("Fill in the app instead").
//   Step 1: agency details (name, owner, country, cities, phone, WhatsApp…)
//   Step 2: verification (licence number + 4 documents, photographed with the camera
//           or chosen from the photo library when this app build supports it)
// If they leave half-way, the Me tab, Home and the Agent Dashboard remind them to finish.
// No prices or payment links here (store rules): agencies are free for now anyway.
import { CameraView, useCameraPermissions } from "expo-camera"
import { Ionicons } from "@expo/vector-icons"
import { useLocalSearchParams, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, Image, Modal, ScrollView, StyleSheet, Text, TextInput, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import TouchableOpacity from "@/app/components/AppPressable"
import PhoneInput from "@/app/components/PhoneInput"
import SelectDropdown from "@/app/components/SelectDropdown"
import { useTheme } from "@/context/themeContext"
import {
  applicationGaps,
  applicationStage,
  canPickFiles,
  canPickFromLibrary,
  DOC_KEYS,
  getMyApplication,
  pickFromFiles,
  pickFromLibrary,
  saveVerification,
  type DocKey,
  type MyApplication,
  type PickedDoc,
} from "@/lib/agentApplication"
import { submitAgentApplication } from "@/lib/agentSignup"
import { openAgentWebApplication } from "@/lib/agentWebApply"
import { COUNTRY_DIALS, countryName } from "@/lib/countries"
import { getUserFast } from "@/lib/supabase"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"
const GREEN = "#2F855A"

const DOC_LABEL: Record<DocKey, string> = {
  doc_business_reg: "applyDocBusinessReg",
  doc_licence: "applyDocLicence",
  doc_owner_id: "applyDocOwnerId",
  doc_office_photo: "applyDocOfficePhoto",
}
const DOC_ICON: Record<DocKey, keyof typeof Ionicons.glyphMap> = {
  doc_business_reg: "business-outline",
  doc_licence: "ribbon-outline",
  doc_owner_id: "id-card-outline",
  doc_office_photo: "storefront-outline",
}

type Step = "loading" | "web" | "details" | "documents" | "done"

export default function AgentApplyScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { theme } = useTheme()
  const { t, i18n } = useTranslation()
  // ?auto=1 → open the browser form straight away (from sign-up and the reminder card)
  // ?step=details|documents → use the in-app forms
  const params = useLocalSearchParams<{ step?: string; auto?: string; done?: string; later?: string }>()

  const [step, setStep] = useState<Step>("loading")
  const [app, setApp] = useState<MyApplication | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  // ─── Form 1: agency details ───────────────────────────────────────────────
  const [businessName, setBusinessName] = useState("")
  const [ownerName, setOwnerName] = useState("")
  const [country, setCountry] = useState("")
  const [cities, setCities] = useState("")
  const [phone, setPhone] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [website, setWebsite] = useState("")
  const [description, setDescription] = useState("")

  // ─── Form 2: verification ─────────────────────────────────────────────────
  const [licenceNumber, setLicenceNumber] = useState("")
  const [licenceAuthority, setLicenceAuthority] = useState("")
  const [businessRegNumber, setBusinessRegNumber] = useState("")
  const [officeAddress, setOfficeAddress] = useState("")
  const [docs, setDocs] = useState<Partial<Record<DocKey, PickedDoc>>>({})

  // Camera
  const [cameraFor, setCameraFor] = useState<DocKey | null>(null)
  const [permission, requestPermission] = useCameraPermissions()
  const cameraRef = useRef<CameraView>(null)
  const [capturing, setCapturing] = useState(false)
  const libraryAvailable = useMemo(() => canPickFromLibrary(), [])
  const autoOpened = useRef(false)
  const [webOpen, setWebOpen] = useState(false)

  // ─── Open the website form in the in-app browser, then refresh where they are ───
  const openWebForm = async () => {
    if (webOpen) return
    setWebOpen(true)
    setError("")
    try {
      await openAgentWebApplication()
      const fresh = await getMyApplication()
      setApp(fresh)
      const stage = applicationStage(fresh)
      setStep(stage === "review" || stage === "verified" ? "done" : "web")
    } catch (e) {
      console.log("Web application error:", e)
      setError(t("somethingWentWrong"))
    } finally {
      setWebOpen(false)
    }
  }
  const filesAvailable = useMemo(() => canPickFiles(), [])
  // "Upload" sheet: which document is being uploaded (Camera / Photos / File)
  const [uploadFor, setUploadFor] = useState<DocKey | null>(null)

  // Countries in the app language; we save the English name so lists and filters stay consistent.
  const countryOptions = useMemo(
    () => COUNTRY_DIALS.map(c => ({ id: c.name, label: countryName(c.code, i18n.language), prefix: c.code })),
    [i18n.language],
  )

  // ─── Load: where is this agency in the application? ───────────────────────
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [mine, { data: { user } }] = await Promise.all([getMyApplication(), getUserFast()])
        if (cancelled) return
        setApp(mine)
        // Prefill from the account and from what they saved before
        setOwnerName(mine?.owner_name || user?.user_metadata?.full_name || "")
        setPhone(mine?.phone || user?.user_metadata?.phone || "")
        setBusinessName(mine?.business_name || "")
        setCountry(mine?.country || "")
        setCities((mine?.cities ?? []).join(", "))
        setWhatsapp(mine?.whatsapp || "")
        setWebsite(mine?.website || "")
        setDescription(mine?.description || "")
        setLicenceNumber(mine?.licence_number || "")
        setLicenceAuthority(mine?.licence_authority || "")
        setBusinessRegNumber(mine?.business_reg_number || "")
        setOfficeAddress(mine?.office_address || "")

        const stage = applicationStage(mine)
        if (stage === "review" || stage === "verified") setStep("done")
        else if (params.step === "details") setStep("details")
        else if (params.step === "documents") setStep(stage === "details" ? "details" : "documents")
        else {
          setStep("web")
          if (params.auto === "1" && !autoOpened.current) {
            autoOpened.current = true
            void openWebForm()
          }
        }
      } catch (e) {
        console.log("Apply load error:", e)
        if (!cancelled) setStep("details")
      }
    })()
    return () => {
      cancelled = true
    }
  }, [params.step])

  // ─── Save form 1 ──────────────────────────────────────────────────────────
  const saveDetails = async () => {
    setError("")
    if (!businessName.trim()) return setError(t("agentNameRequired"))
    if (!ownerName.trim()) return setError(t("applyOwnerRequired"))
    if (!country.trim()) return setError(t("agentCountryRequired"))
    if (!phone.trim() && !whatsapp.trim()) return setError(t("applyPhoneRequired"))
    setBusy(true)
    try {
      await submitAgentApplication({
        businessName,
        ownerName,
        licenseNumber: licenceNumber,
        country,
        cities,
        phone,
        whatsapp,
        website,
        description,
        language: i18n.language || "en",
      })
      const fresh = await getMyApplication()
      setApp(fresh)
      setStep(applicationStage(fresh) === "documents" || !fresh ? "documents" : "done")
    } catch (e) {
      console.log("Apply details error:", e)
      setError(t("somethingWentWrong"))
    } finally {
      setBusy(false)
    }
  }

  // ─── Pick a document ──────────────────────────────────────────────────────
  const openCamera = async (key: DocKey) => {
    if (!permission?.granted) {
      const answer = await requestPermission()
      if (!answer.granted) return setError(t("applyCameraNeeded"))
    }
    setCameraFor(key)
  }

  const capture = async () => {
    if (!cameraRef.current || !cameraFor || capturing) return
    setCapturing(true)
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 })
      if (photo?.uri) setDocs(d => ({ ...d, [cameraFor]: { uri: photo.uri, mimeType: "image/jpeg" } }))
      setCameraFor(null)
    } catch (e) {
      console.log("Capture error:", e)
    } finally {
      setCapturing(false)
    }
  }

  const chooseFromLibrary = async (key: DocKey) => {
    try {
      const picked = await pickFromLibrary()
      if (picked) setDocs(d => ({ ...d, [key]: picked }))
    } catch (e) {
      console.log("Library pick error:", e)
    }
  }

  const chooseFile = async (key: DocKey) => {
    try {
      const picked = await pickFromFiles()
      if (picked) setDocs(d => ({ ...d, [key]: picked }))
    } catch (e) {
      console.log("File pick error:", e)
    }
  }

  // Close the sheet first, then open the camera / picker (two modals at once misbehave on iOS)
  const uploadWith = (how: "camera" | "photos" | "file") => {
    const key = uploadFor
    setUploadFor(null)
    if (!key) return
    setTimeout(() => {
      if (how === "camera") openCamera(key)
      else if (how === "photos") chooseFromLibrary(key)
      else chooseFile(key)
    }, 350)
  }

  // ─── Save form 2 ──────────────────────────────────────────────────────────
  const saveDocuments = async (finishLater = false) => {
    if (!app) return
    setError("")
    const allDocsThere = DOC_KEYS.every(key => docs[key] || app[key])
    if (!finishLater) {
      if (!licenceNumber.trim()) return setError(t("applyLicenceRequired"))
      if (!allDocsThere) return setError(t("applyDocsRequired"))
    }
    setBusy(true)
    try {
      await saveVerification(app, { licenceNumber, licenceAuthority, businessRegNumber, officeAddress }, docs)
      const fresh = await getMyApplication()
      setApp(fresh)
      setDocs({})
      if (finishLater) router.back()
      else setStep(applicationGaps(fresh).length ? "documents" : "done")
    } catch (e) {
      console.log("Apply docs error:", e)
      setError(e instanceof Error && e.message === "TOO_BIG" ? t("applyTooBig") : t("somethingWentWrong"))
    } finally {
      setBusy(false)
    }
  }

  // ─── UI helpers ───────────────────────────────────────────────────────────
  const input = (value: string, onChange: (v: string) => void, label: string, opts: { placeholder?: string; multiline?: boolean; hint?: string; keyboard?: "default" | "url" } = {}) => (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      {opts.hint ? <Text style={[styles.hint, { color: theme.textSecondary }]}>{opts.hint}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={opts.placeholder}
        placeholderTextColor={theme.textSecondary}
        multiline={opts.multiline}
        keyboardType={opts.keyboard === "url" ? "url" : "default"}
        autoCapitalize={opts.keyboard === "url" ? "none" : "sentences"}
        style={[styles.input, opts.multiline && styles.inputMulti, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
      />
    </View>
  )

  const stepNumber = step === "details" || (step === "web" && applicationStage(app) === "details") ? 1 : 2
  const header = (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("applyTitle")}</Text>
      </View>
      {step === "details" || step === "documents" || step === "web" ? (
        <>
          <Text style={styles.stepOf}>{t("applyStepOf", { n: stepNumber })}</Text>
          <View style={styles.progress}>
            <View style={[styles.progressBar, { backgroundColor: GOLD }]} />
            <View style={[styles.progressBar, { backgroundColor: stepNumber === 2 ? GOLD : "rgba(255,255,255,0.25)" }]} />
          </View>
          <Text style={styles.stepName}>{stepNumber === 1 ? t("applyStep1") : t("applyStep2")}</Text>
        </>
      ) : null}
    </View>
  )

  if (step === "loading") {
    return (
      <View style={[styles.screen, { backgroundColor: theme.background }]}>
        <StatusBar style="light" />
        {header}
        <ActivityIndicator color={GOLD} style={{ marginTop: 40 }} />
      </View>
    )
  }

  // ─── Main: open the secure application form (website) in the in-app browser ───
  if (step === "web") {
    const stage = applicationStage(app)
    const missing = applicationGaps(app).length
    return (
      <View style={[styles.screen, { backgroundColor: theme.background }]}>
        <StatusBar style="light" />
        {header}
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
          {app?.info_request ? (
            <View style={[styles.infoBox, { borderColor: GOLD }]}>
              <Text style={styles.infoTitle}>{t("applyInfoNeeded")}</Text>
              <Text style={styles.infoText}>{app.info_request}</Text>
            </View>
          ) : null}
          <View style={[styles.doneCard, { backgroundColor: theme.card, borderColor: GOLD }]}>
            <View style={[styles.doneIcon, { backgroundColor: GOLD }]}>
              <Ionicons name={stage === "details" ? "business-outline" : "document-text-outline"} size={28} color={NAVY} />
            </View>
            <Text style={[styles.doneTitle, { color: theme.text }]}>{t("completeTitle")}</Text>
            <Text style={[styles.body, { color: theme.textSecondary, textAlign: "center" }]}>
              {stage === "details" ? t("applyWebIntro") : t("completeBodyDocs", { count: missing })}
            </Text>
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TouchableOpacity style={[styles.primaryBtn, webOpen && { opacity: 0.6 }]} onPress={openWebForm} disabled={webOpen}>
            {webOpen ? <ActivityIndicator color={NAVY} /> : <Text style={styles.primaryBtnText}>{t("applyOpenForm")}</Text>}
          </TouchableOpacity>
          <View style={styles.freeNote}>
            <Ionicons name="gift-outline" size={18} color={GREEN} />
            <Text style={styles.freeNoteText}>{t("applyFreeNote")}</Text>
          </View>
          <TouchableOpacity style={styles.linkBtn} onPress={() => setStep(stage === "details" ? "details" : "documents")}>
            <Text style={[styles.linkBtnText, { color: theme.textSecondary }]}>{t("applyUseAppForm")}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    )
  }

  // ─── Done: documents in, waiting for review (or already verified) ─────────
  if (step === "done") {
    const verified = Boolean(app?.verified)
    return (
      <View style={[styles.screen, { backgroundColor: theme.background }]}>
        <StatusBar style="light" />
        {header}
        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.doneCard, { backgroundColor: theme.card, borderColor: GREEN }]}>
            <View style={styles.doneIcon}>
              <Ionicons name={verified ? "shield-checkmark" : "checkmark-done"} size={30} color="#fff" />
            </View>
            <Text style={[styles.doneTitle, { color: theme.text }]}>{verified ? t("dashActiveTitle") : t("applyDoneTitle")}</Text>
            <Text style={[styles.body, { color: theme.textSecondary, textAlign: "center" }]}>
              {verified ? t("dashActiveFreeBody") : t("applyDoneBody")}
            </Text>
          </View>
          <View style={styles.freeNote}>
            <Ionicons name="gift-outline" size={18} color={GREEN} />
            <Text style={styles.freeNoteText}>{t("applyFreeNote")}</Text>
          </View>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace("/agent/dashboard" as any)}>
            <Text style={styles.primaryBtnText}>{t("agentDashboard")}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkBtn} onPress={() => setStep("documents")}>
            <Text style={[styles.linkBtnText, { color: theme.textSecondary }]}>{t("applyEditDocs")}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    )
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />
      {header}

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
      >
        {/* A message from the UmrahConnect team ("we need more information") */}
        {app?.info_request ? (
          <View style={[styles.infoBox, { borderColor: GOLD }]}>
            <Text style={styles.infoTitle}>{t("applyInfoNeeded")}</Text>
            <Text style={styles.infoText}>{app.info_request}</Text>
          </View>
        ) : null}

        {step === "details" ? (
          // ─── Step 1: agency details ───────────────────────────────────────
          <>
            <Text style={[styles.lead, { color: theme.textSecondary }]}>{t("applyDetailsHint")}</Text>
            {input(businessName, setBusinessName, t("agencyName"))}
            {input(ownerName, setOwnerName, t("agentOwnerName"))}
            <View style={styles.field}>
              <SelectDropdown label={t("agencyCountry")} value={country} options={countryOptions} onChange={setCountry} />
            </View>
            {input(cities, setCities, t("agentCitiesLabel"), { placeholder: t("agentCitiesPlaceholder") })}
            <View style={styles.field}>
              <PhoneInput label={t("phoneNumber")} value={phone} onChange={setPhone} />
            </View>
            <View style={styles.field}>
              <PhoneInput label={t("agentWhatsappLabel")} value={whatsapp} onChange={setWhatsapp} />
            </View>
            {input(website, setWebsite, t("agentWebsiteLabel"), { keyboard: "url" })}
            {input(description, setDescription, t("agentDescriptionLabel"), { placeholder: t("agentDescriptionPlaceholder"), multiline: true })}

            {error ? <Text style={styles.error}>{error}</Text> : null}
            <TouchableOpacity style={[styles.primaryBtn, busy && { opacity: 0.6 }]} onPress={saveDetails} disabled={busy}>
              {busy ? <ActivityIndicator color={NAVY} /> : <Text style={styles.primaryBtnText}>{t("applyNext")}</Text>}
            </TouchableOpacity>
          </>
        ) : (
          // ─── Step 2: licence + documents ──────────────────────────────────
          <>
            <Text style={[styles.lead, { color: theme.textSecondary }]}>{t("applyDocsHint")}</Text>
            {input(licenceNumber, setLicenceNumber, t("agentLicenceLabel"))}
            {input(licenceAuthority, setLicenceAuthority, t("applyLicenceAuthority"))}
            {input(businessRegNumber, setBusinessRegNumber, t("applyBusinessReg"))}
            {input(officeAddress, setOfficeAddress, t("applyOfficeAddress"))}

            {DOC_KEYS.map(key => {
              const picked = docs[key]
              const uploaded = Boolean(app?.[key])
              return (
                <View key={key} style={[styles.docCard, { backgroundColor: theme.card, borderColor: picked || uploaded ? GREEN : theme.border }]}>
                  <View style={styles.docHead}>
                    <Ionicons name={DOC_ICON[key]} size={20} color={GOLD} />
                    <Text style={[styles.docTitle, { color: theme.text }]}>{t(DOC_LABEL[key])}</Text>
                    <Text style={[styles.docState, { color: picked || uploaded ? GREEN : "#B45309" }]}>
                      {picked ? t("applyReady") : uploaded ? t("applyUploaded") : t("applyMissing")}
                    </Text>
                  </View>
                  {/* Preview: the photo, or the PDF's name */}
                  {picked && picked.mimeType === "application/pdf" ? (
                    <View style={styles.pdfRow}>
                      <Ionicons name="document-attach-outline" size={22} color={NAVY} />
                      <Text style={styles.pdfName} numberOfLines={1}>{picked.name || "PDF"}</Text>
                    </View>
                  ) : picked ? (
                    <Image source={{ uri: picked.uri }} style={styles.preview} />
                  ) : null}
                  <View style={styles.docBtns}>
                    <TouchableOpacity style={styles.docBtn} onPress={() => setUploadFor(key)}>
                      <Ionicons name="cloud-upload-outline" size={16} color={NAVY} />
                      <Text style={styles.docBtnText}>{picked || uploaded ? t("applyRetake") : t("applyUpload")}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )
            })}
            {!filesAvailable ? <Text style={[styles.hint, { color: theme.textSecondary }]}>{t("applyPdfHint")}</Text> : null}

            {error ? <Text style={styles.error}>{error}</Text> : null}
            {busy ? <Text style={[styles.hint, { color: theme.textSecondary, textAlign: "center" }]}>{t("applyUploading")}</Text> : null}
            <TouchableOpacity style={[styles.primaryBtn, busy && { opacity: 0.6 }]} onPress={() => saveDocuments(false)} disabled={busy}>
              {busy ? <ActivityIndicator color={NAVY} /> : <Text style={styles.primaryBtnText}>{t("applySubmit")}</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkBtn} onPress={() => saveDocuments(true)} disabled={busy}>
              <Text style={[styles.linkBtnText, { color: theme.textSecondary }]}>{t("applySaveLater")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkBtn} onPress={() => setStep("details")} disabled={busy}>
              <Text style={[styles.linkBtnText, { color: theme.textSecondary }]}>{t("applyEditDetails")}</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* ─── Upload: Camera / Photos / File ────────────────────────────────── */}
      <Modal visible={Boolean(uploadFor)} transparent animationType="fade" onRequestClose={() => setUploadFor(null)}>
        <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={() => setUploadFor(null)}>
          <View style={[styles.sheet, { backgroundColor: theme.card, paddingBottom: insets.bottom + 16 }]}>
            <Text style={[styles.sheetTitle, { color: theme.text }]}>{uploadFor ? t(DOC_LABEL[uploadFor]) : ""}</Text>
            <TouchableOpacity style={[styles.sheetRow, { borderColor: theme.border }]} onPress={() => uploadWith("camera")}>
              <Ionicons name="camera-outline" size={22} color={GOLD} />
              <Text style={[styles.sheetText, { color: theme.text }]}>{t("applyFromCamera")}</Text>
            </TouchableOpacity>
            {libraryAvailable ? (
              <TouchableOpacity style={[styles.sheetRow, { borderColor: theme.border }]} onPress={() => uploadWith("photos")}>
                <Ionicons name="images-outline" size={22} color={GOLD} />
                <Text style={[styles.sheetText, { color: theme.text }]}>{t("applyFromPhotos")}</Text>
              </TouchableOpacity>
            ) : null}
            {filesAvailable ? (
              <TouchableOpacity style={[styles.sheetRow, { borderColor: theme.border }]} onPress={() => uploadWith("file")}>
                <Ionicons name="document-outline" size={22} color={GOLD} />
                <Text style={[styles.sheetText, { color: theme.text }]}>{t("applyFromFiles")}</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={styles.sheetCancel} onPress={() => setUploadFor(null)}>
              <Text style={[styles.sheetCancelText, { color: theme.textSecondary }]}>{t("cancel")}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ─── Camera for one document ───────────────────────────────────────── */}
      <Modal visible={Boolean(cameraFor)} animationType="slide" onRequestClose={() => setCameraFor(null)}>
        <View style={styles.cameraScreen}>
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
          <View style={[styles.cameraTop, { paddingTop: insets.top + 12 }]}>
            <Text style={styles.cameraTitle}>{cameraFor ? t(DOC_LABEL[cameraFor]) : ""}</Text>
            <Text style={styles.cameraHint}>{t("applyCameraHint")}</Text>
          </View>
          <View style={[styles.cameraBottom, { paddingBottom: insets.bottom + 24 }]}>
            <TouchableOpacity onPress={() => setCameraFor(null)} style={styles.cameraCancel}>
              <Text style={styles.cameraCancelText}>{t("cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={capture} style={styles.shutter} disabled={capturing}>
              {capturing ? <ActivityIndicator color={NAVY} /> : <View style={styles.shutterInner} />}
            </TouchableOpacity>
            <View style={{ width: 80 }} />
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { backgroundColor: NAVY, paddingHorizontal: 20, paddingBottom: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, padding: 6 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  stepOf: { color: "#D7DEEA", fontSize: 12, marginTop: 14 },
  progress: { flexDirection: "row", gap: 6, marginTop: 6 },
  progressBar: { flex: 1, height: 4, borderRadius: 2 },
  stepName: { color: GOLD, fontSize: 15, fontWeight: "bold", marginTop: 8 },
  content: { padding: 20, gap: 4 },
  lead: { fontSize: 14, lineHeight: 20, marginBottom: 10 },
  field: { marginBottom: 12 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 6 },
  hint: { fontSize: 12, lineHeight: 17, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  inputMulti: { minHeight: 90, textAlignVertical: "top" },
  error: { color: "#C53030", fontSize: 13, marginVertical: 6 },
  primaryBtn: { backgroundColor: GOLD, borderRadius: 25, padding: 16, alignItems: "center", marginTop: 12 },
  primaryBtnText: { color: NAVY, fontSize: 16, fontWeight: "bold" },
  linkBtn: { alignItems: "center", padding: 12 },
  linkBtnText: { fontSize: 14, fontWeight: "600" },
  infoBox: { borderWidth: 1.5, borderRadius: 14, padding: 14, marginBottom: 14, backgroundColor: "#FBF6E9" },
  infoTitle: { color: NAVY, fontWeight: "bold", fontSize: 15, marginBottom: 4 },
  infoText: { color: "#4A5568", fontSize: 14, lineHeight: 20 },
  docCard: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 10 },
  docHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  docTitle: { flex: 1, fontSize: 15, fontWeight: "600" },
  docState: { fontSize: 12, fontWeight: "700" },
  preview: { width: "100%", height: 150, borderRadius: 10, marginTop: 10, backgroundColor: "#EEE" },
  docBtns: { flexDirection: "row", gap: 8, marginTop: 10 },
  docBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: GOLD, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 },
  docBtnLine: { backgroundColor: "transparent", borderWidth: 1, borderColor: GOLD },
  pdfRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10, padding: 10, borderRadius: 10, backgroundColor: "#F3EAD2" },
  pdfName: { flex: 1, color: NAVY, fontWeight: "600" },
  sheetBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  sheetTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },
  sheetRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 15, borderBottomWidth: 0.5 },
  sheetText: { fontSize: 16, fontWeight: "600" },
  sheetCancel: { alignItems: "center", paddingTop: 16 },
  sheetCancelText: { fontSize: 15, fontWeight: "600" },
  docBtnText: { color: NAVY, fontWeight: "bold", fontSize: 13 },
  doneCard: { borderWidth: 1.5, borderRadius: 18, padding: 22, alignItems: "center", marginTop: 8 },
  doneIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: GREEN, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  doneTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 6, textAlign: "center" },
  body: { fontSize: 14, lineHeight: 21 },
  freeNote: { flexDirection: "row", gap: 8, alignItems: "center", backgroundColor: "#EEF6EE", borderColor: "#B7DFC0", borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 14 },
  freeNoteText: { flex: 1, color: "#22543D", fontSize: 13, lineHeight: 18 },
  cameraScreen: { flex: 1, backgroundColor: "#000" },
  cameraTop: { paddingHorizontal: 20, paddingBottom: 14, backgroundColor: "rgba(0,0,0,0.45)" },
  cameraTitle: { color: "#fff", fontSize: 17, fontWeight: "bold" },
  cameraHint: { color: "#E2E8F0", fontSize: 13, marginTop: 4 },
  cameraBottom: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24 },
  cameraCancel: { width: 80, padding: 10 },
  cameraCancelText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  shutter: { width: 74, height: 74, borderRadius: 37, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", borderWidth: 4, borderColor: GOLD },
  shutterInner: { width: 54, height: 54, borderRadius: 27, backgroundColor: "#fff" },
})
