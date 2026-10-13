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
import com.streakandcountdown.app.ui.MainActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.format.DateTimeFormatter

class LargeWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        val prefs = context.getSharedPreferences("widget_prefs", Context.MODE_PRIVATE)
        val db = AppDatabase.getDatabase(context)

        CoroutineScope(Dispatchers.IO).launch {
            appWidgetIds.forEach { appWidgetId ->
                val goalId = prefs.getString("widget_goal_$appWidgetId", null)
                updateLargeWidget(context, appWidgetManager, appWidgetId, goalId, db)
            }
        }
    }

    companion object {
        suspend fun updateLargeWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int,
            goalId: String?,
            db: AppDatabase
        ) {
            val views = RemoteViews(context.packageName, R.layout.widget_large)
            val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            val openAppIntent = Intent(context, MainActivity::class.java)
            val openAppPendingIntent = PendingIntent.getActivity(
                context,
                appWidgetId,
                openAppIntent,
                flags
            )

            views.setOnClickPendingIntent(R.id.widget_large_container, openAppPendingIntent)

            if (goalId == null) {
                views.setTextViewText(R.id.widget_large_goal_name, "Streak & Countdown")
                views.setTextViewText(R.id.widget_large_target_date, "")
                views.setTextViewText(R.id.widget_large_countdown_num, "--")
                views.setTextViewText(R.id.widget_large_countdown_label, "Open app to choose a goal")
                views.setTextViewText(R.id.widget_large_current_streak, "--")
                views.setTextViewText(R.id.widget_large_longest_streak, "--")
                views.setTextViewText(R.id.widget_large_last_checkin, "")
                views.setTextViewText(R.id.widget_large_missed_days, "--")
                views.setTextViewText(R.id.widget_large_countdown_change, "")
                views.setTextViewText(R.id.btn_widget_large_checkin, "Open App")
                views.setOnClickPendingIntent(R.id.btn_widget_large_checkin, openAppPendingIntent)
                appWidgetManager.updateAppWidget(appWidgetId, views)
                return
            }

            val goal = db.goalDao().getGoalById(goalId)
            if (goal == null) {
                views.setTextViewText(R.id.widget_large_goal_name, "Goal unavailable")
                views.setTextViewText(R.id.widget_large_countdown_num, "--")
                views.setTextViewText(R.id.widget_large_countdown_label, "Open app to update")
                views.setTextViewText(R.id.btn_widget_large_checkin, "Open App")
                views.setOnClickPendingIntent(R.id.btn_widget_large_checkin, openAppPendingIntent)
                appWidgetManager.updateAppWidget(appWidgetId, views)
                return
            }

            val checkIns = db.checkInDao().getCheckInsForGoal(goalId)
            val today = LocalDate.now()
            val metrics = StreakEngine.calculateMetrics(goal, checkIns, today)

            views.setTextViewText(R.id.widget_large_goal_name, goal.name)
            views.setTextViewText(R.id.widget_large_target_date, "Target: ${goal.targetDate}")
            views.setTextViewText(R.id.widget_large_countdown_num, metrics.currentCountdown.days.toString())
            views.setTextViewText(
                R.id.widget_large_countdown_label,
                if (metrics.currentCountdown.isToday) "Today"
                else if (metrics.currentCountdown.isOverdue) "Days Overdue"
                else "Days Remaining"
            )
            views.setTextViewText(R.id.widget_large_current_streak, "${metrics.currentStreak}d")
            views.setTextViewText(R.id.widget_large_longest_streak, "${metrics.longestStreak}d")
            views.setTextViewText(R.id.widget_large_last_checkin, metrics.lastCheckInDate ?: "None")
            views.setTextViewText(R.id.widget_large_missed_days, "${metrics.completedMissedDaysCount}")
            views.setTextViewText(R.id.widget_large_countdown_change, "")

            if (metrics.isCheckedInToday) {
                views.setTextViewText(R.id.btn_widget_large_checkin, "Checked In")
                views.setInt(R.id.btn_widget_large_checkin, "setBackgroundResource", R.drawable.bg_widget_btn_checked)
                views.setOnClickPendingIntent(R.id.btn_widget_large_checkin, openAppPendingIntent)
            } else {
                views.setTextViewText(R.id.btn_widget_large_checkin, "Check In")
                views.setInt(R.id.btn_widget_large_checkin, "setBackgroundResource", R.drawable.bg_widget_btn_pending)

                val checkInIntent = Intent(context, WidgetCheckInReceiver::class.java).apply {
                    action = "com.streakandcountdown.app.ACTION_WIDGET_CHECKIN"
                    putExtra("EXTRA_GOAL_ID", goalId)
                    putExtra("EXTRA_WIDGET_ID", appWidgetId)
                    putExtra("EXTRA_LOCAL_DATE", today.format(DateTimeFormatter.ISO_LOCAL_DATE))
                }

                val checkInPendingIntent = PendingIntent.getBroadcast(
                    context,
                    appWidgetId,
                    checkInIntent,
                    flags
                )
                views.setOnClickPendingIntent(R.id.btn_widget_large_checkin, checkInPendingIntent)
            }

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}
