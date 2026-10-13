import React from 'react';
import {
  Plus,
  Flame,
  Settings as SettingsIcon,
  ListChecks,
} from 'lucide-react';

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
    <header className="sticky top-0 z-30 w-full max-w-full overflow-hidden bg-slate-900/95 text-slate-100 backdrop-blur-md border-b border-slate-800">
      <div className="w-full min-w-0 h-16 px-3 sm:px-6 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className="min-w-0 flex-1 flex items-center gap-2 text-left"
          aria-label="Open goals"
        >
          <span className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white">
            <Flame className="w-5 h-5 text-amber-300 fill-amber-300/30" />
          </span>

          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-white">
              Streak &amp; Countdown
            </span>

            <span className="block text-[10px] text-slate-400">
              {activeGoalsCount} active
            </span>
          </span>
        </button>

        <nav className="shrink-0 flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
            aria-label="Goals"
            title="Goals"
          >
            <ListChecks className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
            aria-label="Settings"
            title="Settings"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={onNewGoal}
            className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-colors"
            aria-label="Create new goal"
            title="New goal"
          >
            <Plus className="w-5 h-5" />
          </button>
        </nav>
      </div>
    </header>
  );
};
