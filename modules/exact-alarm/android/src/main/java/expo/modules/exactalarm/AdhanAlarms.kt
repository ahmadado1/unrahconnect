package expo.modules.exactalarm

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import org.json.JSONArray
import org.json.JSONObject

/**
 * Prayer-time alarms for the full Adhan (Android).
 * JS gives us the list of prayers (time, title, sound). We set one exact alarm per prayer.
 * The list is also saved, so the alarms come back after the phone restarts.
 */
object AdhanAlarms {
  private const val PREFS = "umrahconnect_adhan_alarms"
  private const val KEY_LIST = "alarms"
  const val EXTRA_JSON = "adhan_json"

  /** Replace every Adhan alarm with this list. Returns how many were set. */
  fun schedule(context: Context, json: String): Int {
    cancelAll(context)
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(KEY_LIST, json).apply()
    return setFromList(context, JSONArray(json))
  }

  /** After a restart / app update: put the saved alarms back (only the ones still in the future). */
  fun restore(context: Context): Int {
    val saved = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY_LIST, null) ?: return 0
    return try { setFromList(context, JSONArray(saved)) } catch (_: Exception) { 0 }
  }

  fun cancelAll(context: Context) {
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val saved = prefs.getString(KEY_LIST, null) ?: return
    val manager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    try {
      val list = JSONArray(saved)
      for (i in 0 until list.length()) {
        val item = list.getJSONObject(i)
        manager.cancel(pendingIntent(context, item))
      }
    } catch (_: Exception) {}
    prefs.edit().remove(KEY_LIST).apply()
  }

  private fun setFromList(context: Context, list: JSONArray): Int {
    val manager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    val now = System.currentTimeMillis()
    var count = 0
    for (i in 0 until list.length()) {
      val item = list.getJSONObject(i)
      val at = item.optLong("at", 0L)
      if (at <= now + 1000) continue
      val pi = pendingIntent(context, item)
      val exactAllowed = Build.VERSION.SDK_INT < Build.VERSION_CODES.S || manager.canScheduleExactAlarms()
      try {
        if (exactAllowed) {
          // An "alarm clock" alarm: Android never delays it (not in Doze, not for battery saving,
          // not for apps that were not opened for a while). It is the most reliable kind.
          manager.setAlarmClock(AlarmManager.AlarmClockInfo(at, showIntent(context)), pi)
        } else {
          // Without "Alarms & reminders" access Android may deliver it late (sometimes a lot).
          // The app asks the user to allow it; see promptAndroidExactAlarmIfNeeded in JS.
          manager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi)
        }
        count++
      } catch (e: Exception) {
        android.util.Log.w("AdhanAlarms", "Could not set alarm", e)
      }
    }
    return count
  }

  /** Tapping the alarm icon / "next alarm" on the lock screen opens the app. */
  private fun showIntent(context: Context): PendingIntent {
    val launch = context.packageManager.getLaunchIntentForPackage(context.packageName) ?: Intent()
    return PendingIntent.getActivity(context, 7860, launch, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }

  /** Same request code for the same prayer, so re-scheduling replaces instead of duplicating. */
  private fun pendingIntent(context: Context, item: JSONObject): PendingIntent {
    val intent = Intent(context, AdhanAlarmReceiver::class.java).apply {
      action = "expo.modules.exactalarm.ADHAN_ALARM"
      putExtra(EXTRA_JSON, item.toString())
    }
    val code = item.optString("id").hashCode()
    return PendingIntent.getBroadcast(context, code, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }
}
