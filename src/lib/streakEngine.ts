/**
 * Streak & Countdown — Pure Streak & Calculation Engine
 * 
 * Implements strict calendar-date math conforming to requirements:
 * 1. Local calendar dates (YYYY-MM-DD), no rolling 24h drifts.
 * 2. Deduplication and uniqueness per goal ID + local date.
 * 3. Streak rules based on actual history:
 *    - First check-in = 1.
 *    - Consecutive days = +1.
 *    - Missed completed day = breaks streak (becomes 0).
 *    - If today is pending and yesterday checked in, streak remains active through yesterday.
 *    - After completed missed day, current streak is 0 until next check-in.
 *    - Next check-in starts a new streak of 1.
 * 4. Countdown & Delay calculations:
 *    - Days remaining, "Today", or days overdue (never negative).
 *    - Elapsed calendar days since last check-in.
 *    - Completed missed check-in days (excluding pending today).
 *    - Countdown at last check-in, current countdown, countdown difference.
 * 5. Accurate historical timeline generation without fabrication.
 */

import {
  CheckIn,
  CountdownInfo,
  CountdownStatus,
  Goal,
  StreakMetrics,
  TimelineItem,
  TimelineItemType,
} from '../types';
import {
  addDays,
  diffCalendarDays,
  formatDisplayDate,
  parseLocalDate,
} from './dateUtils';

/**
 * Calculates countdown from a specific calendar date to the target date.
 */
export function calculateCountdown(targetDate: string, currentDate: string): CountdownInfo {
  const rawDiffDays = diffCalendarDays(currentDate, targetDate); // targetDate - currentDate
  
  if (rawDiffDays > 0) {
    return {
      days: rawDiffDays,
      status: 'future',
      displayText: rawDiffDays === 1 ? '1 day left' : `${rawDiffDays} days left`,
      rawDiffDays,
    };
  } else if (rawDiffDays === 0) {
    return {
      days: 0,
      status: 'today',
      displayText: 'Today',
      rawDiffDays: 0,
    };
  } else {
    const overdueDays = Math.abs(rawDiffDays);
    return {
      days: overdueDays,
      status: 'overdue',
      displayText: overdueDays === 1 ? '1 day overdue' : `${overdueDays} days overdue`,
      rawDiffDays,
    };
  }
}

/**
 * Calculates all streak and countdown metrics for a goal against a reference date (usually today).
 */
export function calculateGoalMetrics(
  goal: Goal,
  checkIns: CheckIn[],
  todayDate: string
): StreakMetrics {
  // Filter check-ins belonging to this goal
  const goalCheckIns = checkIns.filter((c) => c.goalId === goal.id);

  // Deduplicate by localDate (database-level uniqueness) and sort ascending
  const checkInMap = new Map<string, CheckIn>();
  for (const c of goalCheckIns) {
    // Keep first or latest per date
    if (!checkInMap.has(c.localDate)) {
      checkInMap.set(c.localDate, c);
    }
  }

  const sortedDates = Array.from(checkInMap.keys()).sort();
  const totalCheckIns = sortedDates.length;
  const isCheckedInToday = checkInMap.has(todayDate);

  // If no check-ins exist at all:
  if (totalCheckIns === 0) {
    const currentCountdown = calculateCountdown(goal.targetDate, todayDate);
    // Goal creation date
    const createdDate = goal.createdAt ? goal.createdAt.split('T')[0] : todayDate;
    // Completed missed days since creation up to yesterday
    let completedMissedDaysCount = 0;
    if (diffCalendarDays(createdDate, todayDate) > 0) {
      // e.g. created 10 Oct, today 13 Oct -> days 11 and 12 were missed = 2 days
      completedMissedDaysCount = Math.max(0, diffCalendarDays(createdDate, todayDate) - 1);
    }

    return {
      currentStreak: 0,
      longestStreak: 0,
      totalCheckIns: 0,
      isCheckedInToday: false,
      todayLocalDate: todayDate,
      lastCheckInDate: null,
      lastCheckInNote: null,
      currentCountdown,
      countdownAtLastCheckIn: null,
      elapsedDaysSinceLastCheckIn: null,
      completedMissedDaysCount,
      countdownDifference: null,
      streakStatus: 'not_started',
    };
  }

  // Calculate longest streak historically and build day-by-day streak values
  let longestStreak = 0;
  let runningStreak = 0;
  let prevDate: string | null = null;
  const streakAtDate = new Map<string, number>();

  for (const d of sortedDates) {
    if (prevDate === null) {
      runningStreak = 1;
    } else {
      const daysBetween = diffCalendarDays(prevDate, d);
      if (daysBetween === 1) {
        runningStreak += 1;
      } else {
        // Gap of > 1 day means streak broke, starts fresh at 1
        runningStreak = 1;
      }
    }
    streakAtDate.set(d, runningStreak);
    if (runningStreak > longestStreak) {
      longestStreak = runningStreak;
    }
    prevDate = d;
  }

  // Last check-in date
  const lastCheckInDate = sortedDates[sortedDates.length - 1];
  const lastCheckInObj = checkInMap.get(lastCheckInDate)!;
  const lastCheckInNote = lastCheckInObj.note || null;

  // Determine current streak relative to today
  // Yesterday's date
  const yesterdayDate = addDays(todayDate, -1);
  let currentStreak = 0;
  let streakStatus: StreakMetrics['streakStatus'] = 'broken';

  if (isCheckedInToday) {
    // Today is checked in!
    currentStreak = streakAtDate.get(todayDate) || 1;
    streakStatus = 'active';
  } else if (lastCheckInDate === yesterdayDate) {
    // Yesterday was checked in, today is pending check-in.
    // Streak remains active through yesterday!
    currentStreak = streakAtDate.get(yesterdayDate) || 1;
    streakStatus = 'pending';
  } else if (diffCalendarDays(lastCheckInDate, todayDate) > 1) {
    // A completed day was missed (e.g. last check in was 2+ days ago).
    // Current streak is zero until next check-in.
    currentStreak = 0;
    streakStatus = 'broken';
  } else {
    // If lastCheckInDate is in future (e.g. simulation), handle safely
    currentStreak = streakAtDate.get(lastCheckInDate) || 0;
    streakStatus = 'active';
  }

  // Countdowns
  const currentCountdown = calculateCountdown(goal.targetDate, todayDate);
  const countdownAtLastCheckIn = calculateCountdown(goal.targetDate, lastCheckInDate);

  // Section 6 items:
  // 1. Elapsed calendar days since last successful check-in
  const elapsedDaysSinceLastCheckIn = diffCalendarDays(lastCheckInDate, todayDate);

  // 2. Completed missed check-in days
  // "Example: Last check-in 10 October; target 20 October; current date 13 October.
  // Previous countdown: 10 days. Current countdown: 7 days.
  // Elapsed days: 3. Completed missed days: 2 (11 and 12 October).
  // Countdown change: 3 days. The current date is pending, not yet a completed missed day."
  // So completed missed days between lastCheckInDate and today is max(0, elapsed - 1) if not checked in today.
  let completedMissedDaysCount = 0;
  if (isCheckedInToday) {
    // If today is checked in, any gap prior to today was between previous check-in and today
    completedMissedDaysCount = 0;
  } else {
    // Elapsed calendar days: 13 Oct - 10 Oct = 3.
    // Completed days in between: 11 Oct, 12 Oct = 2 days.
    // If elapsed is 1 (yesterday checked in), elapsed - 1 = 0.
    completedMissedDaysCount = Math.max(0, elapsedDaysSinceLastCheckIn - 1);
  }

  // 5. Difference between previous countdown and current countdown
  // e.g. Previous countdown 10 days, Current countdown 7 days -> change = 3 days.
  const countdownDifference = countdownAtLastCheckIn.rawDiffDays - currentCountdown.rawDiffDays;

  return {
    currentStreak,
    longestStreak,
    totalCheckIns,
    isCheckedInToday,
    todayLocalDate: todayDate,
    lastCheckInDate,
    lastCheckInNote,
    currentCountdown,
    countdownAtLastCheckIn,
    elapsedDaysSinceLastCheckIn,
    completedMissedDaysCount,
    countdownDifference,
    streakStatus,
  };
}

/**
 * Generates an accurate chronological timeline of events for a goal:
 * - Successful check-ins
 * - Missed days
 * - Broken streaks
 * - New streak starts
 * - Goal created / Target reached
 */
export function generateGoalTimeline(
  goal: Goal,
  checkIns: CheckIn[],
  todayDate: string
): TimelineItem[] {
  const goalCheckIns = checkIns.filter((c) => c.goalId === goal.id);
  const checkInMap = new Map<string, CheckIn>();
  for (const c of goalCheckIns) {
    if (!checkInMap.has(c.localDate)) {
      checkInMap.set(c.localDate, c);
    }
  }

  const sortedDates = Array.from(checkInMap.keys()).sort();
  const createdDate = goal.createdAt ? goal.createdAt.split('T')[0] : (sortedDates[0] || todayDate);
  const startDate = sortedDates.length > 0 && sortedDates[0] < createdDate ? sortedDates[0] : createdDate;
  
  // End date is today or target date, whichever is later, but for timeline we display up to today (and future target marker)
  const items: TimelineItem[] = [];

  // Goal Created Event
  items.push({
    id: `event-created-${goal.id}`,
    date: createdDate,
    type: 'goal_created',
    title: 'Goal Established',
    description: `Target set to ${formatDisplayDate(goal.targetDate)}`,
    streakAtPoint: 0,
    historicalCountdown: calculateCountdown(goal.targetDate, createdDate),
  });

  if (sortedDates.length === 0) {
    // If no check-ins, record completed missed days up to yesterday
    let curDate = addDays(createdDate, 1);
    while (curDate < todayDate) {
      items.push({
        id: `missed-${curDate}`,
        date: curDate,
        type: 'missed_day',
        title: 'Check-in Missed',
        description: 'No check-in recorded for this day',
        streakAtPoint: 0,
        historicalCountdown: calculateCountdown(goal.targetDate, curDate),
      });
      curDate = addDays(curDate, 1);
    }
  } else {
    // Traverse from startDate through todayDate
    let curDate = startDate;
    let runningStreak = 0;
    let hadStreakBreak = false;

    while (curDate <= todayDate) {
      const isToday = curDate === todayDate;
      const checkIn = checkInMap.get(curDate);

      if (checkIn) {
        // Successful check-in
        const wasStreakZero = runningStreak === 0;
        runningStreak += 1;
        hadStreakBreak = false;

        const isNewStreakStart = wasStreakZero && runningStreak === 1;

        items.push({
          id: `checkin-${checkIn.id}`,
          date: curDate,
          type: isNewStreakStart ? 'new_streak' : 'check_in',
          title: isNewStreakStart ? 'New Streak Started (Day 1)' : `Day ${runningStreak} Check-in`,
          description: checkIn.note ? `Note: "${checkIn.note}"` : `Completed for ${formatDisplayDate(curDate)}`,
          streakAtPoint: runningStreak,
          historicalCountdown: calculateCountdown(goal.targetDate, curDate),
          checkIn,
        });
      } else {
        // Date was not checked in.
        // Today is pending, so today is NOT a completed missed day unless explicitly past
        if (!isToday) {
          const wasActiveStreak = runningStreak > 0;
          const brokenStreakVal = runningStreak;
          runningStreak = 0;

          if (wasActiveStreak && !hadStreakBreak) {
            items.push({
              id: `broken-${curDate}`,
              date: curDate,
              type: 'broken_streak',
              title: 'Streak Broken',
              description: `Streak of ${brokenStreakVal} day${brokenStreakVal > 1 ? 's' : ''} ended`,
              streakAtPoint: 0,
              historicalCountdown: calculateCountdown(goal.targetDate, curDate),
            });
            hadStreakBreak = true;
          } else {
            items.push({
              id: `missed-${curDate}`,
              date: curDate,
              type: 'missed_day',
              title: 'Missed Day',
              description: 'No check-in recorded',
              streakAtPoint: 0,
              historicalCountdown: calculateCountdown(goal.targetDate, curDate),
            });
          }
        }
      }

      curDate = addDays(curDate, 1);
    }
  }

  // Sort timeline items chronologically descending (newest on top)
  items.sort((a, b) => {
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date);
    }
    // Tie-break if multiple events on same date
    const order: Record<TimelineItemType, number> = {
      target_reached: 1,
      check_in: 2,
      new_streak: 3,
      broken_streak: 4,
      missed_day: 5,
      goal_created: 6,
    };
    return (order[a.type] || 99) - (order[b.type] || 99);
  });

  return items;
}
