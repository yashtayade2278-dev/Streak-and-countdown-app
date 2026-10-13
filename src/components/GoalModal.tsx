import React, { useState, useEffect } from 'react';
import { X, Calendar, Bell, Sparkles } from 'lucide-react';
import { Goal } from '../types';
import { addDays, getTodayLocalDate, isValidDateStr } from '../lib/dateUtils';

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
    colorScheme?: Goal['colorScheme'];
  }) => void;
}

export const GoalModal: React.FC<GoalModalProps> = ({
  goal,
  isOpen,
  onClose,
  onSave,
}) => {
  const isEditing = Boolean(goal);
  const defaultTarget = addDays(getTodayLocalDate(0), 30);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState(defaultTarget);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('20:00');
  const [colorScheme, setColorScheme] = useState<Goal['colorScheme']>('indigo');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (goal) {
      setName(goal.name);
      setDescription(goal.description || '');
      setTargetDate(goal.targetDate);
      setReminderEnabled(goal.reminderEnabled);
      setReminderTime(goal.reminderTime || '20:00');
      setColorScheme(goal.colorScheme || 'indigo');
    } else {
      setName('');
      setDescription('');
      setTargetDate(defaultTarget);
      setReminderEnabled(true);
      setReminderTime('20:00');
      setColorScheme('indigo');
    }
    setError(null);
  }, [goal, isOpen, defaultTarget]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a goal name.');
      return;
    }
    if (!isValidDateStr(targetDate)) {
      setError('Please select a valid target date (YYYY-MM-DD).');
      return;
    }

    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      targetDate,
      reminderEnabled,
      reminderTime: reminderEnabled ? reminderTime : undefined,
      colorScheme,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
              {isEditing ? 'Edit Goal & Target Date' : 'Create New Goal'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          {/* Goal Name */}
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Goal Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 10km Marathon Pace, Read 20 Books, JLPT N2"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Target Date */}
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              <span>Target Event Date</span> <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
            {isEditing && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Changing target date recalculates future and past countdowns instantly without altering your recorded check-in history.
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are the daily check-in criteria or milestone habits?"
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Reminder Toggle */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500" />
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                  Daily Check-in Reminder
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  Alerts only when today's check-in is pending; suppressed after check-in.
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Reminder Time */}
          {reminderEnabled && (
            <div className="pl-2">
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Reminder Time (24h)
              </label>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Color accent */}
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Theme Accent
            </label>
            <div className="flex items-center gap-2">
              {(['indigo', 'emerald', 'amber', 'rose', 'slate'] as const).map((c) => {
                const colorMap = {
                  indigo: 'bg-indigo-600',
                  emerald: 'bg-emerald-600',
                  amber: 'bg-amber-600',
                  rose: 'bg-rose-600',
                  slate: 'bg-slate-600',
                };
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColorScheme(c)}
                    className={`w-7 h-7 rounded-lg ${colorMap[c]} flex items-center justify-center transition-transform ${
                      colorScheme === c ? 'ring-2 ring-offset-2 ring-blue-500 scale-105' : 'opacity-70 hover:opacity-100'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Footer actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-sm active:scale-[0.98] transition-all"
            >
              {isEditing ? 'Save Changes' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
