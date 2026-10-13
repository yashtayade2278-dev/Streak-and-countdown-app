package com.streakandcountdown.app

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import com.streakandcountdown.app.data.local.AppDatabase

class StreakCountdownApp : Application() {

    val database: AppDatabase by lazy { AppDatabase.getDatabase(this) }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_REMINDERS,
                "Goal Check-in Reminders",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Daily alerts when a goal check-in is pending"
                enableVibration(true)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    companion object {
        const val CHANNEL_REMINDERS = "reminders_channel"
    }
}
