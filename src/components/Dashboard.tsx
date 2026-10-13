import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  Plus,
  AlertTriangle,
  ChevronRight,
  Archive,
  Search,
} from 'lucide-react';
import { CheckIn, Goal } from '../types';
import { formatDisplayDate } from '../lib/dateUtils';
import { calculateGoalMetrics } from '../lib/streakEngine';

interface DashboardProps {
  goals: Goal[];
  checkIns: CheckIn[];
  todayDate: string;
  onSelectGoal: (goalId: string) => void;
  onCheckIn: (goalId: string) => void;
  onNewGoal: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  goals,
  checkIns,
  todayDate,
  onSelectGoal,
  onCheckIn,
  onNewGoal,
}) => {
  const [filter, setFilter] = useState<'active' | 'archived'>('active');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredGoals = goals.filter((g) => {
    const matchesFilter = filter === 'active' ? !g.archived : g.archived;
    const matchesSearch =
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.description && g.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  // Aggregate stats across active goals
  const activeGoals = goals.filter((g) => !g.archived);
  let checkedTodayCount = 0;
  let maxStreak = 0;

  activeGoals.forEach((g) => {
    const m = calculateGoalMetrics(g, checkIns, todayDate);
    if (m.isCheckedInToday) checkedTodayCount++;
    if (m.currentStreak > maxStreak) maxStreak = m.currentStreak;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* KPI Summary strip */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
            Active Goals
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
            {activeGoals.length}
          </div>
          <span className="text-xs text-slate-500 block mt-0.5">
            Independent events tracked
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
            Today Checked In
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {checkedTodayCount}{' '}
            <span className="text-xs font-normal text-slate-500">/ {activeGoals.length}</span>
          </div>
          <span className="text-xs text-slate-500 block mt-0.5">
            {checkedTodayCount === activeGoals.length && activeGoals.length > 0
              ? 'All daily goals complete!'
              : `${activeGoals.length - checkedTodayCount} pending today`}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
            Highest Streak
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-500 tabular-nums flex items-center gap-1">
            <span>{maxStreak}</span>
            <Flame className="w-5 h-5 text-amber-500 fill-amber-500/30" />
          </div>
          <span className="text-xs text-slate-500 block mt-0.5">
            Consecutive calendar days
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Functional segmented buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl w-fit">
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              filter === 'active'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Active Goals ({activeGoals.length})
          </button>
          <button
            onClick={() => setFilter('archived')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              filter === 'archived'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Archived ({goals.length - activeGoals.length})
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search goals..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Goal Cards Grid */}
      {filteredGoals.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center mb-3">
            <Flame className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            {filter === 'active' ? 'No active goals' : 'No archived goals'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
            {filter === 'active'
              ? 'Create your first goal with a target date to begin tracking streaks and countdowns.'
              : 'Goals you archive will appear here for safe keeping.'}
          </p>
          {filter === 'active' && (
            <button
              onClick={onNewGoal}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Goal</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGoals.map((goal) => {
            const metrics = calculateGoalMetrics(goal, checkIns, todayDate);

            // Countdown color
            const countdownColor =
              metrics.currentCountdown.status === 'overdue'
                ? 'text-rose-600 dark:text-rose-400'
                : metrics.currentCountdown.status === 'today'
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-blue-600 dark:text-blue-400';

            // Streak badge & border color
            const streakBg =
              metrics.streakStatus === 'active'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                : metrics.streakStatus === 'pending'
                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                : metrics.streakStatus === 'broken'
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700';

            return (
              <div
                key={goal.id}
                className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Card Top: Target Date & Status */}
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      <span>{formatDisplayDate(goal.targetDate)}</span>
                    </div>

                    {/* Streak pill state */}
                    <div
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border flex items-center gap-1 ${streakBg}`}
                    >
                      <Flame className="w-3 h-3 fill-current" />
                      <span>{metrics.currentStreak}d streak</span>
                    </div>
                  </div>

                  {/* Goal Name */}
                  <button
                    onClick={() => onSelectGoal(goal.id)}
                    className="text-left group block w-full"
                  >
                    <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                      {goal.name}
                    </h3>
                    {goal.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                        {goal.description}
                      </p>
                    )}
                  </button>

                  {/* Large Countdown Display */}
                  <div
                    onClick={() => onSelectGoal(goal.id)}
                    className="cursor-pointer my-4 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                        Countdown
                      </span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {metrics.currentCountdown.displayText}
                      </span>
                    </div>
                    <div className={`text-3xl font-black tabular-nums tracking-tight ${countdownColor}`}>
                      {metrics.currentCountdown.status === 'today' ? 'Today' : metrics.currentCountdown.days}
                    </div>
                  </div>

                  {/* Meta Indicators: Today status, Last checkin, Missed days */}
                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 pt-1">
                    {/* Today Status */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Today's Check-in:</span>
                      {metrics.isCheckedInToday ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Checked In
                        </span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Pending
                        </span>
                      )}
                    </div>

                    {/* Last Check-in Date */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Last Check-in:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {metrics.lastCheckInDate ? formatDisplayDate(metrics.lastCheckInDate) : 'None yet'}
                      </span>
                    </div>

                    {/* Missed-day indicator */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Completed Missed:</span>
                      <span
                        className={`font-semibold tabular-nums ${
                          metrics.completedMissedDaysCount > 0
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {metrics.completedMissedDaysCount} {metrics.completedMissedDaysCount === 1 ? 'day' : 'days'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  {!metrics.isCheckedInToday ? (
                    <button
                      onClick={() => onCheckIn(goal.id)}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Check In</span>
                    </button>
                  ) : (
                    <div className="flex-1 py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1.5 border border-emerald-200/50 dark:border-emerald-800/50">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Checked In Today</span>
                    </div>
                  )}

                  <button
                    onClick={() => onSelectGoal(goal.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="View details and timeline"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
