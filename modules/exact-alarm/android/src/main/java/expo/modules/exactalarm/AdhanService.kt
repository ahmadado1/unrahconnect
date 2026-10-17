package expo.modules.exactalarm

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.media.MediaPlayer
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import org.json.JSONObject

/**
 * Plays the full Adhan at prayer time, even with the screen locked or another app open.
 * Shows a notification "Dhuhr · Allahu Akbar" with a Stop button while it plays.
 * Respects the phone's silent / vibrate switch: then it only shows the notification.
 */
class AdhanService : Service() {
  companion object {
    const val ACTION_PLAY = "expo.modules.exactalarm.ADHAN_PLAY"
    const val ACTION_STOP = "expo.modules.exactalarm.ADHAN_STOP"
    private const val CHANNEL_ID = "adhan-player-v1"
    private const val NOTIFICATION_ID = 7861
    /** Max delay we still play the Adhan for (phone was asleep and the alarm came late). */
    private const val LATE_LIMIT_MS = 10 * 60 * 1000L

    @Volatile var isPlaying = false
      private set
  }

  private var player: MediaPlayer? = null
  private var focusRequest: AudioFocusRequest? = null
  private var title = ""
  private var body = ""

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent?.action == ACTION_STOP) {
      finish(showDone = true)
      return START_NOT_STICKY
    }
    val item = try { JSONObject(intent?.getStringExtra(AdhanAlarms.EXTRA_JSON) ?: "{}") } catch (_: Exception) { JSONObject() }
    title = item.optString("title", "Prayer time")
    body = item.optString("body", "")
    val sound = item.optString("sound", "adhan_alafasy")
    val at = item.optLong("at", System.currentTimeMillis())

    createChannel()
    val notification = buildNotification(playing = true)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK)
    } else {
      startForeground(NOTIFICATION_ID, notification)
    }

    val audio = getSystemService(Context.AUDIO_SERVICE) as AudioManager
    val tooLate = System.currentTimeMillis() - at > LATE_LIMIT_MS
    val silent = audio.ringerMode != AudioManager.RINGER_MODE_NORMAL
    if (tooLate || silent || !play(sound, audio)) {
      finish(showDone = true)
    }
    return START_NOT_STICKY
  }

  private fun play(sound: String, audio: AudioManager): Boolean {
    // Two prayers very close together: drop the old sound first.
    try { player?.release() } catch (_: Exception) {}
    player = null
    var resId = resources.getIdentifier(sound, "raw", packageName)
    if (resId == 0) resId = resources.getIdentifier("adhan_alafasy", "raw", packageName)
    if (resId == 0) return false
    return try {
      val attrs = AudioAttributes.Builder()
        .setUsage(AudioAttributes.USAGE_ALARM)
        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
        .build()
      // Pause music / videos from other apps while the Adhan plays.
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val request = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT).setAudioAttributes(attrs).build()
        focusRequest = request
        audio.requestAudioFocus(request)
      }
      val afd = resources.openRawResourceFd(resId)
      val mp = MediaPlayer()
      mp.setAudioAttributes(attrs)
      mp.setDataSource(afd.fileDescriptor, afd.startOffset, afd.length)
      afd.close()
      mp.setOnCompletionListener { finish(showDone = true) }
      mp.setOnErrorListener { _, _, _ -> finish(showDone = true); true }
      mp.prepare()
      mp.start()
      player = mp
      isPlaying = true
      true
    } catch (e: Exception) {
      android.util.Log.w("AdhanService", "Adhan failed", e)
      false
    }
  }

  /** Stop the sound, keep a plain notification (no Stop button) so the user still sees prayer time. */
  private fun finish(showDone: Boolean) {
    isPlaying = false
    try { player?.stop() } catch (_: Exception) {}
    try { player?.release() } catch (_: Exception) {}
    player = null
    val audio = getSystemService(Context.AUDIO_SERVICE) as AudioManager
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) focusRequest?.let { audio.abandonAudioFocusRequest(it) }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      stopForeground(STOP_FOREGROUND_DETACH)
    } else {
      @Suppress("DEPRECATION")
      stopForeground(false)
    }
    if (showDone && title.isNotEmpty()) {
      (getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).notify(NOTIFICATION_ID, buildNotification(playing = false))
    }
    stopSelf()
  }

  override fun onDestroy() {
    isPlaying = false
    try { player?.release() } catch (_: Exception) {}
    player = null
    super.onDestroy()
  }

  private fun createChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (manager.getNotificationChannel(CHANNEL_ID) != null) return
    // The channel itself is silent: the Adhan is played by this service, not as a notification sound.
    val channel = NotificationChannel(CHANNEL_ID, "Adhan", NotificationManager.IMPORTANCE_HIGH).apply {
      description = "Plays the full Adhan at prayer time, with a Stop button."
      setSound(null, null)
      enableVibration(false)
      lockscreenVisibility = Notification.VISIBILITY_PUBLIC
    }
    manager.createNotificationChannel(channel)
  }

  private fun buildNotification(playing: Boolean): Notification {
    val launch = packageManager.getLaunchIntentForPackage(packageName)?.apply {
      flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
    }
    val openApp = PendingIntent.getActivity(this, 0, launch ?: Intent(), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    var icon = resources.getIdentifier("notification_icon", "drawable", packageName)
    if (icon == 0) icon = applicationInfo.icon

    val builder = NotificationCompat.Builder(this, CHANNEL_ID)
      .setSmallIcon(icon)
      .setContentTitle(title)
      .setContentText(body)
      .setContentIntent(openApp)
      .setCategory(NotificationCompat.CATEGORY_ALARM)
      .setPriority(NotificationCompat.PRIORITY_MAX)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setColor(0xFF1E3A5F.toInt())
      .setAutoCancel(!playing)
      .setOngoing(playing)
    if (playing) {
      val stop = Intent(this, AdhanService::class.java).apply { action = ACTION_STOP }
      val stopPi = PendingIntent.getService(this, 1, stop, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
      builder.addAction(0, "Stop", stopPi)
      builder.setDeleteIntent(stopPi) // swiping it away also stops the Adhan
    }
    return builder.build()
  }
}
