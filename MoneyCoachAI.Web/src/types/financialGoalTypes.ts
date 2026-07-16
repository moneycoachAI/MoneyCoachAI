export interface GoalProgressEntry {
  amount: number;
  date: string;
}

export interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  progressPercentage: number;

  createdAt: string;

  targetDate?: string;

  progressHistory: GoalProgressEntry[];
}

export interface CreateFinancialGoalRequest {
  name: string;
  targetAmount: number;
  targetDate?: string;
}