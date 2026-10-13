/**
 * Persistent Local Storage Engine (SQLite/Room Mirror)
 *
 * Provides an offline-first storage layer matching Room/SQLite entities with:
 * - Unique check-ins by goalId and localDate
 * - Persistent goals, check-ins, widget mappings, and settings
 * - Change broadcasts for React state synchronization
 * - Full JSON export and import capabilities
 */

import { AppSettings, CheckIn, Goal, WidgetInstance } from '../types';

const STORAGE_KEYS = {
  GOALS: 'sc_goals_v1',
  CHECK_INS: 'sc_check_ins_v1',
  WIDGETS: 'sc_widgets_v1',
  SETTINGS: 'sc_settings_v1',
} as const;

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  notificationsEnabled: true,
  defaultReminderTime: '20:00',
  hapticFeedback: true,
  simulatedDateOffsetDays: 0,
};

const LEGACY_SEED_GOAL_IDS = new Set([
  'goal-marathon-2026',
  'goal-app-launch',
  'goal-nihongo-n3',
]);

class StorageEngine {
  private listeners: Set<() => void> = new Set();

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }

  private readArray<T>(key: string): T[] {
    try {
      const raw = localStorage.getItem(key);

      if (!raw) {
        return [];
      }

      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }

  private writeValue(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown storage error';
      throw new Error(`Unable to save application data: ${message}`);
    }
  }

  public getSettings(): AppSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);

      if (!raw) {
        return { ...DEFAULT_SETTINGS };
      }

      const parsed: unknown = JSON.parse(raw);

      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return { ...DEFAULT_SETTINGS };
      }

      return {
        ...DEFAULT_SETTINGS,
        ...(parsed as Partial<AppSettings>),
        simulatedDateOffsetDays: 0,
      };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  public saveSettings(settings: Partial<AppSettings>): AppSettings {
    const current = this.getSettings();
    const updated: AppSettings = {
      ...current,
      ...settings,
      simulatedDateOffsetDays: 0,
    };

    this.writeValue(STORAGE_KEYS.SETTINGS, updated);
    this.notify();

    return updated;
  }

  public getGoals(): Goal[] {
    return this.readArray<Goal>(STORAGE_KEYS.GOALS);
  }

  public saveGoals(goals: Goal[]): void {
    this.writeValue(STORAGE_KEYS.GOALS, goals);
    this.notify();
  }

  public getGoalById(id: string): Goal | undefined {
    return this.getGoals().find((goal) => goal.id === id);
  }

  public createGoal(
    goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt' | 'archived'>
  ): Goal {
    const now = new Date().toISOString();
    const newGoal: Goal = {
      ...goal,
      id: `goal-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: now,
      updatedAt: now,
      archived: false,
    };

    const goals = this.getGoals();
    this.saveGoals([newGoal, ...goals]);

    return newGoal;
  }

  public updateGoal(
    id: string,
    updates: Partial<Omit<Goal, 'id' | 'createdAt'>>
  ): Goal {
    const goals = this.getGoals();
    const index = goals.findIndex((goal) => goal.id === id);

    if (index === -1) {
      throw new Error(`Goal with ID "${id}" not found`);
    }

    const updatedGoal: Goal = {
      ...goals[index],
      ...updates,
      id: goals[index].id,
      createdAt: goals[index].createdAt,
      updatedAt: new Date().toISOString(),
    };

    const updatedGoals = [...goals];
    updatedGoals[index] = updatedGoal;
    this.saveGoals(updatedGoals);

    return updatedGoal;
  }

  public deleteGoal(id: string): void {
    const goals = this.getGoals().filter((goal) => goal.id !== id);
    const checkIns = this.getCheckIns().filter(
      (checkIn) => checkIn.goalId !== id
    );
    const widgets = this.getWidgets().filter(
      (widget) => widget.goalId !== id
    );

    this.writeValue(STORAGE_KEYS.GOALS, goals);
    this.writeValue(STORAGE_KEYS.CHECK_INS, checkIns);
    this.writeValue(STORAGE_KEYS.WIDGETS, widgets);
    this.notify();
  }

  public toggleArchiveGoal(id: string): Goal {
    const goal = this.getGoalById(id);

    if (!goal) {
      throw new Error(`Goal with ID "${id}" not found`);
    }

    return this.updateGoal(id, { archived: !goal.archived });
  }

  public getCheckIns(): CheckIn[] {
    return this.readArray<CheckIn>(STORAGE_KEYS.CHECK_INS);
  }

  public saveCheckIns(checkIns: CheckIn[]): void {
    this.writeValue(STORAGE_KEYS.CHECK_INS, checkIns);
    this.notify();
  }

  /**
   * Records one check-in per goal and local calendar date.
   * Throws an error when the goal does not exist or the date is duplicated.
   */
  public addCheckIn(
    goalId: string,
    localDate: string,
    note?: string
  ): CheckIn {
    const goal = this.getGoalById(goalId);

    if (!goal) {
      throw new Error(`Goal with ID "${goalId}" does not exist`);
    }

    const checkIns = this.getCheckIns();
    const alreadyExists = checkIns.some(
      (checkIn) =>
        checkIn.goalId === goalId && checkIn.localDate === localDate
    );

    if (alreadyExists) {
      throw new Error(
        `Goal "${goal.name}" is already checked in for ${localDate}.`
      );
    }

    const newCheckIn: CheckIn = {
      id: `ci-${goalId}-${localDate}-${Date.now()}`,
      goalId,
      localDate,
      timestamp: new Date().toISOString(),
      note: note?.trim() || undefined,
    };

    this.saveCheckIns([...checkIns, newCheckIn]);

    return newCheckIn;
  }

  public removeCheckIn(id: string): void {
    const checkIns = this.getCheckIns().filter(
      (checkIn) => checkIn.id !== id
    );

    this.saveCheckIns(checkIns);
  }

  public getWidgets(): WidgetInstance[] {
    return this.readArray<WidgetInstance>(STORAGE_KEYS.WIDGETS);
  }

  public saveWidgets(widgets: WidgetInstance[]): void {
    this.writeValue(STORAGE_KEYS.WIDGETS, widgets);
    this.notify();
  }

  public updateWidgetGoal(appWidgetId: number, goalId: string): void {
    const goalExists = Boolean(this.getGoalById(goalId));

    if (!goalExists) {
      throw new Error(`Goal with ID "${goalId}" does not exist`);
    }

    const widgets = this.getWidgets();
    const index = widgets.findIndex(
      (widget) => widget.appWidgetId === appWidgetId
    );

    if (index === -1) {
      return;
    }

    const updatedWidgets = [...widgets];
    updatedWidgets[index] = {
      ...updatedWidgets[index],
      goalId,
    };

    this.saveWidgets(updatedWidgets);
  }

  /**
   * Removes sample records created by previous versions of the application.
   * User-created goals and check-ins are not modified.
   */
  public removeLegacySeedData(): void {
    const goals = this.getGoals();
    const checkIns = this.getCheckIns();
    const widgets = this.getWidgets();

    const filteredGoals = goals.filter(
      (goal) => !LEGACY_SEED_GOAL_IDS.has(goal.id)
    );
    const filteredCheckIns = checkIns.filter(
      (checkIn) => !LEGACY_SEED_GOAL_IDS.has(checkIn.goalId)
    );
    const filteredWidgets = widgets.filter(
      (widget) => !LEGACY_SEED_GOAL_IDS.has(widget.goalId)
    );

    const hasChanges =
      filteredGoals.length !== goals.length ||
      filteredCheckIns.length !== checkIns.length ||
      filteredWidgets.length !== widgets.length;

    if (!hasChanges) {
      return;
    }

    this.writeValue(STORAGE_KEYS.GOALS, filteredGoals);
    this.writeValue(STORAGE_KEYS.CHECK_INS, filteredCheckIns);
    this.writeValue(STORAGE_KEYS.WIDGETS, filteredWidgets);
    this.notify();
  }

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

  public importBackupJson(
    jsonString: string
  ): { success: boolean; message: string } {
    try {
      const parsed: unknown = JSON.parse(jsonString);

      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return {
          success: false,
          message: 'Invalid backup file structure.',
        };
      }

      const data = parsed as {
        goals?: unknown;
        checkIns?: unknown;
        widgets?: unknown;
        settings?: unknown;
      };

      if (!Array.isArray(data.goals) || !Array.isArray(data.checkIns)) {
        return {
          success: false,
          message: 'Invalid backup file structure.',
        };
      }

      const widgets = Array.isArray(data.widgets) ? data.widgets : [];
      const settings =
        data.settings &&
        typeof data.settings === 'object' &&
        !Array.isArray(data.settings)
          ? (data.settings as Partial<AppSettings>)
          : null;

      this.writeValue(STORAGE_KEYS.GOALS, data.goals);
      this.writeValue(STORAGE_KEYS.CHECK_INS, data.checkIns);
      this.writeValue(STORAGE_KEYS.WIDGETS, widgets);

      if (settings) {
        this.writeValue(STORAGE_KEYS.SETTINGS, {
          ...DEFAULT_SETTINGS,
          ...settings,
          simulatedDateOffsetDays: 0,
        });
      }

      this.removeLegacySeedData();
      this.notify();

      return {
        success: true,
        message: `Successfully restored ${data.goals.length} goals and ${data.checkIns.length} check-ins.`,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);

      return {
        success: false,
        message: `Failed to restore: ${message}`,
      };
    }
  }

  public clearAllData(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.GOALS);
      localStorage.removeItem(STORAGE_KEYS.CHECK_INS);
      localStorage.removeItem(STORAGE_KEYS.WIDGETS);
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown storage error';
      throw new Error(`Unable to clear application data: ${message}`);
    }

    this.notify();
  }
}

export const storage = new StorageEngine();

// Remove demo records saved by older versions before React reads initial state.
storage.removeLegacySeedData();
