/**
 * Streak & Countdown — Type Definitions
 * Offline-first, SQLite/Room compatible model definitions
 */

export interface Goal {
  id: string;
  name: string;
  description?: string;
  targetDate: string; // YYYY-MM-DD in local time
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  archived: boolean;
  reminderEnabled: boolean;
  reminderTime?: string; // HH:mm in 24h format (e.g. "20:00")
  colorScheme?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate';
}

export interface CheckIn {
  id: string;
  goalId: string;
  localDate: string; // YYYY-MM-DD (unique per goalId)
  timestamp: string; // ISO 8601
  note?: string;
}

export type CountdownStatus = 'future' | 'today' | 'overdue';

export interface CountdownInfo {
  days: number; // positive number: days remaining or days overdue; 0 for today
  status: CountdownStatus;
  displayText: string; // e.g. "7 days left", "Today", "3 days overdue"
  rawDiffDays: number; // targetDate - date (can be negative if overdue)
}

export interface StreakMetrics {
  currentStreak: number;
  longestStreak: number;
  totalCheckIns: number;
  isCheckedInToday: boolean;
  todayLocalDate: string;
  lastCheckInDate: string | null;
  lastCheckInNote: string | null;
  
  // Section 6 specific countdown & delay metrics:
  currentCountdown: CountdownInfo;
  countdownAtLastCheckIn: CountdownInfo | null;
  elapsedDaysSinceLastCheckIn: number | null; // calendar days between last check-in and today
  completedMissedDaysCount: number; // completed missed calendar days prior to today
  countdownDifference: number | null; // difference between countdown at last check-in and current countdown
  
  streakStatus: 'active' | 'pending' | 'broken' | 'not_started';
}

export type TimelineItemType = 
  | 'check_in' 
  | 'missed_day' 
  | 'broken_streak' 
  | 'new_streak' 
  | 'goal_created' 
  | 'target_reached';

export interface TimelineItem {
  id: string;
  date: string; // YYYY-MM-DD
  type: TimelineItemType;
  title: string;
  description: string;
  streakAtPoint: number;
  historicalCountdown: CountdownInfo;
  checkIn?: CheckIn;
}

export interface WidgetInstance {
  appWidgetId: number;
  goalId: string;
  type: 'compact' | 'large';
}

export interface AppSettings {
  theme: 'system' | 'light' | 'dark';
  notificationsEnabled: boolean;
  defaultReminderTime: string; // "20:00"
  hapticFeedback: boolean;
  simulatedDateOffsetDays: number; // For testing/simulating date changes without changing device clock
}
