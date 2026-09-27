import Foundation

enum PrayerAlarmStore {
  static let pendingKey = "umrahconnect.pendingPrayerAlarm"

  static func savePending(_ prayerName: String) {
    let trimmed = prayerName.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmed.isEmpty else { return }
    UserDefaults.standard.set(trimmed, forKey: pendingKey)
  }

  static func consume() -> String? {
    let name = UserDefaults.standard.string(forKey: pendingKey)
    if name != nil {
      UserDefaults.standard.removeObject(forKey: pendingKey)
    }
    return name
  }
}
