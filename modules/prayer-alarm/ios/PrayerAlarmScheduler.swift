import Foundation

#if canImport(AlarmKit)
import AlarmKit
import ActivityKit
import AppIntents
import SwiftUI

@available(iOS 26.0, *)
enum PrayerAlarmScheduler {
  private static let prayerIDs: [String: UUID] = [
    "Fajr": UUID(uuidString: "A11A0001-0000-4000-8000-000000000001")!,
    "Dhuhr": UUID(uuidString: "A11A0001-0000-4000-8000-000000000002")!,
    "Asr": UUID(uuidString: "A11A0001-0000-4000-8000-000000000003")!,
    "Maghrib": UUID(uuidString: "A11A0001-0000-4000-8000-000000000004")!,
    "Isha": UUID(uuidString: "A11A0001-0000-4000-8000-000000000005")!,
  ]
  private static let testID = UUID(uuidString: "A11A0001-0000-4000-8000-0000000000FF")!

  static func requestAuthorization() async -> String {
    switch AlarmManager.shared.authorizationState {
    case .authorized:
      return "authorized"
    case .denied:
      return "denied"
    case .notDetermined:
      do {
        let state = try await AlarmManager.shared.requestAuthorization()
        return state == .authorized ? "authorized" : "denied"
      } catch {
        return "denied"
      }
    @unknown default:
      return "denied"
    }
  }

  static func cancelAll() {
    for id in prayerIDs.values {
      try? AlarmManager.shared.cancel(id: id)
    }
    try? AlarmManager.shared.cancel(id: testID)
  }

  static func schedule(_ alarms: [[String: Any]]) async -> Int {
    var scheduled = 0
    for alarm in alarms {
      guard
        let prayerName = alarm["prayerName"] as? String,
        let hour = intValue(alarm["hour"]),
        let minute = intValue(alarm["minute"]),
        let id = prayerIDs[prayerName]
      else { continue }

      let title = (alarm["title"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines)
      let soundName = alarm["soundName"] as? String
      do {
        try await scheduleRepeating(
          id: id,
          prayerName: prayerName,
          title: (title?.isEmpty == false ? title! : prayerName),
          hour: hour,
          minute: minute,
          soundName: soundName
        )
        scheduled += 1
      } catch {
        NSLog("[PrayerAlarm] failed to schedule \(prayerName): \(error.localizedDescription)")
      }
    }
    return scheduled
  }

  static func scheduleTest(prayerName: String, seconds: Int, soundName: String?, title: String) async -> Bool {
    let fire = Date().addingTimeInterval(TimeInterval(max(seconds, 5)))
    do {
      try await scheduleFixed(
        id: testID,
        prayerName: prayerName,
        title: title,
        date: fire,
        soundName: soundName
      )
      return true
    } catch {
      NSLog("[PrayerAlarm] test alarm failed: \(error.localizedDescription)")
      return false
    }
  }

  private static func scheduleRepeating(
    id: UUID,
    prayerName: String,
    title: String,
    hour: Int,
    minute: Int,
    soundName: String?
  ) async throws {
    let time = Alarm.Schedule.Relative.Time(hour: hour, minute: minute)
    let days: [Locale.Weekday] = [
      .sunday, .monday, .tuesday, .wednesday, .thursday, .friday, .saturday,
    ]
    let relative = Alarm.Schedule.Relative(
      time: time,
      repeats: .weekly(days)
    )
    try await install(id: id, prayerName: prayerName, title: title, schedule: .relative(relative), soundName: soundName)
  }

  private static func scheduleFixed(
    id: UUID,
    prayerName: String,
    title: String,
    date: Date,
    soundName: String?
  ) async throws {
    try await install(id: id, prayerName: prayerName, title: title, schedule: .fixed(date), soundName: soundName)
  }

  private static func install(
    id: UUID,
    prayerName: String,
    title: String,
    schedule: Alarm.Schedule,
    soundName: String?
  ) async throws {
    try? AlarmManager.shared.cancel(id: id)

    let stopButton = AlarmButton(
      text: "Stop",
      textColor: .white,
      systemImageName: "stop.circle"
    )
    let openButton = AlarmButton(
      text: "Adhan",
      textColor: .white,
      systemImageName: "play.circle.fill"
    )
    let alert = AlarmPresentation.Alert(
      title: LocalizedStringResource(stringLiteral: title),
      stopButton: stopButton,
      secondaryButton: openButton,
      secondaryButtonBehavior: .custom
    )
    let attributes = AlarmAttributes<PrayerAlarmMetadata>(
      presentation: AlarmPresentation(alert: alert),
      metadata: PrayerAlarmMetadata(prayerName: prayerName),
      tintColor: Color(red: 30 / 255, green: 58 / 255, blue: 95 / 255)
    )
    let configuration = AlarmManager.AlarmConfiguration(
      countdownDuration: nil,
      schedule: schedule,
      attributes: attributes,
      stopIntent: nil,
      secondaryIntent: OpenPrayerAdhanIntent(prayerName: prayerName),
      sound: makeSound(soundName)
    )
    _ = try await AlarmManager.shared.schedule(id: id, configuration: configuration)
  }

  /// AlarmKit reads a short sound from the app bundle or Library/Sounds. The lock-screen wavs are already bundled.
  private static func makeSound(_ raw: String?) -> AlertConfiguration.AlertSound {
    let trimmed = raw?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
    guard !trimmed.isEmpty else { return .default }
    let base = (trimmed as NSString).deletingPathExtension
    let ext = (trimmed as NSString).pathExtension.isEmpty ? "wav" : (trimmed as NSString).pathExtension
    if let source = Bundle.main.url(forResource: base, withExtension: ext) {
      let soundsDir = FileManager.default
        .urls(for: .libraryDirectory, in: .userDomainMask)[0]
        .appendingPathComponent("Sounds", isDirectory: true)
      try? FileManager.default.createDirectory(at: soundsDir, withIntermediateDirectories: true)
      let dest = soundsDir.appendingPathComponent("\(base).\(ext)")
      if !FileManager.default.fileExists(atPath: dest.path) {
        try? FileManager.default.copyItem(at: source, to: dest)
      }
    }
    return .named(base)
  }

  private static func intValue(_ value: Any?) -> Int? {
    if let number = value as? Int { return number }
    if let number = value as? NSNumber { return number.intValue }
    if let number = value as? Double { return Int(number) }
    return nil
  }
}

@available(iOS 26.0, *)
struct PrayerAlarmMetadata: AlarmMetadata {
  let prayerName: String
}
#endif
