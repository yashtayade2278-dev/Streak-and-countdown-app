import React from "react";
import { Flame } from "lucide-react";

interface HeaderProps {
  activeGoalsCount: number;
  onHome: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeGoalsCount, onHome }) => (
  <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
    <button
      type="button"
      onClick={onHome}
      className="flex h-[76px] w-full items-center gap-3 px-5 text-left"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
        <Flame className="h-7 w-7" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[21px] font-extrabold leading-tight text-slate-950 dark:text-white">
          Streak &amp; Countdown
        </span>
        <span className="mt-0.5 block text-sm text-slate-500 dark:text-slate-400">
          {activeGoalsCount} active {activeGoalsCount === 1 ? "goal" : "goals"}
        </span>
      </span>
    </button>
  </header>
);
