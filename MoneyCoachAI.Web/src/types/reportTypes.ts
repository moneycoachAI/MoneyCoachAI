export interface MonthlyReportResponse {
  month: number;
  year: number;

  totalIncome: number;

  totalSpent: number;

  savings: number;
}

export interface CategoryReportResponse {
  category: string;
  totalSpent: number;
  descriptions: string[];
}

export interface BudgetSummaryResponse {
  category: string;
  budgetLimit: number;
  spent: number;
  remaining: number;
  isOverBudget: boolean;
}