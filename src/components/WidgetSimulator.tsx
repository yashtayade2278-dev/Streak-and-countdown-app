import React, { useState } from 'react';
import {
  Layers,
  Flame,
  CheckCircle2,
  Clock,
  Sparkles,
  Smartphone,
  Info,
  Calendar,
  Check,
} from 'lucide-react';
import { CheckIn, Goal, WidgetInstance } from '../types';
import { formatDisplayDate } from '../lib/dateUtils';
import { calculateGoalMetrics } from '../lib/streakEngine';

interface WidgetSimulatorProps {
  goals: Goal[];
  checkIns: CheckIn[];
  todayDate: string;
  widgets: WidgetInstance[];
  onUpdateWidgetGoal: (appWidgetId: number, goalId: string) => void;
  onWidgetCheckIn: (goalId: string) => void;
  onSelectGoal: (goalId: string) => void;
}

export const WidgetSimulator: React.FC<WidgetSimulatorProps> = ({
  goals,
  checkIns,
  todayDate,
  widgets,
  onUpdateWidgetGoal,
  onWidgetCheckIn,
  onSelectGoal,
}) => {
  const [activeTab, setActiveTab] = useState<'simulator' | 'tech_specs'>('simulator');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const activeGoals = goals.filter((g) => !g.archived);

  // Compact Widget instance (ID 101)
  const compactWidget = widgets.find((w) => w.type === 'compact') || {
    appWidgetId: 101,
    goalId: activeGoals[0]?.id || '',
    type: 'compact' as const,
  };
  const compactGoal = goals.find((g) => g.id === compactWidget.goalId) || activeGoals[0];
  const compactMetrics = compactGoal
    ? calculateGoalMetrics(compactGoal, checkIns, todayDate)
    : null;

  // Large Widget instance (ID 102)
  const largeWidget = widgets.find((w) => w.type === 'large') || {
    appWidgetId: 102,
    goalId: activeGoals[1]?.id || activeGoals[0]?.id || '',
    type: 'large' as const,
  };
  const largeGoal = goals.find((g) => g.id === largeWidget.goalId) || activeGoals[1] || activeGoals[0];
  const largeMetrics = largeGoal
    ? calculateGoalMetrics(largeGoal, checkIns, todayDate)
    : null;

  const handleCompactCheckIn = () => {
    if (!compactGoal) return;
    try {
      onWidgetCheckIn(compactGoal.id);
      showToast(`Widget Check-in recorded for "${compactGoal.name}"!`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      showToast(msg);
    }
  };

  const handleLargeCheckIn = () => {
    if (!largeGoal) return;
    try {
      onWidgetCheckIn(largeGoal.id);
      showToast(`Widget Check-in recorded for "${largeGoal.name}"!`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      showToast(msg);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-500" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Native Android Home-Screen Widgets
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Genuine RemoteViews + AppWidgetProvider implementation supporting independent instances, direct background check-ins, and Android 12+ dynamic resizing.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'simulator'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Live Simulator
          </button>
          <button
            onClick={() => setActiveTab('tech_specs')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'tech_specs'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Kotlin Architecture
          </button>
        </div>
      </div>

      {activeTab === 'simulator' ? (
        <div className="space-y-6">
          {/* Simulated Android Device Canvas */}
          <div className="max-w-md mx-auto bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 rounded-[38px] p-4 sm:p-5 shadow-2xl border-4 border-slate-700/80 relative overflow-hidden">
            {/* Status bar */}
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-300 px-3 pb-4 pt-1">
              <span>09:41</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px]">5G</span>
                <span>100%</span>
              </div>
            </div>

            {/* Android Home Screen Widgets Stack */}
            <div className="space-y-4 py-2">
              {/* 1. COMPACT WIDGET (2x1) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Compact Widget (2x1)
                  </span>
                  {/* Goal selector */}
                  <select
                    value={compactWidget.goalId}
                    onChange={(e) => onUpdateWidgetGoal(compactWidget.appWidgetId, e.target.value)}
                    className="text-[11px] bg-slate-800/80 text-slate-200 border border-slate-700 rounded-md px-1.5 py-0.5 focus:outline-none"
                  >
                    {activeGoals.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                {compactGoal && compactMetrics ? (
                  <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-white/20 dark:border-slate-800 flex items-center justify-between gap-3 text-slate-900 dark:text-white">
                    <div
                      onClick={() => onSelectGoal(compactGoal.id)}
                      className="cursor-pointer flex-1 min-w-0"
                    >
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {compactGoal.name}
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{compactMetrics.currentCountdown.displayText}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        <Flame className="w-3 h-3 text-amber-500 fill-amber-500/20" />
                        <span>{compactMetrics.currentStreak} day streak</span>
                      </div>
                    </div>

                    {/* Working Widget Check-in button */}
                    {compactMetrics.isCheckedInToday ? (
                      <div className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 shadow-xs">
                        <Check className="w-3.5 h-3.5" />
                        <span>Done</span>
                      </div>
                    ) : (
                      <button
                        onClick={handleCompactCheckIn}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 active:scale-95 transition-transform"
                      >
                        Check In
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-800 rounded-2xl text-xs text-slate-400 text-center">
                    No active goal configured
                  </div>
                )}
              </div>

              {/* 2. LARGE WIDGET (4x2) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Large Widget (4x2)
                  </span>
                  {/* Goal selector */}
                  <select
                    value={largeWidget.goalId}
                    onChange={(e) => onUpdateWidgetGoal(largeWidget.appWidgetId, e.target.value)}
                    className="text-[11px] bg-slate-800/80 text-slate-200 border border-slate-700 rounded-md px-1.5 py-0.5 focus:outline-none"
                  >
                    {activeGoals.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                {largeGoal && largeMetrics ? (
                  <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-white/20 dark:border-slate-800 text-slate-900 dark:text-white space-y-3">
                    {/* Header */}
                    <div
                      onClick={() => onSelectGoal(largeGoal.id)}
                      className="cursor-pointer flex items-center justify-between gap-2"
                    >
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {largeGoal.name}
                      </h4>
                      <span className="text-[11px] text-slate-400 font-mono shrink-0">
                        Target: {largeGoal.targetDate}
                      </span>
                    </div>

                    {/* Big Countdown Number */}
                    <div
                      onClick={() => onSelectGoal(largeGoal.id)}
                      className="cursor-pointer text-center py-1 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800/80"
                    >
                      <div className="text-3xl font-black text-blue-600 dark:text-blue-400 tabular-nums">
                        {largeMetrics.currentCountdown.status === 'today'
                          ? 'Today'
                          : largeMetrics.currentCountdown.days}
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                        {largeMetrics.currentCountdown.status === 'today'
                          ? 'Event is Today'
                          : largeMetrics.currentCountdown.status === 'overdue'
                          ? 'Days Overdue'
                          : 'Days Remaining'}
                      </span>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-1 text-center text-xs py-0.5">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Streak</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {largeMetrics.currentStreak}d
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Longest</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {largeMetrics.longestStreak}d
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Missed</span>
                        <span className="font-bold text-amber-500">
                          {largeMetrics.completedMissedDaysCount}d
                        </span>
                      </div>
                    </div>

                    {/* Delay & Countdown difference strip */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-1.5">
                      <span>Last: {largeMetrics.lastCheckInDate || 'None'}</span>
                      <span className="font-medium text-indigo-500">
                        {largeMetrics.countdownDifference !== null
                          ? `-${largeMetrics.countdownDifference}d change`
                          : 'Baseline'}
                      </span>
                    </div>

                    {/* Working Check-In Button */}
                    {largeMetrics.isCheckedInToday ? (
                      <div className="w-full py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Checked In Today</span>
                      </div>
                    ) : (
                      <button
                        onClick={handleLargeCheckIn}
                        className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 active:scale-[0.98] transition-transform"
                      >
                        Check In Now
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-800 rounded-2xl text-xs text-slate-400 text-center">
                    No active goal configured
                  </div>
                )}
              </div>
            </div>

            {/* Android Home indicator bar */}
            <div className="w-28 h-1 bg-slate-600 rounded-full mx-auto mt-4 mb-1"></div>
          </div>

          {/* Android Toast simulator banner */}
          {toastMessage && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-white text-xs px-4 py-2 rounded-full shadow-lg border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
              {toastMessage}
            </div>
          )}
        </div>
      ) : (
        /* Kotlin Technical Specifications */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 text-xs">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-blue-500" />
            <span>Native Android Architecture &amp; Widget Specs</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
              <span className="font-bold text-slate-800 dark:text-slate-100 block">
                1. Kotlin AppWidgetProvider + RemoteViews
              </span>
              <p className="text-slate-600 dark:text-slate-400">
                Built strictly with Kotlin <code className="text-blue-500">AppWidgetProvider</code> and <code className="text-blue-500">RemoteViews</code> (no Glance). Fully compliant with Android 12, 13, and 14 device launchers including Vivo FuntouchOS, Oppo ColorOS, Samsung OneUI, and Motorola.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
              <span className="font-bold text-slate-800 dark:text-slate-100 block">
                2. Zero-App-Open Check-Ins
              </span>
              <p className="text-slate-600 dark:text-slate-400">
                The widget button dispatches a <code className="text-blue-500">PendingIntent.getBroadcast</code> targeting <code className="text-blue-500">WidgetCheckInReceiver</code>. Writes directly to Room SQLite and updates all widget instances using <code className="text-blue-500">goAsync()</code> without requiring the main app process.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
              <span className="font-bold text-slate-800 dark:text-slate-100 block">
                3. Android 12+ Mutability &amp; Alarms
              </span>
              <p className="text-slate-600 dark:text-slate-400">
                All PendingIntents specify <code className="text-blue-500">PendingIntent.FLAG_IMMUTABLE</code>. Exact alarms use <code className="text-blue-500">AlarmManager.setExactAndAllowWhileIdle()</code> with a fallback for security exception handling.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
              <span className="font-bold text-slate-800 dark:text-slate-100 block">
                4. Reboot &amp; Timezone Recovery
              </span>
              <p className="text-slate-600 dark:text-slate-400">
                <code className="text-blue-500">BootReceiver</code> listens to <code className="text-blue-500">BOOT_COMPLETED</code>, <code className="text-blue-500">TIME_SET</code>, and <code className="text-blue-500">TIMEZONE_CHANGED</code> to reschedule exact reminder alarms and refresh widget countdown numbers automatically.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
