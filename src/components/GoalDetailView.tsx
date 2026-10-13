import React, { useState } from "react";
import {
  ArrowLeft,
  Archive,
  CheckCircle2,
  Edit2,
  Home,
  Trash2,
} from "lucide-react";
import { CheckIn, Goal } from "../types";
import { calculateGoalMetrics } from "../lib/streakEngine";
import { formatDisplayDate } from "../lib/dateUtils";
interface Props {
  goal: Goal;
  checkIns: CheckIn[];
  todayDate: string;
  onBack: () => void;
  onCheckIn: (id: string) => void;
  onEdit: (g: Goal) => void;
  onToggleArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onAddWidget: (id: string) => void;
}
export const GoalDetailView: React.FC<Props> = ({
  goal,
  checkIns,
  todayDate,
  onBack,
  onCheckIn,
  onEdit,
  onToggleArchive,
  onDelete,
  onAddWidget,
}) => {
  const [confirm, setConfirm] = useState(false);
  const m = calculateGoalMetrics(goal, checkIns, todayDate);
  const recent = checkIns
    .filter((c) => c.goalId === goal.id)
    .sort((a, b) => b.localDate.localeCompare(a.localDate));
  return (
    <main className="mx-auto w-full max-w-lg px-4 pb-24 pt-4">
      <div className="mb-5 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex h-11 w-11 items-center justify-center rounded-xl"
        >
          <ArrowLeft />
        </button>
        <div className="flex">
          <button onClick={() => onEdit(goal)} className="h-11 w-11">
            <Edit2 className="mx-auto" />
          </button>
          <button
            onClick={() => onToggleArchive(goal.id)}
            className="h-11 w-11"
          >
            <Archive className="mx-auto" />
          </button>
          <button
            onClick={() => setConfirm(true)}
            className="h-11 w-11 text-rose-600"
          >
            <Trash2 className="mx-auto" />
          </button>
        </div>
      </div>
      <h1 className="text-3xl font-extrabold">{goal.name}</h1>
      {goal.description && (
        <p className="mt-2 text-base text-slate-500">{goal.description}</p>
      )}
      <div className="mt-5 grid grid-cols-2 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
        {[
          ["Current Streak", `${m.currentStreak} days`],
          ["Longest Streak", `${m.longestStreak} days`],
          ["Target Date", formatDisplayDate(goal.targetDate)],
          ["Days Left", m.currentCountdown.displayText],
        ].map(([a, b]) => (
          <div
            key={a}
            className="min-h-24 border-b border-r border-slate-200 p-4 dark:border-slate-800"
          >
            <span className="block text-sm text-slate-500">{a}</span>
            <strong className="mt-1 block text-xl">{b}</strong>
          </div>
        ))}
      </div>
      {!m.isCheckedInToday && (
        <button
          onClick={() => onCheckIn(goal.id)}
          className="mt-5 h-14 w-full rounded-2xl bg-blue-600 text-base font-bold text-white"
        >
          Check In Today
        </button>
      )}
      <button
        onClick={() => onAddWidget(goal.id)}
        className="mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-blue-300 font-bold text-blue-700"
      >
        <Home />
        Add to Home Screen
      </button>
      <h2 className="mb-3 mt-7 text-xl font-bold">Recent Check-ins</h2>
      <div className="space-y-2">
        {recent.map((c) => (
          <div
            key={c.id}
            className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800"
          >
            <CheckCircle2 className="text-emerald-500" />
            <span>{formatDisplayDate(c.localDate)}</span>
          </div>
        ))}
        {!recent.length && <p className="text-slate-500">No check-ins yet.</p>}
      </div>
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/60 p-4">
          <div className="w-full rounded-2xl bg-white p-5 dark:bg-slate-900">
            <h3 className="text-xl font-bold">Delete goal?</h3>
            <p className="mt-2">This cannot be undone.</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={() => setConfirm(false)}
                className="h-12 rounded-xl bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={() => onDelete(goal.id)}
                className="h-12 rounded-xl bg-rose-600 text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
