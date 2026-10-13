import React, { useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  Plus,
  ChevronRight,
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

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  const activeGoals = useMemo(
    () => goals.filter((goal) => !goal.archived),
    [goals]
  );

  const filteredGoals = useMemo(() => {
    return goals.filter((goal) => {
      const matchesFilter =
        filter === 'active' ? !goal.archived : goal.archived;

      const matchesSearch =
        normalizedSearchQuery.length === 0 ||
        goal.name.toLowerCase().includes(normalizedSearchQuery) ||
        Boolean(
          goal.description
            ?.toLowerCase()
            .includes(normalizedSearchQuery)
        );

      return matchesFilter && matchesSearch;
    });
  }, [filter, goals, normalizedSearchQuery]);

  const summary = useMemo(() => {
    let checkedTodayCount = 0;
    let maxStreak = 0;

    activeGoals.forEach((goal) => {
      const metrics = calculateGoalMetrics(goal, checkIns, todayDate);

      if (metrics.isCheckedInToday) {
        checkedTodayCount += 1;
      }

      if (metrics.currentStreak > maxStreak) {
        maxStreak = metrics.currentStreak;
      }
    });

    return {
      checkedTodayCount,
      maxStreak,
    };
  }, [activeGoals, checkIns, todayDate]);

  const archivedGoalsCount = goals.length - activeGoals.length;
  const pendingTodayCount = Math.max(
    activeGoals.length - summary.checkedTodayCount,
    0
  );

  return (
    <div className="w-full min-w-0 max-w-6xl mx-auto overflow-x-hidden px-4 py-4 sm:px-6 sm:py-6 space-y-6">
      <div className="grid min-w-0 grid-cols-2 gap-3">
        <div className="min-w-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <span className="block mb-0.5 text-sm font-semibold uppercase tracking-wider text-slate-400">
            Active Goals
          </span>
          <div className="text-2xl text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
            {activeGoals.length}
          </div>
          <span className="block mt-0.5 text-sm text-slate-500 break-words">
            Active now
          </span>
        </div>

        <div className="min-w-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <span className="block mb-0.5 text-sm font-semibold uppercase tracking-wider text-slate-400">
            Today Checked In
          </span>
          <div className="text-2xl text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {summary.checkedTodayCount}{' '}
            <span className="text-sm font-normal text-slate-500">
              / {activeGoals.length}
            </span>
          </div>
          <span className="block mt-0.5 text-sm text-slate-500 break-words">
            {summary.checkedTodayCount === activeGoals.length &&
            activeGoals.length > 0
              ? 'All daily goals complete!'
              : `${pendingTodayCount} pending today`}
          </span>
        </div>

        <div className="min-w-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <span className="block mb-0.5 text-sm font-semibold uppercase tracking-wider text-slate-400">
            Highest Streak
          </span>
          <div className="flex items-center gap-1 text-2xl text-3xl font-extrabold text-amber-500 tabular-nums">
            <span>{summary.maxStreak}</span>
            <Flame className="w-5 h-5 text-amber-500 fill-amber-500/30" />
          </div>
          <span className="block mt-0.5 text-sm text-slate-500 break-words">
            Best current streak
          </span>
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid w-full grid-cols-2 gap-1 rounded-xl bg-slate-200/70 p-1 dark:bg-slate-800/80 sm:w-auto">
          <button
            type="button"
            onClick={() => setFilter('active')}
            className={`min-w-0 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
              filter === 'active'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <span className="block truncate">
              Active ({activeGoals.length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('archived')}
            className={`min-w-0 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
              filter === 'archived'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <span className="block truncate">
              Archived ({archivedGoalsCount})
            </span>
          </button>
        </div>

        <div className="relative w-full min-w-0 sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search goals..."
            aria-label="Search goals"
            className="w-full min-w-0 rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 sm:text-sm"
          />
        </div>
      </div>

      {filteredGoals.length === 0 ? (
        <div className="w-full min-w-0 rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900 sm:p-10">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
            <Flame className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {filter === 'active' ? 'No active goals' : 'No archived goals'}
          </h3>
          <p className="mx-auto mb-5 mt-1 max-w-sm text-sm text-slate-500">
            {normalizedSearchQuery
              ? 'No goals match your search.'
              : filter === 'active'
                ? 'Create your first goal with a target date to begin tracking streaks and countdowns.'
                : 'Goals you archive will appear here.'}
          </p>

          {filter === 'active' && !normalizedSearchQuery && (
            <button
              type="button"
              onClick={onNewGoal}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
            >
              <Plus className="h-4 w-4" />
              <span>Create Goal</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-1">
          {filteredGoals.map((goal) => {
            const metrics = calculateGoalMetrics(
              goal,
              checkIns,
              todayDate
            );

            const countdownColor =
              metrics.currentCountdown.status === 'overdue'
                ? 'text-rose-600 dark:text-rose-400'
                : metrics.currentCountdown.status === 'today'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-blue-600 dark:text-blue-400';

            const streakStyles =
              metrics.streakStatus === 'active'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                : metrics.streakStatus === 'pending'
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                  : metrics.streakStatus === 'broken'
                    ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700';

            return (
              <article
                key={goal.id}
                className="flex min-w-0 flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900 sm:p-5"
              >
                <div className="min-w-0">
                  <div className="mb-2 flex min-w-0 items-center justify-between gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                      <span className="truncate">
                        {formatDisplayDate(goal.targetDate)}
                      </span>
                    </div>

                    <div
                      className={`flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-sm font-semibold ${streakStyles}`}
                    >
                      <Flame className="h-3 w-3 fill-current" />
                      <span>{metrics.currentStreak}d</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectGoal(goal.id)}
                    className="group block w-full min-w-0 text-left"
                  >
                    <h3 className="truncate text-base font-bold text-slate-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                      {goal.name}
                    </h3>

                    {goal.description && (
                      <p className="mt-1 line-clamp-2 break-words text-sm text-slate-500 dark:text-slate-400">
                        {goal.description}
                      </p>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectGoal(goal.id)}
                    className="my-4 flex w-full min-w-0 items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-left dark:border-slate-800/80 dark:bg-slate-800/50"
                  >
                    <span className="min-w-0">
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Countdown
                      </span>
                      <span className="block truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {metrics.currentCountdown.displayText}
                      </span>
                    </span>

                    <span
                      className={`shrink-0 text-2xl font-black tabular-nums tracking-tight text-3xl ${countdownColor}`}
                    >
                      {metrics.currentCountdown.status === 'today'
                        ? 'Today'
                        : metrics.currentCountdown.days}
                    </span>
                  </button>

                  <div className="space-y-2 pt-1 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex min-w-0 items-center justify-between gap-3">
                      <span className="shrink-0 text-slate-400">
                        Today's Check-in:
                      </span>

                      {metrics.isCheckedInToday ? (
                        <span className="flex min-w-0 items-center gap-1 truncate font-semibold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">Checked In</span>
                        </span>
                      ) : (
                        <span className="flex min-w-0 items-center gap-1 truncate font-medium text-amber-600 dark:text-amber-400">
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">Pending</span>
                        </span>
                      )}
                    </div>

                    <div className="flex min-w-0 items-center justify-between gap-3">
                      <span className="shrink-0 text-slate-400">
                        Last Check-in:
                      </span>
                      <span className="min-w-0 truncate text-right font-medium text-slate-700 dark:text-slate-300">
                        {metrics.lastCheckInDate
                          ? formatDisplayDate(metrics.lastCheckInDate)
                          : 'None yet'}
                      </span>
                    </div>

                  </div>
                </div>

                <div className="mt-5 flex min-w-0 items-center gap-2 border-t border-slate-100 pt-3.5 dark:border-slate-800">
                  {!metrics.isCheckedInToday ? (
                    <button
                      type="button"
                      onClick={() => onCheckIn(goal.id)}
                      className="flex min-h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-xs transition-all hover:bg-emerald-500 active:scale-[0.98]"
                    >
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span className="truncate">Check In</span>
                    </button>
                  ) : (
                    <div className="flex min-h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-200/50 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-400">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span className="truncate">Checked In Today</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => onSelectGoal(goal.id)}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    title="View details and timeline"
                    aria-label={`View ${goal.name} details`}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
