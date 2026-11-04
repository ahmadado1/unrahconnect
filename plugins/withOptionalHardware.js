// Marks camera, location and other hardware as optional on Android.
// Without this, the CAMERA and location permissions make Google Play hide
// the app from tablets, Chromebooks and TVs that lack that hardware.
const { withAndroidManifest } = require("expo/config-plugins")

const OPTIONAL = [
  "android.hardware.camera",
  "android.hardware.camera.any",
  "android.hardware.camera.autofocus",
  "android.hardware.camera.front",
  "android.hardware.camera.flash",
  "android.hardware.microphone",
  "android.hardware.location",
  "android.hardware.location.gps",
  "android.hardware.location.network",
  "android.hardware.telephony",
  "android.hardware.touchscreen",
  "android.hardware.wifi",
]

module.exports = function withOptionalHardware(config) {
  return withAndroidManifest(config, cfg => {
    const manifest = cfg.modResults.manifest
    manifest.$["xmlns:tools"] = manifest.$["xmlns:tools"] || "http://schemas.android.com/tools"
    const list = (manifest["uses-feature"] || []).filter(
      f => !OPTIONAL.includes(f.$["android:name"])
    )
    for (const name of OPTIONAL) {
      list.push({ $: { "android:name": name, "android:required": "false", "tools:replace": "android:required" } })
    }
    manifest["uses-feature"] = list
    return cfg
  })
}
