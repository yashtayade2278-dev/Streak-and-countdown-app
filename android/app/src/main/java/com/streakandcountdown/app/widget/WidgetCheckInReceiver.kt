package com.streakandcountdown.app.widget

import android.appwidget.AppWidgetManager
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.Toast
import com.streakandcountdown.app.data.local.AppDatabase
import com.streakandcountdown.app.data.local.CheckInEntity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.UUID

class WidgetCheckInReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val goalId = intent.getStringExtra("EXTRA_GOAL_ID") ?: return
        val localDate = intent.getStringExtra("EXTRA_LOCAL_DATE")
            ?: LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"))

        val db = AppDatabase.getDatabase(context)
        val pendingResult = goAsync()

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val existing = db.checkInDao().getCheckInForDate(goalId, localDate)
                if (existing != null) {
                    CoroutineScope(Dispatchers.Main).launch {
                        Toast.makeText(context, "Already checked in today!", Toast.LENGTH_SHORT).show()
                    }
                    return@launch
                }

                val checkIn = CheckInEntity(
                    id = "ci_\${UUID.randomUUID()}",
                    goalId = goalId,
                    localDate = localDate,
                    timestamp = Instant.now().toString(),
                    note = "Checked in from Home Widget"
                )
                db.checkInDao().insertCheckIn(checkIn)

                val appWidgetManager = AppWidgetManager.getInstance(context)
                val compactIds = appWidgetManager.getAppWidgetIds(
                    ComponentName(context, CompactWidgetProvider::class.java)
                )
                val largeIds = appWidgetManager.getAppWidgetIds(
                    ComponentName(context, LargeWidgetProvider::class.java)
                )
                val prefs = context.getSharedPreferences("widget_prefs", Context.MODE_PRIVATE)

                for (id in compactIds) {
                    val gId = prefs.getString("widget_goal_$id", null)
                    CompactWidgetProvider.updateCompactWidget(context, appWidgetManager, id, gId, db)
                }

                for (id in largeIds) {
                    val gId = prefs.getString("widget_goal_$id", null)
                    LargeWidgetProvider.updateLargeWidget(context, appWidgetManager, id, gId, db)
                }

                CoroutineScope(Dispatchers.Main).launch {
                    Toast.makeText(context, "Check-in recorded!", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                CoroutineScope(Dispatchers.Main).launch {
                    Toast.makeText(context, "Check-in failed: \${e.localizedMessage}", Toast.LENGTH_SHORT).show()
                }
            } finally {
                pendingResult.finish()
            }
        }
    }
}
