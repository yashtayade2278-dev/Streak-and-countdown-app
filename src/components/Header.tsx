import React from 'react';
import { Flame, Plus, Settings as SettingsIcon, ListChecks } from 'lucide-react';

interface HeaderProps {
  activeTab: 'dashboard' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'settings') => void;
  onNewGoal: () => void;
  activeGoalsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onNewGoal,
  activeGoalsCount,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
      <div className="flex h-16 w-full items-center gap-3 px-4">
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          aria-label="Open goals"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
            <Flame className="h-6 w-6" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-lg font-extrabold leading-tight text-slate-950 dark:text-white">
              Streak &amp; Countdown
            </span>
            <span className="block text-sm text-slate-500 dark:text-slate-400">
              {activeGoalsCount} active {activeGoalsCount === 1 ? 'goal' : 'goals'}
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab(activeTab === 'settings' ? 'dashboard' : 'settings')}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
          aria-label={activeTab === 'settings' ? 'Open goals' : 'Open settings'}
        >
          {activeTab === 'settings' ? <ListChecks className="h-5 w-5" /> : <SettingsIcon className="h-5 w-5" />}
        </button>

        <button
          type="button"
          onClick={onNewGoal}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white"
          aria-label="Create goal"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
};
