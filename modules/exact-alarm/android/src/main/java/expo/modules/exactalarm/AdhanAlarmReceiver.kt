package expo.modules.exactalarm

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import org.json.JSONObject

/** Wakes up at prayer time and starts the Adhan player. Also restores alarms after a restart. */
class AdhanAlarmReceiver : BroadcastReceiver() {
  companion object {
    private const val FALLBACK_ID = 7862
    /** Same limit as the player: later than this, show the prayer without the Adhan sound. */
    private const val LATE_LIMIT_MS = 10 * 60 * 1000L
  }

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
          // Allowed from an exact / alarm-clock alarm, even when the app is closed.
          ContextCompat.startForegroundService(context, service)
        } catch (e: Exception) {
          // Android 12+ blocks this when the alarm was not exact (no "Alarms & reminders" access).
          // Then show a normal notification that plays the Adhan as its sound, so prayer time is not missed.
          android.util.Log.w("AdhanAlarm", "Could not start the Adhan player, showing a notification", e)
          showFallback(context, json)
        }
      }
    }
  }

  private fun showFallback(context: Context, json: String) {
    try {
      val item = JSONObject(json)
      val title = item.optString("title", "Prayer time")
      val body = item.optString("body", "")
      val sound = item.optString("sound", "adhan_alafasy")
      val late = System.currentTimeMillis() - item.optLong("at", System.currentTimeMillis()) > LATE_LIMIT_MS
      val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

      var resId = context.resources.getIdentifier(sound, "raw", context.packageName)
      var soundName = sound
      if (resId == 0) {
        resId = context.resources.getIdentifier("adhan_alafasy", "raw", context.packageName)
        soundName = "adhan_alafasy"
      }
      // One channel per Adhan voice (Android fixes the sound per channel). Late = silent channel.
      val channelId = if (late || resId == 0) "adhan-fallback-silent" else "adhan-fallback-$soundName"
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && manager.getNotificationChannel(channelId) == null) {
        val channel = NotificationChannel(channelId, "Adhan (backup)", NotificationManager.IMPORTANCE_HIGH)
        if (late || resId == 0) {
          channel.setSound(null, null)
        } else {
          val uri = Uri.parse("android.resource://${context.packageName}/$resId")
          val attrs = AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_ALARM)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build()
          channel.setSound(uri, attrs)
        }
        manager.createNotificationChannel(channel)
      }

      val launch = context.packageManager.getLaunchIntentForPackage(context.packageName) ?: Intent()
      val open = PendingIntent.getActivity(context, 0, launch, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
      var icon = context.resources.getIdentifier("notification_icon", "drawable", context.packageName)
      if (icon == 0) icon = context.applicationInfo.icon
      val notification = NotificationCompat.Builder(context, channelId)
        .setSmallIcon(icon)
        .setContentTitle(title)
        .setContentText(body)
        .setContentIntent(open)
        .setAutoCancel(true)
        .setCategory(NotificationCompat.CATEGORY_ALARM)
        .setPriority(NotificationCompat.PRIORITY_MAX)
        .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
        .setColor(0xFF1E3A5F.toInt())
        .build()
      manager.notify(FALLBACK_ID, notification)
    } catch (e: Exception) {
      android.util.Log.w("AdhanAlarm", "Fallback notification failed", e)
    }
  }
}
