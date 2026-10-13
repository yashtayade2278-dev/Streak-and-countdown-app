/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { GoalDetailView } from './components/GoalDetailView';
import { GoalModal } from './components/GoalModal';
import { CheckInModal } from './components/CheckInModal';
import { SettingsView } from './components/SettingsView';
import { storage } from './lib/storage';
import { getTodayLocalDate } from './lib/dateUtils';
import { Goal, CheckIn, AppSettings } from './types';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings'>(
    'dashboard'
  );
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  // Storage state
  const [goals, setGoals] = useState<Goal[]>(() => storage.getGoals());
  const [checkIns, setCheckIns] = useState<CheckIn[]>(() =>
    storage.getCheckIns()
  );
  const [settings, setSettings] = useState<AppSettings>(() =>
    storage.getSettings()
  );

  // Modal state
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [checkInGoalId, setCheckInGoalId] = useState<string | null>(null);

  // Success confirmation notification
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = useCallback((message: string) => {
    setNotification(message);
    window.setTimeout(() => setNotification(null), 3500);
  }, []);

  // Subscribe to storage changes
  useEffect(() => {
    const unsubscribe = storage.subscribe(() => {
      setGoals(storage.getGoals());
      setCheckIns(storage.getCheckIns());
      setSettings(storage.getSettings());
    });

    return unsubscribe;
  }, []);

  // Always use the actual local date in production.
  const todayDate = useMemo(() => getTodayLocalDate(0), []);

  // Sync dark mode class
  useEffect(() => {
    const root = document.documentElement;

    if (settings.theme === 'dark') {
      root.classList.add('dark');
      return;
    }

    if (settings.theme === 'light') {
      root.classList.remove('dark');
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const syncSystemTheme = () => {
      root.classList.toggle('dark', mediaQuery.matches);
    };

    syncSystemTheme();
    mediaQuery.addEventListener('change', syncSystemTheme);

    return () => {
      mediaQuery.removeEventListener('change', syncSystemTheme);
    };
  }, [settings.theme]);

  // Selected goal object
  const selectedGoal = useMemo(() => {
    if (!selectedGoalId) return null;
    return goals.find((goal) => goal.id === selectedGoalId) || null;
  }, [goals, selectedGoalId]);

  // Check-in target goal object
  const targetCheckInGoal = useMemo(() => {
    if (!checkInGoalId) return null;
    return goals.find((goal) => goal.id === checkInGoalId) || null;
  }, [goals, checkInGoalId]);

  // Check-in action handler
  const handlePerformCheckIn = (goalId: string, note?: string) => {
    try {
      storage.addCheckIn(goalId, todayDate, note);

      const goal = goals.find((item) => item.id === goalId);
      showNotification(
        `Check-in recorded for "${goal?.name || 'Goal'}"!`
      );
      setCheckInGoalId(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      window.alert(message);
    }
  };

  // Save a goal, either by creating it or updating it.
  const handleSaveGoal = (data: {
    name: string;
    description?: string;
    targetDate: string;
    reminderEnabled: boolean;
    reminderTime?: string;
    colorScheme?: Goal['colorScheme'];
  }) => {
    if (editingGoal) {
      storage.updateGoal(editingGoal.id, data);
      showNotification(`Goal "${data.name}" updated successfully.`);
    } else {
      const created = storage.createGoal(data);
      showNotification(`New goal "${created.name}" established!`);
    }

    setIsGoalModalOpen(false);
    setEditingGoal(null);
  };

  // Archive or restore a goal.
  const handleToggleArchive = (goalId: string) => {
    const updated = storage.toggleArchiveGoal(goalId);

    showNotification(
      updated.archived
        ? 'Goal archived.'
        : 'Goal restored to active dashboard.'
    );
  };

  // Delete a goal.
  const handleDeleteGoal = (goalId: string) => {
    const goal = goals.find((item) => item.id === goalId);

    storage.deleteGoal(goalId);
    showNotification(`Goal "${goal?.name || ''}" deleted.`);
    setSelectedGoalId(null);
  };

  const openNewGoalModal = () => {
    setEditingGoal(null);
    setIsGoalModalOpen(true);
  };

  return (
    <div className="min-h-screen w-full min-w-0 max-w-full overflow-x-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-500 selection:text-white flex flex-col">
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSelectedGoalId(null);
        }}
        onNewGoal={openNewGoalModal}
        activeGoalsCount={goals.filter((goal) => !goal.archived).length}
      />

      <main className="flex-1 w-full min-w-0 max-w-full overflow-x-hidden pb-16">
        {selectedGoal ? (
          <GoalDetailView
            goal={selectedGoal}
            checkIns={checkIns}
            todayDate={todayDate}
            onBack={() => setSelectedGoalId(null)}
            onCheckIn={(id) => setCheckInGoalId(id)}
            onEdit={(goal) => {
              setEditingGoal(goal);
              setIsGoalModalOpen(true);
            }}
            onToggleArchive={handleToggleArchive}
            onDelete={handleDeleteGoal}
          />
        ) : activeTab === 'settings' ? (
          <SettingsView
            settings={settings}
            onUpdateSettings={(updates) => storage.saveSettings(updates)}
            onDataRestored={() => {
              setGoals(storage.getGoals());
              setCheckIns(storage.getCheckIns());
            }}
          />
        ) : (
          <Dashboard
            goals={goals}
            checkIns={checkIns}
            todayDate={todayDate}
            onSelectGoal={(id) => setSelectedGoalId(id)}
            onCheckIn={(id) => setCheckInGoalId(id)}
            onNewGoal={openNewGoalModal}
          />
        )}
      </main>

      <GoalModal
        goal={editingGoal}
        isOpen={isGoalModalOpen}
        onClose={() => {
          setIsGoalModalOpen(false);
          setEditingGoal(null);
        }}
        onSave={handleSaveGoal}
      />

      {targetCheckInGoal && (
        <CheckInModal
          goal={targetCheckInGoal}
          todayDate={todayDate}
          isOpen={Boolean(checkInGoalId)}
          onClose={() => setCheckInGoalId(null)}
          onConfirm={(note) =>
            handlePerformCheckIn(targetCheckInGoal.id, note)
          }
        />
      )}

      {notification && (
        <div className="fixed left-4 right-4 bottom-6 z-50 mx-auto max-w-sm bg-slate-900 text-white border border-slate-700/80 rounded-2xl px-4 py-3 shadow-xl flex items-center gap-2.5 text-xs animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="min-w-0 break-words font-medium">
            {notification}
          </span>
        </div>
      )}
    </div>
  );
}
