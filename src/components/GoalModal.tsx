import React, { useEffect, useRef, useState } from "react";
import { X, Calendar, Bell } from "lucide-react";
import { Goal } from "../types";
import { getTodayLocalDate, isValidDateStr } from "../lib/dateUtils";

interface GoalModalProps {
  goal?: Goal | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    description?: string;
    targetDate: string;
    reminderEnabled: boolean;
    reminderTime?: string;
    colorScheme?: Goal["colorScheme"];
  }) => void;
}
const displayDate = (value: string) =>
  value ? value.split("-").reverse().join("-") : "DD-MM-YYYY";

export const GoalModal: React.FC<GoalModalProps> = ({
  goal,
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [pickerDate, setPickerDate] = useState("");
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState("20:00");
  const [error, setError] = useState<string | null>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    setName(goal?.name || "");
    setDescription(goal?.description || "");
    setTargetDate(goal?.targetDate || "");
    setPickerDate(goal?.targetDate || getTodayLocalDate(0));
    setReminderEnabled(goal?.reminderEnabled || false);
    setReminderTime(goal?.reminderTime || "20:00");
    setError(null);
  }, [goal, isOpen]);
  if (!isOpen) return null;
  const openDate = () => {
    setPickerDate(targetDate || getTodayLocalDate(0));
    requestAnimationFrame(() => {
      const el = dateRef.current;
      if (!el) return;
      if ("showPicker" in el)
        (el as HTMLInputElement & { showPicker: () => void }).showPicker();
      else el.click();
    });
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Enter a goal name.");
    if (!isValidDateStr(targetDate)) return setError("Select a target date.");
    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      targetDate,
      reminderEnabled,
      reminderTime: reminderEnabled ? reminderTime : undefined,
      colorScheme: goal?.colorScheme || "indigo",
    });
  };
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white dark:bg-slate-950">
      <div className="sticky top-0 z-10 flex h-16 items-center border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-950">
        <button
          type="button"
          onClick={onClose}
          className="flex h-11 w-11 items-center justify-center rounded-xl"
        >
          <X className="h-6 w-6" />
        </button>
        <h1 className="ml-2 text-xl font-bold">
          {goal ? "Edit Goal" : "Create a New Goal"}
        </h1>
      </div>
      <form
        onSubmit={submit}
        className="mx-auto max-w-lg space-y-5 px-5 py-6 pb-[calc(110px+env(safe-area-inset-bottom))]"
      >
        {error && (
          <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </div>
        )}
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Goal Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Drink Water"
            className="h-13 w-full rounded-xl border border-slate-300 bg-transparent px-4 text-base outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">
            Description (optional)
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="What do you want to achieve?"
            className="w-full resize-none rounded-xl border border-slate-300 bg-transparent p-4 text-base outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700"
          />
        </label>
        <div>
          <span className="mb-2 block text-sm font-semibold">Target Date</span>
          <button
            type="button"
            onClick={openDate}
            className="flex h-14 w-full items-center gap-3 rounded-xl border border-slate-300 px-4 text-left text-base dark:border-slate-700"
          >
            <Calendar className="h-5 w-5 text-blue-600" />
            <span className={targetDate ? "" : "text-slate-400"}>
              {displayDate(targetDate)}
            </span>
          </button>
          <input
            ref={dateRef}
            type="date"
            value={pickerDate}
            min={getTodayLocalDate(0)}
            onChange={(e) => {
              setPickerDate(e.target.value);
              setTargetDate(e.target.value);
            }}
            className="pointer-events-none absolute h-px w-px opacity-0"
            tabIndex={-1}
          />
        </div>
        <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 font-semibold">
              <Bell className="h-5 w-5 text-amber-500" />
              Reminder
            </span>
            <input
              type="checkbox"
              checked={reminderEnabled}
              onChange={(e) => setReminderEnabled(e.target.checked)}
              className="h-6 w-6"
            />
          </div>
          {reminderEnabled && (
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="mt-4 h-12 w-full rounded-xl border border-slate-300 bg-transparent px-4 dark:border-slate-700"
            />
          )}
        </div>
        <button
          type="submit"
          className="fixed bottom-[calc(16px+env(safe-area-inset-bottom))] left-5 right-5 mx-auto h-14 max-w-lg rounded-2xl bg-blue-600 text-base font-bold text-white shadow-xl"
        >
          {goal ? "Save Changes" : "Create Goal"}
        </button>
      </form>
    </div>
  );
};
