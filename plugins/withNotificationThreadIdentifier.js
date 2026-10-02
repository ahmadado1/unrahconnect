const fs = require("fs")
const path = require("path")
const { withDangerousMod } = require("@expo/config-plugins")

const FIELD_ANCHOR = `  @Field
  var interruptionLevel: String?`

const FIELD_PATCH = `  @Field
  var interruptionLevel: String?
  @Field
  var threadIdentifier: String?`

const ASSIGN_ANCHOR = `    content.attachments = notificationAttachments
    if let interruptionLevel = interruptionLevel {`

const ASSIGN_PATCH = `    content.attachments = notificationAttachments
    if let threadIdentifier = threadIdentifier {
      content.threadIdentifier = threadIdentifier
    }
    if let interruptionLevel = interruptionLevel {`

function patchRecordsSwift(contents) {
  if (contents.includes("var threadIdentifier: String?")) return contents
  if (!contents.includes(FIELD_ANCHOR) || !contents.includes(ASSIGN_ANCHOR)) {
    throw new Error(
      "expo-notifications Records.swift no longer matches the threadIdentifier patch"
    )
  }
  return contents.replace(FIELD_ANCHOR, FIELD_PATCH).replace(ASSIGN_ANCHOR, ASSIGN_PATCH)
}

/** Lets JS set UNNotificationContent.threadIdentifier so Adhan pieces group on the lock screen. */
function withNotificationThreadIdentifier(config) {
  return withDangerousMod(config, [
    "ios",
    async config => {
      const file = path.join(
        config.modRequest.projectRoot,
        "node_modules/expo-notifications/ios/EXNotifications/Notifications/Records.swift"
      )
      const contents = await fs.promises.readFile(file, "utf8")
      await fs.promises.writeFile(file, patchRecordsSwift(contents))
      return config
    },
  ])
}

module.exports = withNotificationThreadIdentifier
