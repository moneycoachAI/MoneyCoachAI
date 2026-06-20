export interface MonthlyDashboardCard {
  month: number;
  year: number;

  totalIncome: number;
  totalSpent: number;

  totalBudget: number;
  remaining: number;

  savings: number;
  savingsRate: number;

  suggestionCount: number;

  topSeverity: string;
  topMessage: string;

  healthScore: number;
  healthStatus: string;
}