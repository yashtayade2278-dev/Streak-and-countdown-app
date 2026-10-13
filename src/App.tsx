/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { DateTravelBanner } from './components/DateTravelBanner';
import { Dashboard } from './components/Dashboard';
import { GoalDetailView } from './components/GoalDetailView';
import { GoalModal } from './components/GoalModal';
import { CheckInModal } from './components/CheckInModal';
import { WidgetSimulator } from './components/WidgetSimulator';
import { TestRunnerView } from './components/TestRunnerView';
import { SettingsView } from './components/SettingsView';
import { storage } from './lib/storage';
import { getTodayLocalDate } from './lib/dateUtils';
import { Goal, CheckIn, WidgetInstance, AppSettings } from './types';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'widgets' | 'tests' | 'settings'>('dashboard');
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  // Storage state
  const [goals, setGoals] = useState<Goal[]>(() => storage.getGoals());
  const [checkIns, setCheckIns] = useState<CheckIn[]>(() => storage.getCheckIns());
  const [widgets, setWidgets] = useState<WidgetInstance[]>(() => storage.getWidgets());
  const [settings, setSettings] = useState<AppSettings>(() => storage.getSettings());

  // Modals state
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [checkInGoalId, setCheckInGoalId] = useState<string | null>(null);

  // Success confirmation notification
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = useCallback((message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3500);
  }, []);

  // Subscribe to storage changes
  useEffect(() => {
    const unsubscribe = storage.subscribe(() => {
      setGoals(storage.getGoals());
      setCheckIns(storage.getCheckIns());
      setWidgets(storage.getWidgets());
      setSettings(storage.getSettings());
    });
    return unsubscribe;
  }, []);

  // Today's local date based on simulated offset
  const todayDate = useMemo(() => {
    return getTodayLocalDate(settings.simulatedDateOffsetDays);
  }, [settings.simulatedDateOffsetDays]);

  // Sync dark mode class
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else if (settings.theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [settings.theme]);

  // Selected goal object
  const selectedGoal = useMemo(() => {
    if (!selectedGoalId) return null;
    return goals.find((g) => g.id === selectedGoalId) || null;
  }, [goals, selectedGoalId]);

  // Check-in target goal object
  const targetCheckInGoal = useMemo(() => {
    if (!checkInGoalId) return null;
    return goals.find((g) => g.id === checkInGoalId) || null;
  }, [goals, checkInGoalId]);

  // Check-in action handler
  const handlePerformCheckIn = (goalId: string, note?: string) => {
    try {
      const checkIn = storage.addCheckIn(goalId, todayDate, note);
      // "Confirm success only after saving."
      const g = goals.find((item) => item.id === goalId);
      showNotification(`Check-in recorded for "${g?.name || 'Goal'}"!`);
      setCheckInGoalId(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(msg);
    }
  };

  // Direct widget check-in
  const handleWidgetCheckIn = (goalId: string) => {
    handlePerformCheckIn(goalId, 'Widget Quick Check-in');
  };

  // Save Goal (create or edit)
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

  // Archive toggle
  const handleToggleArchive = (goalId: string) => {
    const updated = storage.toggleArchiveGoal(goalId);
    showNotification(
      updated.archived
        ? `Goal archived.`
        : `Goal restored to active dashboard.`
    );
  };

  // Delete goal
  const handleDeleteGoal = (goalId: string) => {
    const g = goals.find((item) => item.id === goalId);
    storage.deleteGoal(goalId);
    showNotification(`Goal "${g?.name || ''}" deleted.`);
    setSelectedGoalId(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-500 selection:text-white flex flex-col">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSelectedGoalId(null);
        }}
        onNewGoal={() => {
          setEditingGoal(null);
          setIsGoalModalOpen(true);
        }}
        activeGoalsCount={goals.filter((g) => !g.archived).length}
      />

      {/* Date Simulation & Midnight Crossing Toolbar */}
      <DateTravelBanner
        offsetDays={settings.simulatedDateOffsetDays}
        onSetOffset={(offset) => {
          storage.saveSettings({ simulatedDateOffsetDays: offset });
        }}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 pb-16">
        {selectedGoal ? (
          <GoalDetailView
            goal={selectedGoal}
            checkIns={checkIns}
            todayDate={todayDate}
            onBack={() => setSelectedGoalId(null)}
            onCheckIn={(id) => setCheckInGoalId(id)}
            onEdit={(g) => {
              setEditingGoal(g);
              setIsGoalModalOpen(true);
            }}
            onToggleArchive={handleToggleArchive}
            onDelete={handleDeleteGoal}
          />
        ) : activeTab === 'dashboard' ? (
          <Dashboard
            goals={goals}
            checkIns={checkIns}
            todayDate={todayDate}
            onSelectGoal={(id) => setSelectedGoalId(id)}
            onCheckIn={(id) => setCheckInGoalId(id)}
            onNewGoal={() => {
              setEditingGoal(null);
              setIsGoalModalOpen(true);
            }}
          />
        ) : activeTab === 'widgets' ? (
          <WidgetSimulator
            goals={goals}
            checkIns={checkIns}
            todayDate={todayDate}
            widgets={widgets}
            onUpdateWidgetGoal={(appWidgetId, goalId) => {
              storage.updateWidgetGoal(appWidgetId, goalId);
            }}
            onWidgetCheckIn={handleWidgetCheckIn}
            onSelectGoal={(id) => setSelectedGoalId(id)}
          />
        ) : activeTab === 'tests' ? (
          <TestRunnerView />
        ) : (
          <SettingsView
            settings={settings}
            onUpdateSettings={(updates) => storage.saveSettings(updates)}
            onDataRestored={() => {
              setGoals(storage.getGoals());
              setCheckIns(storage.getCheckIns());
            }}
          />
        )}
      </main>

      {/* Goal Modal (Create/Edit) */}
      <GoalModal
        goal={editingGoal}
        isOpen={isGoalModalOpen}
        onClose={() => {
          setIsGoalModalOpen(false);
          setEditingGoal(null);
        }}
        onSave={handleSaveGoal}
      />

      {/* Check-in Modal */}
      {targetCheckInGoal && (
        <CheckInModal
          goal={targetCheckInGoal}
          todayDate={todayDate}
          isOpen={Boolean(checkInGoalId)}
          onClose={() => setCheckInGoalId(null)}
          onConfirm={(note) => handlePerformCheckIn(targetCheckInGoal.id, note)}
        />
      )}

      {/* Confirmation feedback Toast (confirms only after saving) */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white border border-slate-700/80 rounded-2xl px-4 py-3 shadow-xl flex items-center gap-2.5 text-xs animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{notification}</span>
        </div>
      )}
    </div>
  );
}
