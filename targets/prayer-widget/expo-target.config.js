// iPhone home-screen / lock-screen widget: next prayer with a live countdown (Premium).
// The app writes the next prayers into the shared App Group; the widget reads them.
/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = () => ({
  type: "widget",
  name: "PrayerWidget",
  displayName: "Prayer times",
  bundleIdentifier: ".prayerwidget",
  icon: "../../assets/images/icon.png",
  colors: {
    $accent: "#C9A84C",
    $widgetBackground: "#1E3A5F",
  },
  frameworks: ["SwiftUI", "WidgetKit"],
  deploymentTarget: "17.0",
  entitlements: {
    "com.apple.security.application-groups": ["group.com.umrahconnect.app"],
  },
})
