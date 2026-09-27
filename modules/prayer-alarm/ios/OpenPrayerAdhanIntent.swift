import Foundation

#if canImport(AlarmKit) && canImport(AppIntents)
import AppIntents

/// Secondary alarm button. Opens UmrahConnect and leaves the prayer name for the full Adhan.
@available(iOS 26.0, *)
public struct OpenPrayerAdhanIntent: LiveActivityIntent {
  public static var title: LocalizedStringResource = "Play Adhan"
  public static var description = IntentDescription("Opens UmrahConnect and plays the Adhan")
  public static var openAppWhenRun = true

  @Parameter(title: "prayerName")
  public var prayerName: String

  public init(prayerName: String) {
    self.prayerName = prayerName
  }

  public init() {
    self.prayerName = ""
  }

  public func perform() async throws -> some IntentResult {
    PrayerAlarmStore.savePending(prayerName)
    return .result()
  }
}
#endif
