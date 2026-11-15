// Live "Next prayer" countdown on the lock screen and in the Dynamic Island (Premium).
// Started by the app (modules/adhan-alarm: startPrayerActivity) for the next prayer.
// The countdown runs by itself. At prayer time the card turns into "Maghrib · tap for the full Adhan".
// PrayerActivityAttributes must stay EXACTLY the same as in modules/adhan-alarm/ios/AdhanAlarmModule.swift.
import ActivityKit
import SwiftUI
import WidgetKit

private let laNavy = Color(red: 30 / 255, green: 58 / 255, blue: 95 / 255)
private let laGold = Color(red: 201 / 255, green: 168 / 255, blue: 76 / 255)

struct PrayerActivityAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    var prayer: String
    var at: Double
    var nextLabel: String
    var nowLabel: String
    var tapLabel: String
  }
  var city: String
}

private func prayerDate(_ state: PrayerActivityAttributes.ContentState) -> Date {
  Date(timeIntervalSince1970: state.at / 1000)
}

/// Countdown that never crashes when the time has already passed.
private func countdown(_ date: Date) -> some View {
  let start = min(Date(), date)
  return Text(timerInterval: start...date, countsDown: true).monospacedDigit()
}

struct PrayerLockView: View {
  let context: ActivityViewContext<PrayerActivityAttributes>

  var body: some View {
    let state = context.state
    let date = prayerDate(state)
    HStack(spacing: 14) {
      ZStack {
        Circle().fill(laGold.opacity(0.18)).frame(width: 46, height: 46)
        Image(systemName: "moon.stars.fill").font(.system(size: 22)).foregroundColor(laGold)
      }
      VStack(alignment: .leading, spacing: 2) {
        Text(context.isStale ? state.nowLabel.uppercased() : state.nextLabel.uppercased())
          .font(.system(size: 11, weight: .bold)).foregroundColor(laGold)
        Text(state.prayer).font(.system(size: 22, weight: .heavy)).foregroundColor(.white).lineLimit(1)
        if context.isStale {
          Text("▶ \(state.tapLabel)").font(.system(size: 13, weight: .semibold)).foregroundColor(.white.opacity(0.9)).lineLimit(1)
        } else if !context.attributes.city.isEmpty {
          Text(context.attributes.city).font(.system(size: 12)).foregroundColor(.white.opacity(0.6)).lineLimit(1)
        }
      }
      Spacer(minLength: 4)
      VStack(alignment: .trailing, spacing: 2) {
        Text(date, style: .time).font(.system(size: 15, weight: .semibold)).foregroundColor(.white.opacity(0.85))
        if !context.isStale {
          countdown(date).font(.system(size: 24, weight: .bold)).foregroundColor(laGold).multilineTextAlignment(.trailing)
        }
      }
    }
    .padding(16)
  }
}

struct PrayerLiveActivity: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: PrayerActivityAttributes.self) { context in
      PrayerLockView(context: context)
        .activityBackgroundTint(laNavy)
        .activitySystemActionForegroundColor(laGold)
        .widgetURL(URL(string: "umrahconnect://umrah?adhan=1"))
    } dynamicIsland: { context in
      let state = context.state
      let date = prayerDate(state)
      return DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          HStack(spacing: 6) {
            Image(systemName: "moon.stars.fill").foregroundColor(laGold)
            Text(state.prayer).font(.headline).foregroundColor(.white).lineLimit(1)
          }
        }
        DynamicIslandExpandedRegion(.trailing) {
          Text(date, style: .time).font(.headline).foregroundColor(.white)
        }
        DynamicIslandExpandedRegion(.bottom) {
          if context.isStale {
            Text("🕌 \(state.tapLabel)").font(.subheadline).foregroundColor(laGold)
          } else {
            HStack {
              Text(state.nextLabel).font(.subheadline).foregroundColor(.white.opacity(0.8))
              Spacer()
              countdown(date).font(.title3.bold()).foregroundColor(laGold)
            }
          }
        }
      } compactLeading: {
        Image(systemName: "moon.stars.fill").foregroundColor(laGold)
      } compactTrailing: {
        if context.isStale {
          Text(state.prayer).font(.caption2).foregroundColor(laGold).lineLimit(1)
        } else {
          countdown(date).font(.caption2.bold()).foregroundColor(laGold).frame(maxWidth: 52)
        }
      } minimal: {
        Image(systemName: "moon.stars.fill").foregroundColor(laGold)
      }
      .widgetURL(URL(string: "umrahconnect://umrah?adhan=1"))
      .keylineTint(laGold)
    }
  }
}
