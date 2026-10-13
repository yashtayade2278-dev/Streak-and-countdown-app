/**
 * Persistent Local Storage Engine (SQLite/Room Mirror)
 * 
 * Provides an offline-first storage layer matching Room/SQLite entities with:
 * - Database-level unique constraint on (goalId, localDate)
 * - Atomic saves, error handling, and change broadcasts
 * - Full export/import capabilities
 */

import { AppSettings, CheckIn, Goal, WidgetInstance } from '../types';
import { addDays, getTodayLocalDate } from './dateUtils';

const STORAGE_KEYS = {
  GOALS: 'sc_goals_v1',
  CHECK_INS: 'sc_check_ins_v1',
  WIDGETS: 'sc_widgets_v1',
  SETTINGS: 'sc_settings_v1',
};

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  notificationsEnabled: true,
  defaultReminderTime: '20:00',
  hapticFeedback: true,
  simulatedDateOffsetDays: 0,
};

// Initial realistic seed goals for first load
function getSeedGoals(today: string): { goals: Goal[]; checkIns: CheckIn[] } {
  // Goal 1: Marathon Preparation (Target: 45 days ahead, 14-day active streak)
  const g1Id = 'goal-marathon-2026';
  const target1 = addDays(today, 45);
  const goal1: Goal = {
    id: g1Id,
    name: 'Marathon 42km Training',
    description: 'Daily conditioning, pacing and hydration drills',
    targetDate: target1,
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    archived: false,
    reminderEnabled: true,
    reminderTime: '19:30',
    colorScheme: 'indigo',
  };

  // Goal 2: React Native / Kotlin Architecture (Target: 18 days ahead, yesterday checked in, today pending)
  const g2Id = 'goal-app-launch';
  const target2 = addDays(today, 18);
  const goal2: Goal = {
    id: g2Id,
    name: 'Android App & Widget Release',
    description: 'Production Room database, native widgets and APK build',
    targetDate: target2,
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    archived: false,
    reminderEnabled: true,
    reminderTime: '21:00',
    colorScheme: 'emerald',
  };

  // Goal 3: Japanese Language Immersion (Target: 75 days ahead, has broken streak in past, current streak 3)
  const g3Id = 'goal-nihongo-n3';
  const target3 = addDays(today, 75);
  const goal3: Goal = {
    id: g3Id,
    name: 'JLPT N3 Fluency',
    description: '30 kanji + 2 listening modules daily',
    targetDate: target3,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    archived: false,
    reminderEnabled: false,
    reminderTime: '08:00',
    colorScheme: 'amber',
  };

  const checkIns: CheckIn[] = [];

  // Goal 1: 14 consecutive check-ins ending today
  for (let i = 13; i >= 0; i--) {
    const d = addDays(today, -i);
    checkIns.push({
      id: `ci-g1-${d}`,
      goalId: g1Id,
      localDate: d,
      timestamp: new Date().toISOString(),
      note: i === 0 ? 'Today 10km tempo run completed smoothly!' : i === 1 ? 'Recovery run 5km' : undefined,
    });
  }

  // Goal 2: 7 consecutive check-ins ending yesterday (today is pending!)
  for (let i = 7; i >= 1; i--) {
    const d = addDays(today, -i);
    checkIns.push({
      id: `ci-g2-${d}`,
      goalId: g2Id,
      localDate: d,
      timestamp: new Date().toISOString(),
      note: i === 1 ? 'Room DAO unit tests verified passing' : undefined,
    });
  }

  // Goal 3: checked in 10 days ago for 4 days, then missed 3 days (broken streak), then checked in for 3 days ending yesterday
  // Old streak
  for (let i = 12; i >= 8; i--) {
    const d = addDays(today, -i);
    checkIns.push({
      id: `ci-g3-${d}`,
      goalId: g3Id,
      localDate: d,
      timestamp: new Date().toISOString(),
    });
  }
  // Days -7, -6, -5 were missed (breaks streak!)
  // New streak: Days -3, -2, -1 (streak = 3, pending today)
  for (let i = 3; i >= 1; i--) {
    const d = addDays(today, -i);
    checkIns.push({
      id: `ci-g3-${d}`,
      goalId: g3Id,
      localDate: d,
      timestamp: new Date().toISOString(),
      note: i === 1 ? 'Kanji review set 18' : undefined,
    });
  }

  return { goals: [goal1, goal2, goal3], checkIns };
}

class StorageEngine {
  private listeners: Set<() => void> = new Set();

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  public getSettings(): AppSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      // Ignore
    }
    return DEFAULT_SETTINGS;
  }

  public saveSettings(settings: Partial<AppSettings>): AppSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    this.notify();
    return updated;
  }

  public getGoals(): Goal[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.GOALS);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // Ignore
    }
    // Initialize seed
    const today = getTodayLocalDate(0);
    const seed = getSeedGoals(today);
    this.saveGoals(seed.goals);
    this.saveCheckIns(seed.checkIns);
    return seed.goals;
  }

  public saveGoals(goals: Goal[]) {
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
    this.notify();
  }

  public getGoalById(id: string): Goal | undefined {
    return this.getGoals().find((g) => g.id === id);
  }

  public createGoal(goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt' | 'archived'>): Goal {
    const now = new Date().toISOString();
    const newGoal: Goal = {
      ...goal,
      id: `goal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
      updatedAt: now,
      archived: false,
    };
    const goals = this.getGoals();
    this.saveGoals([newGoal, ...goals]);
    return newGoal;
  }

  public updateGoal(id: string, updates: Partial<Omit<Goal, 'id' | 'createdAt'>>): Goal {
    const goals = this.getGoals();
    const idx = goals.findIndex((g) => g.id === id);
    if (idx === -1) throw new Error(`Goal with ID "${id}" not found`);
    
    const updated: Goal = {
      ...goals[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    goals[idx] = updated;
    this.saveGoals([...goals]);
    return updated;
  }

  public deleteGoal(id: string): void {
    const goals = this.getGoals().filter((g) => g.id !== id);
    this.saveGoals(goals);

    // Also cascade remove check-ins
    const checkIns = this.getCheckIns().filter((c) => c.goalId !== id);
    this.saveCheckIns(checkIns);

    // Remove any widgets referencing this goal
    const widgets = this.getWidgets().filter((w) => w.goalId !== id);
    this.saveWidgets(widgets);
  }

  public toggleArchiveGoal(id: string): Goal {
    const goal = this.getGoalById(id);
    if (!goal) throw new Error(`Goal not found`);
    return this.updateGoal(id, { archived: !goal.archived });
  }

  // Check-ins
  public getCheckIns(): CheckIn[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CHECK_INS);
      if (raw) return JSON.parse(raw);
    } catch {
      // Ignore
    }
    return [];
  }

  public saveCheckIns(checkIns: CheckIn[]) {
    localStorage.setItem(STORAGE_KEYS.CHECK_INS, JSON.stringify(checkIns));
    this.notify();
  }

  /**
   * Records a check-in.
   * STRICT DATABASE-LEVEL UNIQUE CONSTRAINT: goalId + localDate.
   * Throws if already checked in on this local date.
   */
  public addCheckIn(goalId: string, localDate: string, note?: string): CheckIn {
    const goal = this.getGoalById(goalId);
    if (!goal) {
      throw new Error(`Goal with ID ${goalId} does not exist`);
    }

    const checkIns = this.getCheckIns();

    // Check duplicate
    const exists = checkIns.some((c) => c.goalId === goalId && c.localDate === localDate);
    if (exists) {
      throw new Error(`Duplicate check-in: Goal "${goal.name}" is already checked in for ${localDate}.`);
    }

    const newCheckIn: CheckIn = {
      id: `ci-${goalId}-${localDate}-${Date.now()}`,
      goalId,
      localDate,
      timestamp: new Date().toISOString(),
      note: note?.trim() || undefined,
    };

    const updated = [...checkIns, newCheckIn];
    this.saveCheckIns(updated);
    return newCheckIn;
  }

  public removeCheckIn(id: string): void {
    const checkIns = this.getCheckIns().filter((c) => c.id !== id);
    this.saveCheckIns(checkIns);
  }

  // Widgets
  public getWidgets(): WidgetInstance[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.WIDGETS);
      if (raw) return JSON.parse(raw);
    } catch {
      // Ignore
    }
    // Default simulated widget instances
    const goals = this.getGoals();
    if (goals.length > 0) {
      return [
        { appWidgetId: 101, goalId: goals[0].id, type: 'compact' },
        { appWidgetId: 102, goalId: goals.length > 1 ? goals[1].id : goals[0].id, type: 'large' },
      ];
    }
    return [];
  }

  public saveWidgets(widgets: WidgetInstance[]) {
    localStorage.setItem(STORAGE_KEYS.WIDGETS, JSON.stringify(widgets));
    this.notify();
  }

  public updateWidgetGoal(appWidgetId: number, goalId: string) {
    const widgets = this.getWidgets();
    const idx = widgets.findIndex((w) => w.appWidgetId === appWidgetId);
    if (idx !== -1) {
      widgets[idx].goalId = goalId;
      this.saveWidgets([...widgets]);
    }
  }

  // Full Export and Import
  public exportBackupJson(): string {
    const data = {
      exportVersion: 1,
      exportedAt: new Date().toISOString(),
      goals: this.getGoals(),
      checkIns: this.getCheckIns(),
      widgets: this.getWidgets(),
      settings: this.getSettings(),
    };
    return JSON.stringify(data, null, 2);
  }

  public importBackupJson(jsonString: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonString);
      if (!data || !Array.isArray(data.goals) || !Array.isArray(data.checkIns)) {
        return { success: false, message: 'Invalid backup file structure' };
      }
      this.saveGoals(data.goals);
      this.saveCheckIns(data.checkIns);
      if (Array.isArray(data.widgets)) this.saveWidgets(data.widgets);
      if (data.settings) this.saveSettings(data.settings);
      return { success: true, message: `Successfully restored ${data.goals.length} goals and ${data.checkIns.length} check-ins.` };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, message: `Failed to restore: ${msg}` };
    }
  }

  public clearAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.GOALS);
    localStorage.removeItem(STORAGE_KEYS.CHECK_INS);
    localStorage.removeItem(STORAGE_KEYS.WIDGETS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    this.notify();
  }
}

export const storage = new StorageEngine();
