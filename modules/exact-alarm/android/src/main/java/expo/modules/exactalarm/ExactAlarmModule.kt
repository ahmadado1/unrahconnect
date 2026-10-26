package expo.modules.exactalarm

import android.app.AlarmManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExactAlarmModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExactAlarm")

    Function("canScheduleExactAlarms") {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
        return@Function true
      }
      val context = appContext.reactContext ?: return@Function false
      val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
      alarmManager.canScheduleExactAlarms()
    }

    // ─── Full Adhan player ───────────────────────────────────────────────
    /** json = [{ id, at (ms), title, body, sound (raw file name without .mp3) }]. Returns how many were set. */
    Function("scheduleAdhanAlarms") { json: String ->
      val context = appContext.reactContext ?: return@Function 0
      AdhanAlarms.schedule(context, json)
    }

    Function("cancelAdhanAlarms") {
      val context = appContext.reactContext ?: return@Function false
      AdhanAlarms.cancelAll(context)
      true
    }

    Function("stopAdhanPlayer") {
      val context = appContext.reactContext ?: return@Function false
      val stop = Intent(context, AdhanService::class.java).apply { action = AdhanService.ACTION_STOP }
      if (AdhanService.isPlaying) context.startService(stop)
      true
    }

    Function("isAdhanPlaying") {
      AdhanService.isPlaying
    }

    // ─── Prayer widget (home screen) ─────────────────────────────────────
    /** json = { premium, city, prayers: [{ n, at (ms) }], labels: { next, premium, open } } */
    Function("setPrayerWidgetData") { json: String ->
      val context = appContext.reactContext ?: return@Function false
      PrayerWidget.save(context, json)
      true
    }

    /** True when Android does not limit this app in the background (battery "Unrestricted"). */
    Function("isIgnoringBatteryOptimizations") {
      val context = appContext.reactContext ?: return@Function true
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return@Function true
      val pm = context.getSystemService(Context.POWER_SERVICE) as android.os.PowerManager
      pm.isIgnoringBatteryOptimizations(context.packageName)
    }

    /** Opens this app's settings page (Battery → Unrestricted lives there). */
    Function("openAppSettings") {
      val activity = appContext.currentActivity
      val context = activity ?: appContext.reactContext ?: return@Function false
      val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
        data = Uri.parse("package:${context.packageName}")
        if (activity == null) addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      context.startActivity(intent)
      true
    }

    Function("openExactAlarmSettings") {
      val activity = appContext.currentActivity
      val context = activity ?: appContext.reactContext ?: return@Function false
      val intent = Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM).apply {
        data = Uri.parse("package:${context.packageName}")
        if (activity == null) {
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
      }
      context.startActivity(intent)
      true
    }
  }
}
