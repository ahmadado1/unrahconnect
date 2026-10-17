package expo.modules.exactalarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.content.ContextCompat

/** Wakes up at prayer time and starts the Adhan player. Also restores alarms after a restart. */
class AdhanAlarmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    when (intent.action) {
      Intent.ACTION_BOOT_COMPLETED, Intent.ACTION_MY_PACKAGE_REPLACED, "android.intent.action.QUICKBOOT_POWERON" -> {
        AdhanAlarms.restore(context)
      }
      "expo.modules.exactalarm.ADHAN_ALARM" -> {
        val json = intent.getStringExtra(AdhanAlarms.EXTRA_JSON) ?: return
        val service = Intent(context, AdhanService::class.java).apply {
          action = AdhanService.ACTION_PLAY
          putExtra(AdhanAlarms.EXTRA_JSON, json)
        }
        try {
          // Allowed from an exact alarm, even when the app is closed.
          ContextCompat.startForegroundService(context, service)
        } catch (e: Exception) {
          android.util.Log.w("AdhanAlarm", "Could not start the Adhan player", e)
        }
      }
    }
  }
}
