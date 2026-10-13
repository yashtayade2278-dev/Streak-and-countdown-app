import React, { useRef, useState } from 'react';
import {
  Settings as SettingsIcon,
  Bell,
  Download,
  Upload,
  Shield,
  Check,
  AlertCircle,
} from 'lucide-react';
import { AppSettings } from '../types';
import { storage } from '../lib/storage';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
  onDataRestored: () => void;
}

type BackupMessage = {
  type: 'success' | 'error';
  text: string;
};

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onDataRestored,
}) => {
  const [backupMessage, setBackupMessage] =
    useState<BackupMessage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageTimerRef = useRef<number | null>(null);

  const showBackupMessage = (message: BackupMessage) => {
    setBackupMessage(message);

    if (messageTimerRef.current !== null) {
      window.clearTimeout(messageTimerRef.current);
    }

    messageTimerRef.current = window.setTimeout(() => {
      setBackupMessage(null);
      messageTimerRef.current = null;
    }, 4000);
  };

  const handleExportJsonBackup = () => {
    try {
      const jsonString = storage.exportBackupJson();
      const blob = new Blob([jsonString], {
        type: 'application/json;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];

      anchor.href = url;
      anchor.download = `streak-countdown-backup-${date}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

      showBackupMessage({
        type: 'success',
        text: 'Backup downloaded successfully.',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);

      showBackupMessage({
        type: 'error',
        text: `Unable to export backup: ${message}`,
      });
    }
  };

  const handleImportJsonBackup = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = (loadEvent) => {
      const resultValue = loadEvent.target?.result;

      if (typeof resultValue !== 'string') {
        showBackupMessage({
          type: 'error',
          text: 'The selected backup file could not be read.',
        });
        return;
      }

      const result = storage.importBackupJson(resultValue);

      showBackupMessage({
        type: result.success ? 'success' : 'error',
        text: result.message,
      });

      if (result.success) {
        onDataRestored();
      }
    };

    reader.onerror = () => {
      showBackupMessage({
        type: 'error',
        text: 'The selected backup file could not be read.',
      });
    };

    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className="w-full min-w-0 max-w-4xl mx-auto overflow-x-hidden px-4 py-4 sm:px-6 sm:py-6 space-y-6 animate-in fade-in duration-150">
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <SettingsIcon className="h-5 w-5 shrink-0 text-blue-500" />
          <h1 className="min-w-0 text-xl font-bold text-slate-900 dark:text-white">
            Settings
          </h1>
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Reminders and backup.
        </p>
      </div>

      {backupMessage && (
        <div
          role="status"
          className={`flex min-w-0 items-start gap-2 rounded-xl border p-3 text-xs ${
            backupMessage.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200'
              : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-200'
          }`}
        >
          {backupMessage.type === 'success' ? (
            <Check className="h-4 w-4 shrink-0 text-emerald-500" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
          )}
          <span className="min-w-0 break-words">{backupMessage.text}</span>
        </div>
      )}

      <section className="min-w-0 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="flex min-w-0 items-center gap-2">
          <Bell className="h-4 w-4 shrink-0 text-amber-500" />
          <h2 className="min-w-0 text-sm font-bold text-slate-900 dark:text-white">
            Reminders
          </h2>
        </div>

        <div className="flex min-w-0 items-center justify-between gap-4 border-b border-slate-100 py-2 dark:border-slate-800">
          <div className="min-w-0">
            <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
              Enable Notifications
            </span>
            <span className="block break-words text-[11px] text-slate-500 dark:text-slate-400">
              Allow reminders for goals that have notifications enabled.
            </span>
          </div>

          <label className="relative inline-flex shrink-0 cursor-pointer items-center">
            <input
              type="checkbox"
              checked={settings.notificationsEnabled}
              onChange={(event) =>
                onUpdateSettings({
                  notificationsEnabled: event.target.checked,
                })
              }
              className="peer sr-only"
              aria-label="Enable notifications"
            />
            <span className="h-6 w-11 rounded-full bg-slate-300 transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 peer-focus-visible:ring-offset-2 dark:bg-slate-700 dark:peer-focus-visible:ring-offset-slate-900" />
          </label>
        </div>

        {settings.notificationsEnabled && (
          <div className="flex min-w-0 flex-col gap-3 py-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                Default Reminder Time
              </span>
              <span className="block break-words text-[11px] text-slate-500 dark:text-slate-400">
                Used as the default time when reminders are enabled.
              </span>
            </div>

            <input
              type="time"
              value={settings.defaultReminderTime}
              onChange={(event) =>
                onUpdateSettings({
                  defaultReminderTime: event.target.value,
                })
              }
              aria-label="Default reminder time"
              className="min-h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 sm:w-auto sm:text-sm"
            />
          </div>
        )}
      </section>


      <section className="min-w-0 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 text-xs shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Data Backup
          </h2>
          <p className="mt-0.5 break-words text-[11px] text-slate-500 dark:text-slate-400">
            Export or restore your goals and check-ins.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleExportJsonBackup}
            className="flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-xl bg-slate-100 px-3.5 py-2 font-semibold text-slate-800 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Download className="h-4 w-4 shrink-0" />
            <span className="truncate">Export Backup</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-xl bg-slate-100 px-3.5 py-2 font-semibold text-slate-800 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Upload className="h-4 w-4 shrink-0" />
            <span className="truncate">Restore Backup</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportJsonBackup}
            className="hidden"
          />
        </div>
      </section>

    </div>
  );
};
