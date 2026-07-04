export interface UserSettings {
  id?: string;
  userId: string;

  currency: string;
  dateFormat: string;

  budgetWarningNotifications: boolean;
  budgetExceededNotifications: boolean;
  goalCompletedNotifications: boolean;

  aiInsightsEnabled: boolean;
  aiDashboardSuggestionsEnabled: boolean;

  updatedAt: string;
}