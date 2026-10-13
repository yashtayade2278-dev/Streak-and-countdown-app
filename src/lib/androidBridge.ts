import { CheckIn, Goal } from '../types';

declare global {
  interface Window {
    AndroidBridge?: {
      syncGoal(json: string): void;
      syncCheckIn(json: string): void;
      deleteGoal(id: string): void;
      pinGoalWidget(id: string): void;
      refreshWidgets(): void;
    };
  }
}

export const androidBridge = {
  syncGoal(goal: Goal): void {
    window.AndroidBridge?.syncGoal(JSON.stringify(goal));
  },

  syncCheckIn(checkIn: CheckIn): void {
    window.AndroidBridge?.syncCheckIn(JSON.stringify(checkIn));
  },

  deleteGoal(id: string): void {
    window.AndroidBridge?.deleteGoal(id);
  },

  pinGoalWidget(id: string): void {
    if (!window.AndroidBridge) {
      window.alert(
        'Home-screen widgets are available in the installed Android app.'
      );
      return;
    }

    window.AndroidBridge.pinGoalWidget(id);
  },

  refreshWidgets(): void {
    window.AndroidBridge?.refreshWidgets();
  },
};
