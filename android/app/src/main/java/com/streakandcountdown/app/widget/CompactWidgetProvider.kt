package com.streakandcountdown.app.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import com.streakandcountdown.app.R
import com.streakandcountdown.app.data.local.AppDatabase
import com.streakandcountdown.app.domain.StreakEngine
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.format.DateTimeFormatter

class CompactWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        val prefs = context.getSharedPreferences("widget_prefs", Context.MODE_PRIVATE)
        val db = AppDatabase.getDatabase(context)

        CoroutineScope(Dispatchers.IO).launch {
            for (appWidgetId in appWidgetIds) {
                val goalId = prefs.getString("widget_goal_$appWidgetId", null)
                updateCompactWidget(context, appWidgetManager, appWidgetId, goalId, db)
            }
        }
    }

    companion object {
        suspend fun updateCompactWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int,
            goalId: String?,
            db: AppDatabase
        ) {
            val views = RemoteViews(context.packageName, R.layout.widget_compact)

            if (goalId == null) {
                views.setTextViewText(R.id.widget_goal_name, "Tap to configure goal")
                views.setTextViewText(R.id.widget_countdown_text, "--")
                views.setTextViewText(R.id.widget_streak_text, "--")
                views.setTextViewText(R.id.btn_widget_checkin, "Setup")
                appWidgetManager.updateAppWidget(appWidgetId, views)
                return
            }

            val goal = db.goalDao().getGoalById(goalId) ?: return
            val checkIns = db.checkInDao().getCheckInsForGoal(goalId)
            val today = LocalDate.now()
            val metrics = StreakEngine.calculateMetrics(goal, checkIns, today)

            views.setTextViewText(R.id.widget_goal_name, goal.name)
            views.setTextViewText(R.id.widget_countdown_text, metrics.currentCountdown.displayText)
            views.setTextViewText(R.id.widget_streak_text, "\${metrics.currentStreak} day streak")

            val flagImmutable = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            if (metrics.isCheckedInToday) {
                views.setTextViewText(R.id.btn_widget_checkin, "Done")
                views.setInt(R.id.btn_widget_checkin, "setBackgroundResource", R.drawable.bg_widget_btn_checked)
                views.setOnClickPendingIntent(R.id.btn_widget_checkin, null)
            } else {
                views.setTextViewText(R.id.btn_widget_checkin, "Check In")
                views.setInt(R.id.btn_widget_checkin, "setBackgroundResource", R.drawable.bg_widget_btn_pending)

                val checkInIntent = Intent(context, WidgetCheckInReceiver::class.java).apply {
                    action = "com.streakandcountdown.app.ACTION_WIDGET_CHECKIN"
                    putExtra("EXTRA_GOAL_ID", goalId)
                    putExtra("EXTRA_WIDGET_ID", appWidgetId)
                    putExtra("EXTRA_LOCAL_DATE", today.format(DateTimeFormatter.ofPattern("yyyy-MM-dd")))
                }
                val checkInPendingIntent = PendingIntent.getBroadcast(
                    context,
                    appWidgetId,
                    checkInIntent,
                    flagImmutable
                )
                views.setOnClickPendingIntent(R.id.btn_widget_checkin, checkInPendingIntent)
            }

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}
