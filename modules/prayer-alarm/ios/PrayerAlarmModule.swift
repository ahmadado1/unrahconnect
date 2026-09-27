import ExpoModulesCore
import Foundation

public class PrayerAlarmModule: Module {
  public func definition() -> ModuleDefinition {
    Name("PrayerAlarm")

    Function("isSupported") { () -> Bool in
      if #available(iOS 26.0, *) {
        #if canImport(AlarmKit)
        return true
        #else
        return false
        #endif
      }
      return false
    }

    AsyncFunction("requestAuthorization") { () async -> String in
      guard #available(iOS 26.0, *) else { return "unavailable" }
      #if canImport(AlarmKit)
      return await PrayerAlarmScheduler.requestAuthorization()
      #else
      return "unavailable"
      #endif
    }

    AsyncFunction("scheduleAlarms") { (json: String) async -> Int in
      guard #available(iOS 26.0, *) else { return 0 }
      #if canImport(AlarmKit)
      guard
        let data = json.data(using: .utf8),
        let alarms = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]]
      else { return 0 }
      return await PrayerAlarmScheduler.schedule(alarms)
      #else
      return 0
      #endif
    }

    AsyncFunction("scheduleTest") { (prayerName: String, seconds: Int, soundName: String, title: String) async -> Bool in
      guard #available(iOS 26.0, *) else { return false }
      #if canImport(AlarmKit)
      return await PrayerAlarmScheduler.scheduleTest(
        prayerName: prayerName,
        seconds: seconds,
        soundName: soundName,
        title: title
      )
      #else
      return false
      #endif
    }

    Function("cancelAll") { () -> Void in
      guard #available(iOS 26.0, *) else { return }
      #if canImport(AlarmKit)
      PrayerAlarmScheduler.cancelAll()
      #endif
    }

    Function("consumePendingPrayer") { () -> String? in
      PrayerAlarmStore.consume()
    }
  }
}
