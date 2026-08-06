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

export interface MoneyDueReportResponse {
  totalReceivable: number;
  totalPayable: number;
  receivableInterest: number;
  payableInterest: number;
  pendingCount: number;
  partiallyPaidCount: number;
  completedCount: number;
  overdueCount: number;
  activeReceivableCount: number;
  activePayableCount: number;
}