import React from 'react';
import { Plus, Flame, Clock, Layers, CheckCircle2, Settings as SettingsIcon } from 'lucide-react';

interface HeaderProps {
  activeTab: 'dashboard' | 'widgets' | 'tests' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'widgets' | 'tests' | 'settings') => void;
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
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Flame className="w-5 h-5 text-amber-300 fill-amber-300/30" />
          </div>
          <button
            onClick={() => setActiveTab('dashboard')}
            className="text-left font-bold text-lg tracking-tight text-white hover:text-blue-400 transition-colors whitespace-nowrap"
          >
            Streak &amp; Countdown
          </button>
        </div>

        {/* Zone 2: Navigation tabs with single-line items */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Goals
          </button>

          <button
            onClick={() => setActiveTab('widgets')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === 'widgets'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Home</span> Widgets
          </button>

          <button
            onClick={() => setActiveTab('tests')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === 'tests'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Tests</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <SettingsIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Settings &amp; APK</span>
          </button>
        </nav>

        {/* Zone 3: Primary action button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onNewGoal}
            className="h-9 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-[0.98] transition-all whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline">New Goal</span>
          </button>
        </div>
      </div>
    </header>
  );
};
