import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  AlertTriangle,
  History,
  Edit2,
  Archive,
  Trash2,
  TrendingDown,
  TrendingUp,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { CheckIn, Goal } from '../types';
import { formatDisplayDate, formatRelativeDate } from '../lib/dateUtils';
import { calculateGoalMetrics, generateGoalTimeline } from '../lib/streakEngine';

interface GoalDetailViewProps {
  goal: Goal;
  checkIns: CheckIn[];
  todayDate: string;
  onBack: () => void;
  onCheckIn: (goalId: string) => void;
  onEdit: (goal: Goal) => void;
  onToggleArchive: (goalId: string) => void;
  onDelete: (goalId: string) => void;
}

export const GoalDetailView: React.FC<GoalDetailViewProps> = ({
  goal,
  checkIns,
  todayDate,
  onBack,
  onCheckIn,
  onEdit,
  onToggleArchive,
  onDelete,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const metrics = calculateGoalMetrics(goal, checkIns, todayDate);
  const timeline = generateGoalTimeline(goal, checkIns, todayDate);

  const countdownColor =
    metrics.currentCountdown.status === 'overdue'
      ? 'text-rose-600 dark:text-rose-400'
      : metrics.currentCountdown.status === 'today'
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-blue-600 dark:text-blue-400';

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 animate-in fade-in duration-150">
      {/* Top back bar and actions */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onEdit(goal)}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Edit goal or target date"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onToggleArchive(goal.id)}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={goal.archived ? 'Restore goal' : 'Archive goal'}
          >
            <Archive className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
            title="Delete goal"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Goal Hero Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              <span>Target: {formatDisplayDate(goal.targetDate)}</span>
              <span className="font-mono text-[11px]">({goal.targetDate})</span>
              {goal.archived && (
                <>
                  <span>·</span>
                  <span className="text-amber-500 font-medium">Archived</span>
                </>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {goal.name}
            </h1>

            {goal.description && (
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl pt-1">
                {goal.description}
              </p>
            )}
          </div>

          {/* Primary Countdown Display */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-xl p-4 sm:p-5 text-center min-w-[180px] shrink-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
              Countdown
            </span>
            <div className={`text-4xl font-black tabular-nums tracking-tight ${countdownColor}`}>
              {metrics.currentCountdown.status === 'today' ? 'Today' : metrics.currentCountdown.days}
            </div>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mt-0.5">
              {metrics.currentCountdown.status === 'today'
                ? 'Target Date Reached'
                : metrics.currentCountdown.status === 'overdue'
                ? `${metrics.currentCountdown.days} ${metrics.currentCountdown.days === 1 ? 'day' : 'days'} overdue`
                : `${metrics.currentCountdown.days} ${metrics.currentCountdown.days === 1 ? 'day' : 'days'} remaining`}
            </span>
          </div>
        </div>

        {/* Check-in CTA Bar */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs">
            {metrics.isCheckedInToday ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                Checked in for {formatDisplayDate(todayDate)}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
                <Clock className="w-4 h-4" />
                Today's check-in is pending
              </span>
            )}
          </div>

          {!metrics.isCheckedInToday ? (
            <button
              onClick={() => onCheckIn(goal.id)}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Record Today's Check-in</span>
            </button>
          ) : (
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Great job! Come back tomorrow to continue your streak.</span>
            </div>
          )}
        </div>
      </div>

      {/* Core Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Current Streak */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500/20" />
            <span>Current Streak</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
            {metrics.currentStreak} <span className="text-xs font-normal text-slate-500">days</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {metrics.streakStatus === 'active'
              ? 'Active (Checked in today)'
              : metrics.streakStatus === 'pending'
              ? 'Active through yesterday'
              : metrics.streakStatus === 'not_started'
              ? 'Not started yet'
              : 'Reset after missed day'}
          </div>
        </div>

        {/* Longest Streak */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <Flame className="w-4 h-4 text-indigo-500" />
            <span>Longest Streak</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
            {metrics.longestStreak} <span className="text-xs font-normal text-slate-500">days</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            All-time historical best
          </div>
        </div>

        {/* Total Check-ins */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Total Check-ins</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
            {metrics.totalCheckIns}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Unique verified days
          </div>
        </div>

        {/* Missed Days */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Completed Missed</span>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
            {metrics.completedMissedDaysCount}{' '}
            <span className="text-xs font-normal text-slate-500">days</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Excludes pending today
          </div>
        </div>
      </div>

      {/* Section 6 Detailed Delay & Countdown Analytics Box */}
      <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-500" />
          <span>Section 6: Countdown &amp; Delay Velocity Metrics</span>
        </h3>

        {metrics.lastCheckInDate ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <span className="text-slate-400 block text-[11px]">1. Elapsed Calendar Days</span>
              <span className="text-base font-bold text-slate-800 dark:text-slate-100 tabular-nums">
                {metrics.elapsedDaysSinceLastCheckIn} {metrics.elapsedDaysSinceLastCheckIn === 1 ? 'day' : 'days'}
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Since {formatDisplayDate(metrics.lastCheckInDate)}
              </span>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <span className="text-slate-400 block text-[11px]">2. Completed Missed Check-ins</span>
              <span className="text-base font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                {metrics.completedMissedDaysCount} {metrics.completedMissedDaysCount === 1 ? 'day' : 'days'}
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Today is pending, not completed missed
              </span>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <span className="text-slate-400 block text-[11px]">3. Countdown at Last Check-in</span>
              <span className="text-base font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                {metrics.countdownAtLastCheckIn?.displayText}
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                On {metrics.lastCheckInDate}
              </span>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <span className="text-slate-400 block text-[11px]">4. Current Countdown</span>
              <span className="text-base font-bold text-slate-900 dark:text-white tabular-nums">
                {metrics.currentCountdown.displayText}
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                As of {todayDate}
              </span>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 sm:col-span-2 md:col-span-2">
              <span className="text-slate-400 block text-[11px]">5. Countdown Change Difference</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-base font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                  {metrics.countdownDifference !== null ? `${metrics.countdownDifference} days change` : 'Baseline'}
                </span>
                {metrics.countdownDifference !== null && metrics.countdownDifference > 0 && (
                  <TrendingDown className="w-4 h-4 text-indigo-500" />
                )}
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Previous countdown ({metrics.countdownAtLastCheckIn?.days}d) minus current countdown ({metrics.currentCountdown.days}d)
              </span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-500 p-4 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
            No check-in recorded yet. Once you complete your first check-in, elapsed days and countdown velocity metrics will be calculated automatically.
          </div>
        )}
      </div>

      {/* Chronological Timeline */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-blue-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Chronological History &amp; Timeline
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            {timeline.length} timeline {timeline.length === 1 ? 'event' : 'events'}
          </span>
        </div>

        {timeline.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No history recorded yet.
          </div>
        ) : (
          <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
            {timeline.map((item) => {
              const isCheckIn = item.type === 'check_in' || item.type === 'new_streak';
              const isBroken = item.type === 'broken_streak';
              const isMissed = item.type === 'missed_day';
              const isCreated = item.type === 'goal_created';

              return (
                <div key={item.id} className="relative flex items-start gap-3.5 pl-1 text-xs">
                  {/* Timeline Node Icon */}
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 ${
                      isCheckIn
                        ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 ring-4 ring-white dark:ring-slate-900'
                        : isBroken
                        ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 ring-4 ring-white dark:ring-slate-900'
                        : isMissed
                        ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 ring-4 ring-white dark:ring-slate-900'
                        : 'bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 ring-4 ring-white dark:ring-slate-900'
                    }`}
                  >
                    {isCheckIn ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : isBroken ? (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    ) : isMissed ? (
                      <Clock className="w-3.5 h-3.5" />
                    ) : (
                      <Calendar className="w-3.5 h-3.5" />
                    )}
                  </div>

                  {/* Timeline Event Content */}
                  <div className="flex-1 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 rounded-xl p-3">
                    <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                      <span className="font-bold text-slate-800 dark:text-slate-100">
                        {item.title}
                      </span>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span>{formatDisplayDate(item.date)}</span>
                        <span>·</span>
                        <span className="font-mono text-blue-500 dark:text-blue-400">
                          {item.historicalCountdown.displayText}
                        </span>
                      </div>
                    </div>

                    <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                      {item.description}
                    </p>

                    {item.checkIn?.note && (
                      <div className="mt-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 flex items-start gap-2">
                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="italic">"{item.checkIn.note}"</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Delete Goal
                </h3>
                <p className="text-xs text-slate-500">
                  Are you sure you want to delete "{goal.name}"?
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              This will permanently delete all associated check-in records and widget assignments. This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onDelete(goal.id);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
