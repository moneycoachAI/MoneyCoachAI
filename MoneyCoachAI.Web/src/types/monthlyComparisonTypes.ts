export interface MonthlyComparison {
  currentMonth: number;
  currentYear: number;

  previousMonth: number;
  previousYear: number;

  currentIncome: number;
  previousIncome: number;

  currentSpent: number;
  previousSpent: number;

  currentSavings: number;
  previousSavings: number;

  incomeChangePercent: number;
  expenseChangePercent: number;
  savingsChangePercent: number;
}