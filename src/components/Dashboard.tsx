import React, { useState } from "react";
import { CheckCircle2, ChevronRight, Flame, Home, Search } from "lucide-react";
import { CheckIn, Goal } from "../types";
import { calculateGoalMetrics } from "../lib/streakEngine";
interface Props {
  goals: Goal[];
  checkIns: CheckIn[];
  todayDate: string;
  onSelectGoal: (id: string) => void;
  onCheckIn: (id: string) => void;
  onAddWidget: (id: string) => void;
}
export const Dashboard: React.FC<Props> = ({
  goals,
  checkIns,
  todayDate,
  onSelectGoal,
  onCheckIn,
  onAddWidget,
}) => {
  const [q, setQ] = useState("");
  const shown = goals.filter(
    (g) => !g.archived && g.name.toLowerCase().includes(q.toLowerCase()),
  );
  const done = goals.filter(
    (g) =>
      !g.archived &&
      calculateGoalMetrics(g, checkIns, todayDate).isCheckedInToday,
  ).length;
  return (
    <main className="mx-auto w-full max-w-lg px-4 pb-28 pt-5">
      <section className="mb-5">
        <h1 className="text-2xl font-extrabold">Today</h1>
        <p className="text-base text-slate-500">
          {new Date(todayDate + "T00:00:00").toLocaleDateString(undefined, {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </section>
      <section className="mb-5 rounded-2xl bg-blue-50 p-5 dark:bg-blue-950/30">
        <p className="text-lg font-bold">
          {done} of {goals.filter((g) => !g.archived).length} completed
        </p>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-blue-100 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-blue-600"
            style={{
              width: `${goals.length ? (done / goals.filter((g) => !g.archived).length) * 100 : 0}%`,
            }}
          />
        </div>
      </section>
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search goals"
          className="h-13 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-base dark:border-slate-800 dark:bg-slate-900"
        />
      </div>
      <div className="space-y-3">
        {shown.map((goal) => {
          const m = calculateGoalMetrics(goal, checkIns, todayDate);
          return (
            <article
              key={goal.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <button
                onClick={() => onSelectGoal(goal.id)}
                className="flex w-full items-center gap-3 text-left"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50">
                  <Flame className="h-6 w-6" />
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-lg">
                    {goal.name}
                  </strong>
                  <span className="text-sm text-slate-500">
                    {m.currentStreak} day streak ·{" "}
                    {m.currentCountdown.displayText}
                  </span>
                </span>
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {m.isCheckedInToday ? (
                  <div className="flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-50 font-semibold text-emerald-700">
                    <CheckCircle2 className="h-5 w-5" />
                    Done
                  </div>
                ) : (
                  <button
                    onClick={() => onCheckIn(goal.id)}
                    className="h-12 rounded-xl bg-blue-600 font-semibold text-white"
                  >
                    Check In
                  </button>
                )}
                <button
                  onClick={() => onAddWidget(goal.id)}
                  className="flex h-12 items-center justify-center gap-2 rounded-xl border border-blue-200 font-semibold text-blue-700 dark:border-blue-800 dark:text-blue-300"
                >
                  <Home className="h-5 w-5" />
                  Home Screen
                </button>
              </div>
            </article>
          );
        })}
      </div>
      {shown.length === 0 && (
        <div className="py-16 text-center text-slate-500">
          No goals yet. Tap + to create one.
        </div>
      )}
    </main>
  );
};
