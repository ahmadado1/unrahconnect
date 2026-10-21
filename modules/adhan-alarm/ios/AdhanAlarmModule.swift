// Full Adhan on iPhone with AlarmKit (iOS 26+).
// At prayer time iOS shows a real alarm (like the Clock app): it plays the FULL Adhan
// on the lock screen, over other apps and even in silent mode, with a Stop button.
// On older iOS every function says "not available" and the app keeps the 30-second notification sound.
import ExpoModulesCore
import Foundation
#if canImport(WidgetKit)
import WidgetKit
#endif
#if canImport(AlarmKit)
import AlarmKit
import ActivityKit
import SwiftUI
#endif

#if canImport(AlarmKit)
@available(iOS 26.0, *)
nonisolated struct AdhanAlarmMetadata: AlarmMetadata {
  init() {}
}
#endif

private let idsKey = "umrahconnect_adhan_alarm_ids"

public class AdhanAlarmModule: Module {
  public func definition() -> ModuleDefinition {
    Name("AdhanAlarm")

    /// Prayer widget (home screen / lock screen): save the next prayers in the shared App Group
    /// and ask iOS to redraw the widget. json = { premium, city, prayers: [{ n, at }], labels }.
    Function("setPrayerWidgetData") { (json: String) -> Bool in
      guard let defaults = UserDefaults(suiteName: "group.com.umrahconnect.app") else { return false }
      defaults.set(json, forKey: "uc_prayer_widget")
      #if canImport(WidgetKit)
      if #available(iOS 14.0, *) {
        WidgetCenter.shared.reloadAllTimelines()
      }
      #endif
      return true
    }

    /// True on iOS 26+ (AlarmKit exists).
    Function("isAvailable") { () -> Bool in
      if #available(iOS 26.0, *) { return true }
      return false
    }

    /// Shows the iOS "allow alarms" prompt (only the first time). Returns true when allowed.
    AsyncFunction("requestPermission") { () async -> Bool in
      #if canImport(AlarmKit)
      if #available(iOS 26.0, *) {
        do {
          let state = try await AlarmManager.shared.requestAuthorization()
          return state == .authorized
        } catch {
          return false
        }
      }
      #endif
      return false
    }

    /// Replace all Adhan alarms. json = [{ "at": ms, "title": "Dhuhr", "sound": "adhan_alafasy_alarm" }] (sound = file name WITH .caf).
    /// Returns how many alarms were set.
    AsyncFunction("schedule") { (json: String) async -> Int in
      #if canImport(AlarmKit)
      if #available(iOS 26.0, *) {
        await AdhanAlarmModule.cancelSaved()
        guard
          let data = json.data(using: .utf8),
          let list = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]]
        else { return 0 }

        let now = Date().timeIntervalSince1970
        var saved: [String] = []
        for item in list {
          if let id = await AdhanAlarmModule.scheduleOne(item, now: now) {
            saved.append(id.uuidString)
          }
        }
        UserDefaults.standard.set(saved, forKey: idsKey)
        return saved.count
      }
      #endif
      return 0
    }

    /// Test button: one alarm in `seconds` with this sound. Does not touch the real prayer alarms.
    AsyncFunction("scheduleTest") { (json: String) async -> Bool in
      #if canImport(AlarmKit)
      if #available(iOS 26.0, *) {
        guard
          let data = json.data(using: .utf8),
          let item = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
        else { return false }
        return await AdhanAlarmModule.scheduleOne(item, now: Date().timeIntervalSince1970) != nil
      }
      #endif
      return false
    }

    /// Is this sound file really inside the app? (If not, iOS would play its default alarm tone.)
    Function("hasSound") { (name: String) -> Bool in
      return Bundle.main.url(forResource: name, withExtension: nil) != nil
    }

    // ─── Full Adhan in 30-second parts (notification sounds) ───
    // iPhone plays a notification sound only if it is under 30 seconds, from the app bundle
    // or from Library/Sounds. The app downloads the parts of the chosen Adhan voice and
    // installs them in Library/Sounds with these functions.

    /// Copy a downloaded file (file:// uri or path) into Library/Sounds as `name`. Returns true on success.
    Function("installSound") { (source: String, name: String) -> Bool in
      guard let dir = AdhanAlarmModule.soundsDir() else { return false }
      let src = source.hasPrefix("file://") ? (URL(string: source)?.path ?? source) : source
      let dest = dir.appendingPathComponent(name)
      let fm = FileManager.default
      do {
        if fm.fileExists(atPath: dest.path) { try fm.removeItem(at: dest) }
        try fm.copyItem(atPath: src, toPath: dest.path)
        return true
      } catch {
        print("[AdhanAlarm] installSound failed for \(name): \(error)")
        return false
      }
    }

    /// Is this sound in Library/Sounds or in the app bundle?
    Function("hasNotificationSound") { (name: String) -> Bool in
      if Bundle.main.url(forResource: name, withExtension: nil) != nil { return true }
      guard let dir = AdhanAlarmModule.soundsDir() else { return false }
      return FileManager.default.fileExists(atPath: dir.appendingPathComponent(name).path)
    }

    /// Delete installed sounds whose name starts with `prefix` (e.g. "uc_qassas_" when switching voice).
    Function("removeSounds") { (prefix: String) -> Int in
      guard let dir = AdhanAlarmModule.soundsDir() else { return 0 }
      let fm = FileManager.default
      let names = (try? fm.contentsOfDirectory(atPath: dir.path)) ?? []
      var removed = 0
      for name in names where name.hasPrefix(prefix) {
        if (try? fm.removeItem(at: dir.appendingPathComponent(name))) != nil { removed += 1 }
      }
      return removed
    }

    /// Remove every Adhan alarm we set (and stop one that is ringing).
    AsyncFunction("cancelAll") { () async -> Bool in
      #if canImport(AlarmKit)
      if #available(iOS 26.0, *) {
        await AdhanAlarmModule.cancelSaved()
        return true
      }
      #endif
      return false
    }
  }

  /// <app data>/Library/Sounds (created if missing).
  private static func soundsDir() -> URL? {
    let fm = FileManager.default
    guard let lib = fm.urls(for: .libraryDirectory, in: .userDomainMask).first else { return nil }
    let dir = lib.appendingPathComponent("Sounds", isDirectory: true)
    if !fm.fileExists(atPath: dir.path) {
      try? fm.createDirectory(at: dir, withIntermediateDirectories: true)
    }
    return dir
  }

  #if canImport(AlarmKit)
  /// Build and schedule one alarm from { at (ms), title, sound (file name WITH .caf), stop }.
  @available(iOS 26.0, *)
  private static func scheduleOne(_ item: [String: Any], now: TimeInterval) async -> UUID? {
    let atMs = (item["at"] as? Double) ?? Double((item["at"] as? Int) ?? 0)
    let at = atMs / 1000
    if at <= now + 5 { return nil }
    let title = (item["title"] as? String) ?? "Adhan"
    var sound = (item["sound"] as? String) ?? ""
    // Only use our Adhan if the file is really in the app; log it so a test shows the cause.
    if !sound.isEmpty && Bundle.main.url(forResource: sound, withExtension: nil) == nil {
      print("[AdhanAlarm] sound not found in app bundle: \(sound) — using the default alarm tone")
      sound = ""
    }

    let stopButton = AlarmButton(
      text: LocalizedStringResource(stringLiteral: (item["stop"] as? String) ?? "Stop"),
      textColor: .white,
      systemImageName: "stop.circle.fill"
    )
    let alert = AlarmPresentation.Alert(
      title: LocalizedStringResource(stringLiteral: title),
      stopButton: stopButton
    )
    let attributes = AlarmAttributes<AdhanAlarmMetadata>(
      presentation: AlarmPresentation(alert: alert),
      tintColor: Color(red: 201 / 255, green: 168 / 255, blue: 76 / 255)
    )
    let alertSound: ActivityKit.AlertConfiguration.AlertSound =
      sound.isEmpty ? .default : .named(sound)
    let configuration = AlarmManager.AlarmConfiguration(
      countdownDuration: Alarm.CountdownDuration(preAlert: nil, postAlert: nil),
      schedule: Alarm.Schedule.fixed(Date(timeIntervalSince1970: at)),
      attributes: attributes,
      sound: alertSound
    )
    do {
      let id = UUID()
      _ = try await AlarmManager.shared.schedule(id: id, configuration: configuration)
      return id
    } catch {
      print("[AdhanAlarm] schedule failed: \(error)")
      return nil
    }
  }

  @available(iOS 26.0, *)
  private static func cancelSaved() async {
    let manager = AlarmManager.shared
    let ids = (UserDefaults.standard.array(forKey: idsKey) as? [String]) ?? []
    let alarms = (try? manager.alarms) ?? []
    for raw in ids {
      guard let uuid = UUID(uuidString: raw) else { continue }
      let alarm = alarms.first { $0.id == uuid }
      if let alarm = alarm, case .alerting = alarm.state {
        try? manager.stop(id: uuid)
      } else if alarm != nil {
        try? manager.cancel(id: uuid)
      }
    }
    UserDefaults.standard.set([String](), forKey: idsKey)
  }
  #endif
}
