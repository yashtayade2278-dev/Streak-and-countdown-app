package com.streakandcountdown.app.domain

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

    fun calculateCountdown(targetDateStr: String, fromDate: LocalDate = LocalDate.now()): CountdownResult {
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
        today: LocalDate = LocalDate.now()
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
