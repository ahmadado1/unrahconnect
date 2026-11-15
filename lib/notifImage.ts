// A picture (the Kaaba) on the iPhone prayer notification, so it stands out and invites a tap.
// iPhone MOVES the image file into its own storage when a notification is booked, so every
// notification needs its own copy, made right before booking.
import { Asset } from "expo-asset"
import * as FileSystem from "expo-file-system/legacy"
import { Platform } from "react-native"

const DIR = `${FileSystem.documentDirectory}notif-img/`
let sourceUri: string | null = null

async function source() {
  if (sourceUri) return sourceUri
  const asset = Asset.fromModule(require("../assets/images/notif-adhan.jpg"))
  await asset.downloadAsync()
  sourceUri = asset.localUri ?? asset.uri
  return sourceUri
}

/** Attachment for one notification (iPhone only). Null when it could not be made: the notification still goes out. */
export async function adhanImageAttachment(id: string) {
  if (Platform.OS !== "ios") return null
  try {
    const from = await source()
    if (!from) return null
    await FileSystem.makeDirectoryAsync(DIR, { intermediates: true }).catch(() => {})
    const to = `${DIR}${id.replace(/[^\w-]/g, "_")}.jpg`
    await FileSystem.deleteAsync(to, { idempotent: true }).catch(() => {})
    await FileSystem.copyAsync({ from, to })
    return [{ identifier: "adhan-image", url: to, type: "public.jpeg", typeHint: "public.jpeg" }]
  } catch {
    return null
  }
}
