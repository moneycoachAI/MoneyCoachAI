export interface MonthlyDashboardCard {
  month: number;
  year: number;
  totalSpent: number;
  totalBudget: number;
  remaining: number;
  suggestionCount: number;
  topSeverity: string;
  topMessage: string;
}