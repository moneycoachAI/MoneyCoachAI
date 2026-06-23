export interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  progressPercentage: number;
  targetDate?: string;
}

export interface CreateFinancialGoalRequest {
  name: string;
  targetAmount: number;
  targetDate?: string;
}