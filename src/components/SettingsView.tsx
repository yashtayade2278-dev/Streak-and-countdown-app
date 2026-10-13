import React, { useState, useRef } from 'react';
import {
  Settings as SettingsIcon,
  Bell,
  Moon,
  Sun,
  Download,
  Upload,
  Shield,
  Smartphone,
  Check,
  AlertCircle,
  FileCode,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { AppSettings } from '../types';
import { generateAndroidProjectZip } from '../lib/androidProjectGenerator';
import { storage } from '../lib/storage';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
  onDataRestored: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onDataRestored,
}) => {
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [backupMessage, setBackupMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadAndroidZip = async () => {
    try {
      setIsExportingZip(true);
      const zipBlob = await generateAndroidProjectZip();
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'StreakCountdown-Android-Kotlin-Project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert('Failed to generate zip: ' + msg);
    } finally {
      setIsExportingZip(false);
    }
  };

  const handleExportJsonBackup = () => {
    const jsonStr = storage.exportBackupJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `streak-countdown-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setBackupMessage({ type: 'success', text: 'Backup JSON downloaded successfully.' });
    setTimeout(() => setBackupMessage(null), 3500);
  };

  const handleImportJsonBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = storage.importBackupJson(content);
      if (result.success) {
        setBackupMessage({ type: 'success', text: result.message });
        onDataRestored();
      } else {
        setBackupMessage({ type: 'error', text: result.message });
      }
      setTimeout(() => setBackupMessage(null), 4000);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-blue-500" />
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Settings &amp; Android APK Build Kit
          </h1>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Configure preferences, reminders, backup files, and build the installable Android APK.
        </p>
      </div>

      {backupMessage && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
            backupMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          {backupMessage.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          )}
          <span>{backupMessage.text}</span>
        </div>
      )}

      {/* 1. Android APK & Kotlin Project Download Card */}
      <div className="bg-gradient-to-br from-blue-900/20 via-indigo-900/10 to-slate-900/30 border border-blue-500/30 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-blue-400 font-bold uppercase tracking-wider">
              <Smartphone className="w-4 h-4" />
              <span>Installable Android Application Setup</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Download Native Android Project &amp; APK Kit
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xl">
              Includes full Kotlin source code, Room (SQLite) database, two native AppWidgetProviders with RemoteViews, AndroidManifest, Gradle 8.4 build configuration, and unit tests ready to compile.
            </p>
          </div>

          <button
            onClick={handleDownloadAndroidZip}
            disabled={isExportingZip}
            className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white text-xs font-bold shadow-md shadow-blue-600/30 active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0"
          >
            {downloadSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Downloaded (.zip)!</span>
              </>
            ) : isExportingZip ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Packaging Project...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download Android Project (.zip)</span>
              </>
            )}
          </button>
        </div>

        {/* Step-by-step instructions for Replit / Android phone */}
        <div className="mt-5 pt-4 border-t border-blue-500/20 space-y-3 text-xs">
          <span className="font-bold text-slate-800 dark:text-slate-200 block">
            How to Build the APK on your Android Phone (Replit / Termux) or PC:
          </span>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 font-mono text-slate-300">
              <div className="flex items-center gap-1.5 text-blue-400 font-bold mb-1">
                <Terminal className="w-3.5 h-3.5" />
                <span>Option 1: Replit / Termux Shell</span>
              </div>
              <p className="text-slate-400 font-sans mb-1.5">
                Run in shell to compile debug APK directly:
              </p>
              <code>chmod +x ./gradlew</code><br />
              <code>./gradlew assembleDebug</code>
              <p className="text-[10px] text-slate-500 font-sans mt-1.5">
                APK output: <span className="text-emerald-400">app/build/outputs/apk/debug/app-debug.apk</span>
              </p>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-slate-300">
              <div className="flex items-center gap-1.5 text-blue-400 font-bold mb-1">
                <Smartphone className="w-3.5 h-3.5" />
                <span>Option 2: Android Studio or GitHub CI</span>
              </div>
              <p className="text-slate-400 mb-1.5">
                Extract the zip and open the folder in Android Studio. Select <strong>Build &gt; Build APK(s)</strong>.
              </p>
              <p className="text-[10px] text-slate-400">
                Supports Vivo, Oppo, Samsung, iQOO, and Motorola devices running Android 12+.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Notifications & Reminders */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-500" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Daily Reminders &amp; Notification Rules
          </h2>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 block">
              Enable Daily Notifications
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
              Dispatches exact AlarmManager notifications when a goal is pending.
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.notificationsEnabled}
              onChange={(e) => onUpdateSettings({ notificationsEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {settings.notificationsEnabled && (
          <div className="flex items-center justify-between py-1 text-xs">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                Default Reminder Time
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                Scheduled daily; automatically suppressed once today is checked in.
              </span>
            </div>
            <input
              type="time"
              value={settings.defaultReminderTime}
              onChange={(e) => onUpdateSettings({ defaultReminderTime: e.target.value })}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      {/* 3. Appearance & Theme */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3 text-xs">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Moon className="w-4 h-4 text-blue-500" />
          <span>Appearance &amp; Theme</span>
        </h2>

        <div className="flex items-center gap-2 pt-1">
          {(['system', 'light', 'dark'] as const).map((t) => (
            <button
              key={t}
              onClick={() => onUpdateSettings({ theme: t })}
              className={`px-3 py-1.5 rounded-xl font-semibold capitalize transition-colors ${
                settings.theme === t
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Data Backup & Restore */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4 text-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Data Backup &amp; Portability
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Export and restore all goals, check-ins, timeline notes, and widget configurations.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={handleExportJsonBackup}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Backup JSON</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Restore from JSON</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportJsonBackup}
            className="hidden"
          />
        </div>
      </div>

      {/* 5. Privacy & Offline Integrity */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-2 text-xs">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
          <Shield className="w-4 h-4 text-emerald-500" />
          <span>100% Offline &amp; Privacy First</span>
        </div>
        <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
          Streak &amp; Countdown requires no account registration, no subscriptions, no tracking telemetry, and no network connections. All goal definitions, check-in records, and timeline events are stored securely on your local device.
        </p>
      </div>
    </div>
  );
};
