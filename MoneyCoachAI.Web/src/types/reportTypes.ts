export interface MonthlyReportResponse {
  month: number;
  year: number;
  totalSpent: number;
}

export interface CategoryReportResponse {
  category: string;
  totalSpent: number;
}

export interface BudgetSummaryResponse {
  category: string;
  budgetLimit: number;
  spent: number;
  remaining: number;
  isOverBudget: boolean;
}