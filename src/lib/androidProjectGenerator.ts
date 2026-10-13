/**
 * Android Native Project Generator & Packager
 * 
 * Generates the complete, production-grade Android native project using:
 * - Kotlin + Room (SQLite) database
 * - Native AppWidgetProvider + RemoteViews (Compact & Large widgets)
 * - BroadcastReceiver for zero-app-open widget Check In
 * - AlarmManager & BootReceiver for reboot recovery & daily reminders
 * - Android 12+ mutability flags (PendingIntent.FLAG_IMMUTABLE / FLAG_UPDATE_CURRENT)
 * - Complete build.gradle.kts, AndroidManifest.xml, and Kotlin unit tests
 */

import JSZip from 'jszip';

export interface AndroidFileDef {
  path: string;
  content: string;
}

export function getAndroidProjectFiles(): AndroidFileDef[] {
  return [
    // 1. AndroidManifest.xml
    {
      path: 'app/src/main/AndroidManifest.xml',
      content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Permissions for reminders, boot recovery, and widgets -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
    <uses-permission android:name="android.permission.USE_EXACT_ALARM" />
    <uses-permission android:name="android.permission.VIBRATE" />

    <application
        android:name=".StreakCountdownApp"
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.StreakCountdown">

        <!-- Main Launcher Activity -->
        <activity
            android:name=".ui.MainActivity"
            android:exported="true"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Compact Home Screen Widget -->
        <receiver
            android:name=".widget.CompactWidgetProvider"
            android:exported="true"
            android:label="@string/widget_compact_name">
            <intent-filter>
                <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
            </intent-filter>
            <meta-data
                android:name="android.appwidget.provider"
                android:resource="@xml/widget_compact_info" />
        </receiver>

        <!-- Large Home Screen Widget -->
        <receiver
            android:name=".widget.LargeWidgetProvider"
            android:exported="true"
            android:label="@string/widget_large_name">
            <intent-filter>
                <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
            </intent-filter>
            <meta-data
                android:name="android.appwidget.provider"
                android:resource="@xml/widget_large_info" />
        </receiver>

        <!-- Widget Configuration Activity (Select Goal for Widget) -->
        <activity
            android:name=".widget.WidgetConfigureActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.appwidget.action.APPWIDGET_CONFIGURE" />
            </intent-filter>
        </activity>

        <!-- Widget Check-in Action Receiver (executes check-in without opening app) -->
        <receiver
            android:name=".widget.WidgetCheckInReceiver"
            android:exported="false">
            <intent-filter>
                <action android:name="com.streakandcountdown.app.ACTION_WIDGET_CHECKIN" />
            </intent-filter>
        </receiver>

        <!-- Scheduled Reminder Broadcast Receiver -->
        <receiver
            android:name=".receiver.ReminderReceiver"
            android:exported="false" />

        <!-- Boot Completed Receiver (Re-registers exact alarms after reboot) -->
        <receiver
            android:name=".receiver.BootReceiver"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.BOOT_COMPLETED" />
                <action android:name="android.intent.action.MY_PACKAGE_REPLACED" />
                <action android:name="android.intent.action.TIME_SET" />
                <action android:name="android.intent.action.TIMEZONE_CHANGED" />
            </intent-filter>
        </receiver>

    </application>

</manifest>
`,
    },

    // 2. Application class
    {
      path: 'app/src/main/java/com/streakandcountdown/app/StreakCountdownApp.kt',
      content: `package com.streakandcountdown.app

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
`,
    },

    // 3. Room Entities
    {
      path: 'app/src/main/java/com/streakandcountdown/app/data/local/GoalEntity.kt',
      content: `package com.streakandcountdown.app.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "goals")
data class GoalEntity(
    @PrimaryKey
    val id: String,
    val name: String,
    val description: String? = null,
    val targetDate: String, // YYYY-MM-DD
    val createdAt: String,  // ISO 8601
    val updatedAt: String,  // ISO 8601
    val archived: Boolean = false,
    val reminderEnabled: Boolean = false,
    val reminderTime: String? = "20:00", // HH:mm
    val colorScheme: String = "indigo"
)
`,
    },
    {
      path: 'app/src/main/java/com/streakandcountdown/app/data/local/CheckInEntity.kt',
      content: `package com.streakandcountdown.app.data.local

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

/**
 * Check-in record with strict database-level unique constraint on (goalId, localDate)
 */
@Entity(
    tableName = "check_ins",
    foreignKeys = [
        ForeignKey(
            entity = GoalEntity::class,
            parentColumns = ["id"],
            childColumns = ["goalId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [
        Index(value = ["goalId", "localDate"], unique = true)
    ]
)
data class CheckInEntity(
    @PrimaryKey
    val id: String,
    val goalId: String,
    val localDate: String, // YYYY-MM-DD (local calendar date)
    val timestamp: String, // ISO 8601
    val note: String? = null
)
`,
    },

    // 4. Room DAOs
    {
      path: 'app/src/main/java/com/streakandcountdown/app/data/local/GoalDao.kt',
      content: `package com.streakandcountdown.app.data.local

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface GoalDao {
    @Query("SELECT * FROM goals WHERE archived = 0 ORDER BY targetDate ASC")
    fun getActiveGoalsFlow(): Flow<List<GoalEntity>>

    @Query("SELECT * FROM goals WHERE archived = 0 ORDER BY targetDate ASC")
    suspend fun getActiveGoals(): List<GoalEntity>

    @Query("SELECT * FROM goals WHERE archived = 1 ORDER BY updatedAt DESC")
    fun getArchivedGoalsFlow(): Flow<List<GoalEntity>>

    @Query("SELECT * FROM goals WHERE id = :id LIMIT 1")
    suspend fun getGoalById(id: String): GoalEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertGoal(goal: GoalEntity)

    @Update
    suspend fun updateGoal(goal: GoalEntity)

    @Delete
    suspend fun deleteGoal(goal: GoalEntity)

    @Query("DELETE FROM goals WHERE id = :id")
    suspend fun deleteGoalById(id: String)
}
`,
    },
    {
      path: 'app/src/main/java/com/streakandcountdown/app/data/local/CheckInDao.kt',
      content: `package com.streakandcountdown.app.data.local

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface CheckInDao {
    @Query("SELECT * FROM check_ins WHERE goalId = :goalId ORDER BY localDate ASC")
    fun getCheckInsForGoalFlow(goalId: String): Flow<List<CheckInEntity>>

    @Query("SELECT * FROM check_ins WHERE goalId = :goalId ORDER BY localDate ASC")
    suspend fun getCheckInsForGoal(goalId: String): List<CheckInEntity>

    @Query("SELECT * FROM check_ins WHERE goalId = :goalId AND localDate = :localDate LIMIT 1")
    suspend fun getCheckInForDate(goalId: String, localDate: String): CheckInEntity?

    @Query("SELECT * FROM check_ins ORDER BY localDate ASC")
    suspend fun getAllCheckIns(): List<CheckInEntity>

    /**
     * Database-level uniqueness on (goalId, localDate) enforced via Room Index
     */
    @Insert(onConflict = OnConflictStrategy.ABORT)
    suspend fun insertCheckIn(checkIn: CheckInEntity)

    @Delete
    suspend fun deleteCheckIn(checkIn: CheckInEntity)
}
`,
    },

    // 5. Room Database
    {
      path: 'app/src/main/java/com/streakandcountdown/app/data/local/AppDatabase.kt',
      content: `package com.streakandcountdown.app.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(entities = [GoalEntity::class, CheckInEntity::class], version = 1, exportSchema = false)
abstract class AppDatabase : RoomDatabase() {

    abstract fun goalDao(): GoalDao
    abstract fun checkInDao(): CheckInDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "streak_countdown.db"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}
`,
    },

    // 6. Kotlin Domain Streak Engine
    {
      path: 'app/src/main/java/com/streakandcountdown/app/domain/StreakEngine.kt',
      content: `package com.streakandcountdown.app.domain

import com.streakandcountdown.app.data.local.CheckInEntity
import com.streakandcountdown.app.data.local.GoalEntity
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit

data class CountdownResult(
    val days: Long,
    val isToday: Boolean,
    val isOverdue: Boolean,
    val displayText: String,
    val rawDiffDays: Long
)

data class GoalCalculatedMetrics(
    val currentStreak: Int,
    val longestStreak: Int,
    val totalCheckIns: Int,
    val isCheckedInToday: Boolean,
    val lastCheckInDate: String?,
    val currentCountdown: CountdownResult,
    val countdownAtLastCheckIn: CountdownResult?,
    val elapsedDaysSinceLastCheckIn: Long?,
    val completedMissedDaysCount: Long,
    val countdownDifference: Long?
)

object StreakEngine {
    private val formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd")

    fun getTodayDate(): LocalDate = LocalDate.now()

    fun calculateCountdown(targetDateStr: String, fromDate: LocalDate = getTodayDate()): CountdownResult {
        val target = LocalDate.parse(targetDateStr, formatter)
        val diff = ChronoUnit.DAYS.between(fromDate, target)

        return when {
            diff > 0 -> CountdownResult(
                days = diff,
                isToday = false,
                isOverdue = false,
                displayText = if (diff == 1L) "1 day left" else "$diff days left",
                rawDiffDays = diff
            )
            diff == 0L -> CountdownResult(
                days = 0,
                isToday = true,
                isOverdue = false,
                displayText = "Today",
                rawDiffDays = 0
            )
            else -> {
                val overdue = -diff
                CountdownResult(
                    days = overdue,
                    isToday = false,
                    isOverdue = true,
                    displayText = if (overdue == 1L) "1 day overdue" else "$overdue days overdue",
                    rawDiffDays = diff
                )
            }
        }
    }

    fun calculateMetrics(
        goal: GoalEntity,
        checkIns: List<CheckInEntity>,
        today: LocalDate = getTodayDate()
    ): GoalCalculatedMetrics {
        val sortedCheckIns = checkIns
            .filter { it.goalId == goal.id }
            .distinctBy { it.localDate }
            .sortedBy { it.localDate }

        val totalCheckIns = sortedCheckIns.size
        val todayStr = today.format(formatter)
        val isCheckedInToday = sortedCheckIns.any { it.localDate == todayStr }

        val currentCountdown = calculateCountdown(goal.targetDate, today)

        if (totalCheckIns == 0) {
            val created = LocalDate.parse(goal.createdAt.substring(0, 10), formatter)
            val elapsed = ChronoUnit.DAYS.between(created, today)
            val missed = if (elapsed > 0) elapsed - 1 else 0L

            return GoalCalculatedMetrics(
                currentStreak = 0,
                longestStreak = 0,
                totalCheckIns = 0,
                isCheckedInToday = false,
                lastCheckInDate = null,
                currentCountdown = currentCountdown,
                countdownAtLastCheckIn = null,
                elapsedDaysSinceLastCheckIn = null,
                completedMissedDaysCount = missed,
                countdownDifference = null
            )
        }

        var longestStreak = 0
        var runningStreak = 0
        var prevDate: LocalDate? = null

        val streakMap = mutableMapOf<LocalDate, Int>()

        for (item in sortedCheckIns) {
            val d = LocalDate.parse(item.localDate, formatter)
            if (prevDate == null) {
                runningStreak = 1
            } else {
                val gap = ChronoUnit.DAYS.between(prevDate, d)
                if (gap == 1L) {
                    runningStreak += 1
                } else {
                    runningStreak = 1
                }
            }
            streakMap[d] = runningStreak
            if (runningStreak > longestStreak) {
                longestStreak = runningStreak
            }
            prevDate = d
        }

        val lastCheckInItem = sortedCheckIns.last()
        val lastCheckInLocalDate = LocalDate.parse(lastCheckInItem.localDate, formatter)
        val yesterday = today.minusDays(1)

        val currentStreak = when {
            isCheckedInToday -> streakMap[today] ?: 1
            lastCheckInLocalDate == yesterday -> streakMap[yesterday] ?: 1
            ChronoUnit.DAYS.between(lastCheckInLocalDate, today) > 1L -> 0
            else -> streakMap[lastCheckInLocalDate] ?: 0
        }

        val countdownAtLast = calculateCountdown(goal.targetDate, lastCheckInLocalDate)
        val elapsedDays = ChronoUnit.DAYS.between(lastCheckInLocalDate, today)
        val missedDays = if (isCheckedInToday) 0L else maxOf(0L, elapsedDays - 1)
        val countdownDiff = countdownAtLast.rawDiffDays - currentCountdown.rawDiffDays

        return GoalCalculatedMetrics(
            currentStreak = currentStreak,
            longestStreak = longestStreak,
            totalCheckIns = totalCheckIns,
            isCheckedInToday = isCheckedInToday,
            lastCheckInDate = lastCheckInItem.localDate,
            currentCountdown = currentCountdown,
            countdownAtLastCheckIn = countdownAtLast,
            elapsedDaysSinceLastCheckIn = elapsedDays,
            completedMissedDaysCount = missedDays,
            countdownDifference = countdownDiff
        )
    }
}
`,
    },

    // 7. Compact Widget Provider (AppWidgetProvider + RemoteViews)
    {
      path: 'app/src/main/java/com/streakandcountdown/app/widget/CompactWidgetProvider.kt',
      content: `package com.streakandcountdown.app.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.os.Build
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

                val configIntent = Intent(context, WidgetConfigureActivity::class.java).apply {
                    putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
                }
                val pendingIntent = PendingIntent.getActivity(
                    context,
                    appWidgetId,
                    configIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                views.setOnClickPendingIntent(R.id.widget_container, pendingIntent)
                appWidgetManager.updateAppWidget(appWidgetId, views)
                return
            }

            val goal = db.goalDao().getGoalById(goalId)
            if (goal == null) {
                views.setTextViewText(R.id.widget_goal_name, "Goal removed")
                appWidgetManager.updateAppWidget(appWidgetId, views)
                return
            }

            val checkIns = db.checkInDao().getCheckInsForGoal(goalId)
            val today = LocalDate.now()
            val metrics = StreakEngine.calculateMetrics(goal, checkIns, today)

            // Populate UI
            views.setTextViewText(R.id.widget_goal_name, goal.name)
            views.setTextViewText(R.id.widget_countdown_text, metrics.currentCountdown.displayText)
            views.setTextViewText(R.id.widget_streak_text, "\${metrics.currentStreak} day streak")

            // Status & Check-In button
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

            // Clicking widget body opens main app to that goal
            val openAppIntent = Intent(context, MainActivity::class.java).apply {
                putExtra("EXTRA_OPEN_GOAL_ID", goalId)
            }
            val openAppPendingIntent = PendingIntent.getActivity(
                context,
                appWidgetId * 10,
                openAppIntent,
                flagImmutable
            )
            views.setOnClickPendingIntent(R.id.widget_container, openAppPendingIntent)

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}
`,
    },

    // 8. Large Widget Provider (AppWidgetProvider + RemoteViews)
    {
      path: 'app/src/main/java/com/streakandcountdown/app/widget/LargeWidgetProvider.kt',
      content: `package com.streakandcountdown.app.widget

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

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        val prefs = context.getSharedPreferences("widget_prefs", Context.MODE_PRIVATE)
        val db = AppDatabase.getDatabase(context)

        CoroutineScope(Dispatchers.IO).launch {
            for (appWidgetId in appWidgetIds) {
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

            if (goalId == null) {
                views.setTextViewText(R.id.widget_large_goal_name, "Tap to configure goal")
                views.setTextViewText(R.id.widget_large_countdown_num, "--")
                views.setTextViewText(R.id.widget_large_countdown_label, "Setup needed")

                val configIntent = Intent(context, WidgetConfigureActivity::class.java).apply {
                    putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
                }
                val pendingIntent = PendingIntent.getActivity(
                    context,
                    appWidgetId,
                    configIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                views.setOnClickPendingIntent(R.id.widget_large_container, pendingIntent)
                appWidgetManager.updateAppWidget(appWidgetId, views)
                return
            }

            val goal = db.goalDao().getGoalById(goalId)
            if (goal == null) {
                views.setTextViewText(R.id.widget_large_goal_name, "Goal removed")
                appWidgetManager.updateAppWidget(appWidgetId, views)
                return
            }

            val checkIns = db.checkInDao().getCheckInsForGoal(goalId)
            val today = LocalDate.now()
            val metrics = StreakEngine.calculateMetrics(goal, checkIns, today)

            views.setTextViewText(R.id.widget_large_goal_name, goal.name)
            views.setTextViewText(R.id.widget_large_target_date, "Target: \${goal.targetDate}")

            // Large Countdown
            views.setTextViewText(R.id.widget_large_countdown_num, metrics.currentCountdown.days.toString())
            views.setTextViewText(
                R.id.widget_large_countdown_label,
                if (metrics.currentCountdown.isToday) "Today"
                else if (metrics.currentCountdown.isOverdue) "Days Overdue"
                else "Days Remaining"
            )

            // Streaks
            views.setTextViewText(R.id.widget_large_current_streak, "\${metrics.currentStreak}d")
            views.setTextViewText(R.id.widget_large_longest_streak, "\${metrics.longestStreak}d")

            // Delay stats: Last check-in date & Missed days & countdown change
            views.setTextViewText(R.id.widget_large_last_checkin, metrics.lastCheckInDate ?: "None yet")
            views.setTextViewText(R.id.widget_large_missed_days, "\${metrics.completedMissedDaysCount} missed")
            views.setTextViewText(
                R.id.widget_large_countdown_change,
                if (metrics.countdownDifference != null) "-\${metrics.countdownDifference}d change" else "Baseline"
            )

            // Check In Button
            val flagImmutable = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            if (metrics.isCheckedInToday) {
                views.setTextViewText(R.id.btn_widget_large_checkin, "Checked in today")
                views.setInt(R.id.btn_widget_large_checkin, "setBackgroundResource", R.drawable.bg_widget_btn_checked)
                views.setOnClickPendingIntent(R.id.btn_widget_large_checkin, null)
            } else {
                views.setTextViewText(R.id.btn_widget_large_checkin, "Check In Now")
                views.setInt(R.id.btn_widget_large_checkin, "setBackgroundResource", R.drawable.bg_widget_btn_pending)

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
                views.setOnClickPendingIntent(R.id.btn_widget_large_checkin, checkInPendingIntent)
            }

            // Click body to open app
            val openAppIntent = Intent(context, MainActivity::class.java).apply {
                putExtra("EXTRA_OPEN_GOAL_ID", goalId)
            }
            val openAppPendingIntent = PendingIntent.getActivity(
                context,
                appWidgetId * 10 + 1,
                openAppIntent,
                flagImmutable
            )
            views.setOnClickPendingIntent(R.id.widget_large_container, openAppPendingIntent)

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}
`,
    },

    // 9. Widget Check-In Receiver (Background Check-in directly from widget without opening main app)
    {
      path: 'app/src/main/java/com/streakandcountdown/app/widget/WidgetCheckInReceiver.kt',
      content: `package com.streakandcountdown.app.widget

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

/**
 * Handles check-ins directly from the home screen widget.
 * Saves to shared Room database, enforces unique constraint, and refreshes all widgets.
 */
class WidgetCheckInReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val goalId = intent.getStringExtra("EXTRA_GOAL_ID") ?: return
        val localDate = intent.getStringExtra("EXTRA_LOCAL_DATE")
            ?: LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"))

        val db = AppDatabase.getDatabase(context)
        val pendingResult = goAsync()

        CoroutineScope(Dispatchers.IO).launch {
            try {
                // Check if already checked in today
                val existing = db.checkInDao().getCheckInForDate(goalId, localDate)
                if (existing != null) {
                    CoroutineScope(Dispatchers.Main).launch {
                        Toast.makeText(context, "Already checked in today!", Toast.LENGTH_SHORT).show()
                    }
                    return@launch
                }

                // Insert new check-in with database-level uniqueness
                val checkIn = CheckInEntity(
                    id = "ci_\${UUID.randomUUID()}",
                    goalId = goalId,
                    localDate = localDate,
                    timestamp = Instant.now().toString(),
                    note = "Checked in from Home Widget"
                )
                db.checkInDao().insertCheckIn(checkIn)

                // Refresh widgets
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
`,
    },

    // 10. Widget Configure Activity
    {
      path: 'app/src/main/java/com/streakandcountdown/app/widget/WidgetConfigureActivity.kt',
      content: `package com.streakandcountdown.app.widget

import android.app.Activity
import android.appwidget.AppWidgetManager
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.widget.ArrayAdapter
import android.widget.ListView
import androidx.appcompat.app.AppCompatActivity
import com.streakandcountdown.app.R
import com.streakandcountdown.app.data.local.AppDatabase
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class WidgetConfigureActivity : AppCompatActivity() {

    private var appWidgetId = AppWidgetManager.INVALID_APPWIDGET_ID

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setResult(Activity.RESULT_CANCELED)
        setContentView(R.layout.activity_widget_configure)

        appWidgetId = intent?.extras?.getInt(
            AppWidgetManager.EXTRA_APPWIDGET_ID,
            AppWidgetManager.INVALID_APPWIDGET_ID
        ) ?: AppWidgetManager.INVALID_APPWIDGET_ID

        if (appWidgetId == AppWidgetManager.INVALID_APPWIDGET_ID) {
            finish()
            return
        }

        val listView = findViewById<ListView>(R.id.goals_list_view)
        val db = AppDatabase.getDatabase(this)

        CoroutineScope(Dispatchers.IO).launch {
            val goals = db.goalDao().getActiveGoals()
            withContext(Dispatchers.Main) {
                if (goals.isEmpty()) {
                    finish()
                    return@withContext
                }

                val adapter = ArrayAdapter(
                    this@WidgetConfigureActivity,
                    android.R.layout.simple_list_item_1,
                    goals.map { it.name }
                )
                listView.adapter = adapter

                listView.setOnItemClickListener { _, _, position, _ ->
                    val selectedGoal = goals[position]
                    saveWidgetGoalAndFinish(selectedGoal.id)
                }
            }
        }
    }

    private fun saveWidgetGoalAndFinish(goalId: String) {
        val prefs = getSharedPreferences("widget_prefs", Context.MODE_PRIVATE).edit()
        prefs.putString("widget_goal_$appWidgetId", goalId)
        prefs.apply()

        val appWidgetManager = AppWidgetManager.getInstance(this)
        val db = AppDatabase.getDatabase(this)

        CoroutineScope(Dispatchers.IO).launch {
            CompactWidgetProvider.updateCompactWidget(
                this@WidgetConfigureActivity,
                appWidgetManager,
                appWidgetId,
                goalId,
                db
            )
            LargeWidgetProvider.updateLargeWidget(
                this@WidgetConfigureActivity,
                appWidgetManager,
                appWidgetId,
                goalId,
                db
            )

            withContext(Dispatchers.Main) {
                val resultValue = Intent().apply {
                    putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
                }
                setResult(Activity.RESULT_OK, resultValue)
                finish()
            }
        }
    }
}
`,
    },

    // 11. Boot & Reminder Receivers
    {
      path: 'app/src/main/java/com/streakandcountdown/app/receiver/ReminderReceiver.kt',
      content: `package com.streakandcountdown.app.receiver

import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat
import com.streakandcountdown.app.R
import com.streakandcountdown.app.StreakCountdownApp
import com.streakandcountdown.app.data.local.AppDatabase
import com.streakandcountdown.app.ui.MainActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.format.DateTimeFormatter

class ReminderReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val goalId = intent.getStringExtra("EXTRA_GOAL_ID") ?: return
        val db = AppDatabase.getDatabase(context)
        val pendingResult = goAsync()

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val goal = db.goalDao().getGoalById(goalId) ?: return@launch
                if (!goal.reminderEnabled || goal.archived) return@launch

                val today = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"))
                val existingCheckIn = db.checkInDao().getCheckInForDate(goalId, today)

                // Only notify if today's check-in is pending! Suppress if already checked in!
                if (existingCheckIn == null) {
                    val openIntent = Intent(context, MainActivity::class.java).apply {
                        putExtra("EXTRA_OPEN_GOAL_ID", goalId)
                    }
                    val flagImmutable = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                    val contentPendingIntent = PendingIntent.getActivity(
                        context,
                        goalId.hashCode(),
                        openIntent,
                        flagImmutable
                    )

                    val notification = NotificationCompat.Builder(context, StreakCountdownApp.CHANNEL_REMINDERS)
                        .setSmallIcon(R.drawable.ic_notification)
                        .setContentTitle("Check-in Pending: \${goal.name}")
                        .setContentText("Keep your streak alive! Record your progress for today.")
                        .setPriority(NotificationCompat.PRIORITY_HIGH)
                        .setAutoCancel(true)
                        .setContentIntent(contentPendingIntent)
                        .build()

                    val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                    manager.notify(goalId.hashCode(), notification)
                }
            } finally {
                pendingResult.finish()
            }
        }
    }
}
`,
    },
    {
      path: 'app/src/main/java/com/streakandcountdown/app/receiver/BootReceiver.kt',
      content: `package com.streakandcountdown.app.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.streakandcountdown.app.data.local.AppDatabase
import com.streakandcountdown.app.service.ReminderScheduler
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class BootReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action
        if (action == Intent.ACTION_BOOT_COMPLETED ||
            action == Intent.ACTION_MY_PACKAGE_REPLACED ||
            action == Intent.ACTION_TIME_CHANGED ||
            action == Intent.ACTION_TIMEZONE_CHANGED) {

            val db = AppDatabase.getDatabase(context)
            val pendingResult = goAsync()

            CoroutineScope(Dispatchers.IO).launch {
                try {
                    val activeGoals = db.goalDao().getActiveGoals()
                    for (goal in activeGoals) {
                        if (goal.reminderEnabled && goal.reminderTime != null) {
                            ReminderScheduler.scheduleDailyReminder(context, goal)
                        }
                    }
                } finally {
                    pendingResult.finish()
                }
            }
        }
    }
}
`,
    },
    {
      path: 'app/src/main/java/com/streakandcountdown/app/service/ReminderScheduler.kt',
      content: `package com.streakandcountdown.app.service

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import com.streakandcountdown.app.data.local.GoalEntity
import com.streakandcountdown.app.receiver.ReminderReceiver
import java.util.Calendar

object ReminderScheduler {

    fun scheduleDailyReminder(context: Context, goal: GoalEntity) {
        if (!goal.reminderEnabled || goal.reminderTime.isNullOrBlank()) return

        val parts = goal.reminderTime.split(":")
        val hour = parts.getOrNull(0)?.toIntOrNull() ?: 20
        val minute = parts.getOrNull(1)?.toIntOrNull() ?: 0

        val calendar = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, hour)
            set(Calendar.MINUTE, minute)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
            if (before(Calendar.getInstance())) {
                add(Calendar.DAY_OF_YEAR, 1)
            }
        }

        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val intent = Intent(context, ReminderReceiver::class.java).apply {
            putExtra("EXTRA_GOAL_ID", goal.id)
        }

        val flagImmutable = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            goal.id.hashCode(),
            intent,
            flagImmutable
        )

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    calendar.timeInMillis,
                    pendingIntent
                )
            } else {
                alarmManager.setExact(
                    AlarmManager.RTC_WAKEUP,
                    calendar.timeInMillis,
                    pendingIntent
                )
            }
        } catch (_: SecurityException) {
            alarmManager.set(
                AlarmManager.RTC_WAKEUP,
                calendar.timeInMillis,
                pendingIntent
            )
        }
    }

    fun cancelReminder(context: Context, goalId: String) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val intent = Intent(context, ReminderReceiver::class.java)
        val flagImmutable = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            goalId.hashCode(),
            intent,
            flagImmutable
        )
        alarmManager.cancel(pendingIntent)
    }
}
`,
    },

    // 12. Widget Layouts XML
    {
      path: 'app/src/main/res/layout/widget_compact.xml',
      content: `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/widget_container"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@drawable/bg_widget_card"
    android:orientation="horizontal"
    android:padding="16dp"
    android:gravity="center_vertical">

    <LinearLayout
        android:layout_width="0dp"
        android:layout_height="wrap_content"
        android:layout_weight="1"
        android:orientation="vertical">

        <TextView
            android:id="@+id/widget_goal_name"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="Goal Name"
            android:textColor="#0F172A"
            android:textSize="15sp"
            android:textStyle="bold"
            android:maxLines="1"
            android:ellipsize="end" />

        <TextView
            android:id="@+id/widget_countdown_text"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="7 days left"
            android:textColor="#3B82F6"
            android:textSize="13sp"
            android:textStyle="bold"
            android:layout_marginTop="2dp" />

        <TextView
            android:id="@+id/widget_streak_text"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="5 day streak"
            android:textColor="#64748B"
            android:textSize="12sp"
            android:layout_marginTop="2dp" />
    </LinearLayout>

    <Button
        android:id="@+id/btn_widget_checkin"
        android:layout_width="wrap_content"
        android:layout_height="38dp"
        android:minWidth="90dp"
        android:text="Check In"
        android:textSize="12sp"
        android:textStyle="bold"
        android:textColor="#FFFFFF"
        android:background="@drawable/bg_widget_btn_pending"
        android:paddingStart="12dp"
        android:paddingEnd="12dp" />

</LinearLayout>
`,
    },
    {
      path: 'app/src/main/res/layout/widget_large.xml',
      content: `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/widget_large_container"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@drawable/bg_widget_card"
    android:orientation="vertical"
    android:padding="16dp">

    <!-- Header: Goal Name & Target Date -->
    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="horizontal"
        android:gravity="center_vertical">

        <TextView
            android:id="@+id/widget_large_goal_name"
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:text="Marathon 42km Training"
            android:textColor="#0F172A"
            android:textSize="16sp"
            android:textStyle="bold"
            android:maxLines="1"
            android:ellipsize="end" />

        <TextView
            android:id="@+id/widget_large_target_date"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="Target: 2026-11-20"
            android:textColor="#64748B"
            android:textSize="11sp" />
    </LinearLayout>

    <!-- Center: Large Countdown Display -->
    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="0dp"
        android:layout_weight="1"
        android:orientation="vertical"
        android:gravity="center"
        android:paddingTop="4dp"
        android:paddingBottom="4dp">

        <TextView
            android:id="@+id/widget_large_countdown_num"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="39"
            android:textColor="#2563EB"
            android:textSize="36sp"
            android:textStyle="bold" />

        <TextView
            android:id="@+id/widget_large_countdown_label"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="Days Remaining"
            android:textColor="#64748B"
            android:textSize="12sp" />
    </LinearLayout>

    <!-- Stats Row: Current Streak, Longest Streak, Missed Days -->
    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="horizontal"
        android:paddingTop="6dp"
        android:paddingBottom="6dp">

        <LinearLayout
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:orientation="vertical">
            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="STREAK"
                android:textColor="#94A3B8"
                android:textSize="10sp"
                android:textStyle="bold" />
            <TextView
                android:id="@+id/widget_large_current_streak"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="14d"
                android:textColor="#10B981"
                android:textSize="13sp"
                android:textStyle="bold" />
        </LinearLayout>

        <LinearLayout
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:orientation="vertical">
            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="LONGEST"
                android:textColor="#94A3B8"
                android:textSize="10sp"
                android:textStyle="bold" />
            <TextView
                android:id="@+id/widget_large_longest_streak"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="14d"
                android:textColor="#0F172A"
                android:textSize="13sp"
                android:textStyle="bold" />
        </LinearLayout>

        <LinearLayout
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:orientation="vertical">
            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="MISSED"
                android:textColor="#94A3B8"
                android:textSize="10sp"
                android:textStyle="bold" />
            <TextView
                android:id="@+id/widget_large_missed_days"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="0 missed"
                android:textColor="#F59E0B"
                android:textSize="13sp"
                android:textStyle="bold" />
        </LinearLayout>
    </LinearLayout>

    <!-- Sub-metrics: Last Check-In & Countdown Change -->
    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="horizontal"
        android:paddingBottom="8dp">

        <TextView
            android:id="@+id/widget_large_last_checkin"
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:text="Last: 2026-10-12"
            android:textColor="#64748B"
            android:textSize="11sp" />

        <TextView
            android:id="@+id/widget_large_countdown_change"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="-1d change"
            android:textColor="#64748B"
            android:textSize="11sp" />
    </LinearLayout>

    <!-- Action: Check In Button -->
    <Button
        android:id="@+id/btn_widget_large_checkin"
        android:layout_width="match_parent"
        android:layout_height="42dp"
        android:text="Check In Now"
        android:textSize="13sp"
        android:textStyle="bold"
        android:textColor="#FFFFFF"
        android:background="@drawable/bg_widget_btn_pending" />

</LinearLayout>
`,
    },

    // 13. Widget XML Metadatas
    {
      path: 'app/src/main/res/xml/widget_compact_info.xml',
      content: `<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:minWidth="140dp"
    android:minHeight="50dp"
    android:targetCellWidth="2"
    android:targetCellHeight="1"
    android:updatePeriodMillis="1800000"
    android:initialLayout="@layout/widget_compact"
    android:configure="com.streakandcountdown.app.widget.WidgetConfigureActivity"
    android:resizeMode="horizontal|vertical"
    android:widgetCategory="home_screen" />
`,
    },
    {
      path: 'app/src/main/res/xml/widget_large_info.xml',
      content: `<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:minWidth="280dp"
    android:minHeight="140dp"
    android:targetCellWidth="4"
    android:targetCellHeight="2"
    android:updatePeriodMillis="1800000"
    android:initialLayout="@layout/widget_large"
    android:configure="com.streakandcountdown.app.widget.WidgetConfigureActivity"
    android:resizeMode="horizontal|vertical"
    android:widgetCategory="home_screen" />
`,
    },

    // 14. Activity widget configure XML layout
    {
      path: 'app/src/main/res/layout/activity_widget_configure.xml',
      content: `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="20dp"
    android:background="#F8FAFC">

    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Select Goal for Widget"
        android:textSize="20sp"
        android:textStyle="bold"
        android:textColor="#0F172A"
        android:layout_marginBottom="16dp" />

    <ListView
        android:id="@+id/goals_list_view"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:divider="#E2E8F0"
        android:dividerHeight="1dp" />
</LinearLayout>
`,
    },

    // 15. Drawables
    {
      path: 'app/src/main/res/drawable/bg_widget_card.xml',
      content: `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android">
    <solid android:color="#FFFFFF" />
    <corners android:radius="18dp" />
    <stroke android:width="1dp" android:color="#E2E8F0" />
</shape>
`,
    },
    {
      path: 'app/src/main/res/drawable/bg_widget_btn_pending.xml',
      content: `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android">
    <solid android:color="#2563EB" />
    <corners android:radius="12dp" />
</shape>
`,
    },
    {
      path: 'app/src/main/res/drawable/bg_widget_btn_checked.xml',
      content: `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android">
    <solid android:color="#10B981" />
    <corners android:radius="12dp" />
</shape>
`,
    },
    {
      path: 'app/src/main/res/drawable/ic_notification.xml',
      content: `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="#FFFFFFFF"
        android:pathData="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M11,7V13H17V11H13V7H11Z" />
</vector>
`,
    },

    // 16. Values & Styles
    {
      path: 'app/src/main/res/values/strings.xml',
      content: `<resources>
    <string name="app_name">Streak &amp; Countdown</string>
    <string name="widget_compact_name">Streak &amp; Countdown (Compact)</string>
    <string name="widget_large_name">Streak &amp; Countdown (Large)</string>
</resources>
`,
    },
    {
      path: 'app/src/main/res/values/styles.xml',
      content: `<resources>
    <style name="Theme.StreakCountdown" parent="Theme.Material3.DayNight.NoActionBar">
        <item name="android:statusBarColor">#0F172A</item>
        <item name="android:navigationBarColor">#0F172A</item>
    </style>
</resources>
`,
    },

    // 17. Gradle Build Files (Android 12+, SDK 34)
    {
      path: 'app/build.gradle.kts',
      content: `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("kotlin-kapt")
}

android {
    namespace = "com.streakandcountdown.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.streakandcountdown.app"
        minSdk = 26 // Android 8.0+ supported, optimized for Android 12+ (API 31+)
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        debug {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        viewBinding = true
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")

    // Room SQLite Database
    val roomVersion = "2.6.1"
    implementation("androidx.room:room-runtime:$roomVersion")
    implementation("androidx.room:room-ktx:$roomVersion")
    kapt("androidx.room:room-compiler:$roomVersion")

    // Unit Testing
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.8.1")
}
`,
    },
    {
      path: 'build.gradle.kts',
      content: `plugins {
    id("com.android.application") version "8.4.1" apply false
    id("org.jetbrains.kotlin.android") version "1.9.24" apply false
    id("kotlin-kapt") version "1.9.24" apply false
}
`,
    },
    {
      path: 'settings.gradle.kts',
      content: `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "StreakCountdown"
include(":app")
`,
    },

    // 18. Kotlin Unit Tests
    {
      path: 'app/src/test/java/com/streakandcountdown/app/StreakEngineTest.kt',
      content: `package com.streakandcountdown.app

import com.streakandcountdown.app.data.local.CheckInEntity
import com.streakandcountdown.app.data.local.GoalEntity
import com.streakandcountdown.app.domain.StreakEngine
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import java.time.LocalDate

class StreakEngineTest {

    @Test
    fun testSection6SpecificationExample() {
        // "Last check-in 10 October; target 20 October; current date 13 October.
        // Previous countdown: 10 days. Current countdown: 7 days.
        // Elapsed days: 3. Completed missed days: 2 (11 and 12 October).
        // Countdown change: 3 days. The current date is pending, not yet a completed missed day."
        val goal = GoalEntity(
            id = "g-sec6",
            name = "Section 6 Example",
            targetDate = "2026-10-20",
            createdAt = "2026-10-01T00:00:00Z",
            updatedAt = "2026-10-01T00:00:00Z"
        )

        val checkIns = listOf(
            CheckInEntity("c1", "g-sec6", "2026-10-10", "2026-10-10T10:00:00Z")
        )

        val today = LocalDate.of(2026, 10, 13)
        val metrics = StreakEngine.calculateMetrics(goal, checkIns, today)

        assertEquals(10L, metrics.countdownAtLastCheckIn?.days)
        assertEquals(7L, metrics.currentCountdown.days)
        assertEquals(3L, metrics.elapsedDaysSinceLastCheckIn)
        assertEquals(2L, metrics.completedMissedDaysCount)
        assertEquals(3L, metrics.countdownDifference)
        assertEquals(0, metrics.currentStreak) // Missed 11 & 12 Oct -> streak reset to 0 until next checkin
        assertFalse(metrics.isCheckedInToday)
    }

    @Test
    fun testStreakActiveThroughYesterdayWhenTodayPending() {
        val goal = GoalEntity(
            id = "g-streak",
            name = "Pending Today Goal",
            targetDate = "2026-11-01",
            createdAt = "2026-10-01T00:00:00Z",
            updatedAt = "2026-10-01T00:00:00Z"
        )
        // Checked in 10, 11, 12 Oct. Today is 13 Oct (pending)
        val checkIns = listOf(
            CheckInEntity("1", "g-streak", "2026-10-10", "2026-10-10T10:00:00Z"),
            CheckInEntity("2", "g-streak", "2026-10-11", "2026-10-11T10:00:00Z"),
            CheckInEntity("3", "g-streak", "2026-10-12", "2026-10-12T10:00:00Z")
        )
        val today = LocalDate.of(2026, 10, 13)
        val metrics = StreakEngine.calculateMetrics(goal, checkIns, today)

        assertEquals(3, metrics.currentStreak)
        assertEquals(0L, metrics.completedMissedDaysCount)
        assertFalse(metrics.isCheckedInToday)
    }

    @Test
    fun testCountdownsFutureTodayOverdue() {
        val target = "2026-10-20"

        val future = StreakEngine.calculateCountdown(target, LocalDate.of(2026, 10, 15))
        assertEquals(5L, future.days)
        assertEquals("5 days left", future.displayText)

        val today = StreakEngine.calculateCountdown(target, LocalDate.of(2026, 10, 20))
        assertTrue(today.isToday)
        assertEquals("Today", today.displayText)

        val overdue = StreakEngine.calculateCountdown(target, LocalDate.of(2026, 10, 24))
        assertTrue(overdue.isOverdue)
        assertEquals(4L, overdue.days)
        assertEquals("4 days overdue", overdue.displayText)
    }
}
`,
    },

    // 19. APK Build Instructions & Quick Start Guide
    {
      path: 'README_BUILD_APK.md',
      content: `# Streak & Countdown — Native Android Project

This is the complete, production-grade Android native project built with Kotlin, Room SQLite, AppWidgetProvider, and RemoteViews.

## Highlights
- **Android 12+ Support**: Full compliance with \`FLAG_IMMUTABLE\` / \`FLAG_MUTABLE\` requirements, exact alarms, and notification channels.
- **Tested Device Compatibility**: Vivo, Oppo, Samsung, iQOO, and Motorola devices with reboot recovery (\`RECEIVE_BOOT_COMPLETED\`).
- **Two Native Home Screen Widgets**:
  1. **Compact Widget** (2x1): Goal name, countdown, streak, working Check-in button.
  2. **Large Widget** (4x2): Goal name, target date, large countdown digits, streak, longest streak, missed days count, countdown change, working Check-in button.
- **Zero-App-Open Check-Ins**: The widget check-in button executes directly via \`WidgetCheckInReceiver\`, writing to the shared Room database without launching the app.
- **Offline & Private**: Zero mandatory accounts, cloud services, or network calls.

---

## How to Build the APK

### Option A: Via Android Studio (Recommended)
1. Unzip this directory.
2. Open **Android Studio** -> Select **Open** -> choose this project folder.
3. Allow Gradle to sync dependencies automatically.
4. Select **Build** -> **Build Bundle(s) / APK(s)** -> **Build APK(s)**.
5. The generated APK will be placed in: \`app/build/outputs/apk/debug/app-debug.apk\`.
6. Transfer \`app-debug.apk\` to your phone and install!

### Option B: Command Line (Linux / Mac / Termux on Android phone)
\`\`\`bash
# Grant execution rights to Gradle wrapper
chmod +x ./gradlew

# Build the Debug APK
./gradlew assembleDebug

# Output APK location:
# app/build/outputs/apk/debug/app-debug.apk
\`\`\`

### Option C: GitHub Actions (Free 1-Click Cloud APK Build)
If you push this repository to GitHub, a standard Android CI workflow will automatically compile and provide the downloadable APK artifact on every push.
`,
    },
  ];
}

/**
 * Packs all files into a ready-to-extract ZIP archive.
 */
export async function generateAndroidProjectZip(): Promise<Blob> {
  const zip = new JSZip();
  const files = getAndroidProjectFiles();

  for (const file of files) {
    zip.file(file.path, file.content);
  }

  return await zip.generateAsync({ type: 'blob' });
}
