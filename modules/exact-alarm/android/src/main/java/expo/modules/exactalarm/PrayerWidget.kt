package expo.modules.exactalarm

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.SystemClock
import android.view.View
import android.widget.RemoteViews
import org.json.JSONObject
import java.text.DateFormat
import java.util.Date

/**
 * Home-screen prayer widget (Premium): next prayer, its time and a live countdown.
 * The app saves the next prayers with save(); the widget redraws itself at each prayer time.
 */
class PrayerWidget : AppWidgetProvider() {
  override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {
    render(context, manager, ids)
  }

  override fun onReceive(context: Context, intent: Intent) {
    super.onReceive(context, intent)
    if (intent.action == ACTION_REFRESH) refreshAll(context)
  }

  companion object {
    private const val PREFS = "uc_prayer_widget"
    private const val KEY = "data"
    const val ACTION_REFRESH = "expo.modules.exactalarm.PRAYER_WIDGET_REFRESH"

    fun save(context: Context, json: String) {
      context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(KEY, json).apply()
      refreshAll(context)
    }

    fun refreshAll(context: Context) {
      val manager = AppWidgetManager.getInstance(context)
      val ids = manager.getAppWidgetIds(ComponentName(context, PrayerWidget::class.java))
      if (ids.isNotEmpty()) render(context, manager, ids)
    }

    private fun render(context: Context, manager: AppWidgetManager, ids: IntArray) {
      val raw = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY, null)
      val now = System.currentTimeMillis()
      var name = ""
      var at = 0L
      var premium = false
      var nextLabel = "Next prayer"
      var premiumLabel = "UmrahConnect Premium"
      var openLabel = "Open UmrahConnect"
      var city = ""
      try {
        if (raw != null) {
          val json = JSONObject(raw)
          premium = json.optBoolean("premium", false)
          city = json.optString("city", "")
          json.optJSONObject("labels")?.let {
            nextLabel = it.optString("next", nextLabel)
            premiumLabel = it.optString("premium", premiumLabel)
            openLabel = it.optString("open", openLabel)
          }
          val prayers = json.optJSONArray("prayers")
          if (prayers != null) {
            for (i in 0 until prayers.length()) {
              val p = prayers.getJSONObject(i)
              val t = p.optLong("at", 0L)
              if (t > now) {
                name = p.optString("n", "")
                at = t
                break
              }
            }
          }
        }
      } catch (_: Exception) {}

      val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)
      val open = launch?.let {
        PendingIntent.getActivity(context, 0, it, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
      }

      for (id in ids) {
        val views = RemoteViews(context.packageName, R.layout.uc_prayer_widget)
        if (open != null) views.setOnClickPendingIntent(R.id.uc_widget_root, open)
        if (premium && at > 0) {
          views.setViewVisibility(R.id.uc_widget_prayer, View.VISIBLE)
          views.setViewVisibility(R.id.uc_widget_locked, View.GONE)
          views.setTextViewText(R.id.uc_widget_label, nextLabel.uppercase())
          views.setTextViewText(R.id.uc_widget_name, name)
          views.setTextViewText(R.id.uc_widget_time, DateFormat.getTimeInstance(DateFormat.SHORT).format(Date(at)))
          views.setTextViewText(R.id.uc_widget_city, city)
          // Live countdown to the prayer (Chronometer counting down).
          views.setChronometer(R.id.uc_widget_countdown, SystemClock.elapsedRealtime() + (at - now), null, true)
          views.setChronometerCountDown(R.id.uc_widget_countdown, true)
        } else {
          views.setViewVisibility(R.id.uc_widget_prayer, View.GONE)
          views.setViewVisibility(R.id.uc_widget_locked, View.VISIBLE)
          views.setTextViewText(R.id.uc_widget_locked_title, premiumLabel)
          views.setTextViewText(R.id.uc_widget_locked_sub, openLabel)
        }
        manager.updateAppWidget(id, views)
      }
      if (at > 0) scheduleRefresh(context, at + 1000)
    }

    /** Redraw just after the next prayer, so the widget moves on to the following one. */
    private fun scheduleRefresh(context: Context, at: Long) {
      val alarm = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
      val intent = Intent(context, PrayerWidget::class.java).apply { action = ACTION_REFRESH }
      val pending = PendingIntent.getBroadcast(context, 7001, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
      // Inexact is fine (a few minutes late at most); no special permission needed.
      alarm.set(AlarmManager.RTC, at, pending)
    }
  }
}
