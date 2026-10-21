// UmrahConnect prayer widget (Premium): next prayer, its time and a live countdown.
// Data comes from the app (App Group "group.com.umrahconnect.app", key "uc_prayer_widget"):
// { premium, city, prayers: [{ n: "Fajr", at: <ms> }], labels: { next, premium, open } }
import SwiftUI
import WidgetKit

private let groupId = "group.com.umrahconnect.app"
private let dataKey = "uc_prayer_widget"
private let navy = Color(red: 30 / 255, green: 58 / 255, blue: 95 / 255)
private let gold = Color(red: 201 / 255, green: 168 / 255, blue: 76 / 255)

struct PrayerItem: Codable, Hashable {
  let n: String
  let at: Double
  var date: Date { Date(timeIntervalSince1970: at / 1000) }
}

struct WidgetLabels: Codable {
  let next: String
  let premium: String
  let open: String
}

struct WidgetData: Codable {
  let premium: Bool
  let city: String?
  let prayers: [PrayerItem]
  let labels: WidgetLabels
}

func loadWidgetData() -> WidgetData? {
  guard let raw = UserDefaults(suiteName: groupId)?.string(forKey: dataKey),
        let bytes = raw.data(using: .utf8) else { return nil }
  return try? JSONDecoder().decode(WidgetData.self, from: bytes)
}

struct PrayerEntry: TimelineEntry {
  let date: Date
  let data: WidgetData?
  /// Next prayer after `date`
  var next: PrayerItem? { data?.prayers.first { $0.date > date } }
  /// The prayers of the same day as the next one (for the medium widget)
  var day: [PrayerItem] {
    guard let next = next, let all = data?.prayers else { return [] }
    let cal = Calendar.current
    return all.filter { cal.isDate($0.date, inSameDayAs: next.date) }
  }
}

struct Provider: TimelineProvider {
  func placeholder(in context: Context) -> PrayerEntry {
    let now = Date().timeIntervalSince1970 * 1000
    let sample = WidgetData(
      premium: true, city: "Makkah",
      prayers: [PrayerItem(n: "Asr", at: now + 3_600_000), PrayerItem(n: "Maghrib", at: now + 9_000_000)],
      labels: WidgetLabels(next: "Next prayer", premium: "UmrahConnect Premium", open: "Open UmrahConnect")
    )
    return PrayerEntry(date: Date(), data: sample)
  }

  func getSnapshot(in context: Context, completion: @escaping (PrayerEntry) -> Void) {
    completion(loadWidgetData().map { PrayerEntry(date: Date(), data: $0) } ?? placeholder(in: context))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<PrayerEntry>) -> Void) {
    let data = loadWidgetData()
    let now = Date()
    // One entry now and one at each coming prayer, so the widget moves on by itself.
    var entries = [PrayerEntry(date: now, data: data)]
    for p in (data?.prayers ?? []).filter({ $0.date > now }).prefix(12) {
      entries.append(PrayerEntry(date: p.date.addingTimeInterval(1), data: data))
    }
    let refresh = entries.last?.date ?? now.addingTimeInterval(3600)
    completion(Timeline(entries: entries, policy: .after(max(refresh, now.addingTimeInterval(1800)))))
  }
}

struct PrayerWidgetView: View {
  @Environment(\.widgetFamily) var family
  let entry: PrayerEntry

  var body: some View {
    Group {
      if let data = entry.data, data.premium, let next = entry.next {
        switch family {
        case .accessoryRectangular:
          VStack(alignment: .leading, spacing: 1) {
            Text(next.n).font(.headline)
            Text(next.date, style: .time).font(.caption)
            Text(next.date, style: .timer).font(.caption2).monospacedDigit()
          }
        case .accessoryInline:
          Text("\(next.n) ") + Text(next.date, style: .time)
        case .systemMedium:
          HStack(alignment: .top, spacing: 14) {
            nextBlock(data: data, next: next)
            Spacer(minLength: 0)
            VStack(alignment: .trailing, spacing: 3) {
              ForEach(entry.day, id: \.self) { p in
                HStack(spacing: 6) {
                  Text(p.n).font(.caption).foregroundColor(p == next ? gold : .white.opacity(0.85))
                  Text(p.date, style: .time).font(.caption).monospacedDigit()
                    .foregroundColor(p == next ? gold : .white.opacity(0.85))
                }
              }
            }
          }
        default:
          nextBlock(data: data, next: next)
        }
      } else {
        VStack(spacing: 6) {
          Image(systemName: "star.fill").foregroundColor(gold)
          Text(entry.data?.labels.premium ?? "UmrahConnect Premium")
            .font(.caption).bold().multilineTextAlignment(.center).foregroundColor(.white)
          Text(entry.data?.labels.open ?? "Open UmrahConnect")
            .font(.caption2).multilineTextAlignment(.center).foregroundColor(.white.opacity(0.75))
        }
      }
    }
    .widgetBackground(navy)
  }

  @ViewBuilder
  func nextBlock(data: WidgetData, next: PrayerItem) -> some View {
    VStack(alignment: .leading, spacing: 4) {
      Text(data.labels.next.uppercased()).font(.system(size: 10, weight: .bold)).foregroundColor(gold)
      Text(next.n).font(.system(size: 22, weight: .heavy)).foregroundColor(.white).minimumScaleFactor(0.6).lineLimit(1)
      Text(next.date, style: .time).font(.system(size: 15, weight: .semibold)).foregroundColor(.white.opacity(0.9))
      Text(next.date, style: .timer).font(.system(size: 18, weight: .bold)).monospacedDigit().foregroundColor(gold)
      if let city = data.city, !city.isEmpty {
        Text(city).font(.system(size: 10)).foregroundColor(.white.opacity(0.6)).lineLimit(1)
      }
    }
  }
}

extension View {
  @ViewBuilder
  func widgetBackground(_ color: Color) -> some View {
    if #available(iOS 17.0, *) {
      self.containerBackground(for: .widget) { color }
    } else {
      self.padding().background(color)
    }
  }
}

struct PrayerTimesWidget: Widget {
  let kind = "UmrahConnectPrayerWidget"
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: Provider()) { entry in
      PrayerWidgetView(entry: entry)
    }
    .configurationDisplayName("Prayer times")
    .description("Next prayer with a live countdown.")
    .supportedFamilies([.systemSmall, .systemMedium, .accessoryRectangular, .accessoryInline])
  }
}

@main
struct UmrahConnectWidgets: WidgetBundle {
  var body: some Widget {
    PrayerTimesWidget()
  }
}
