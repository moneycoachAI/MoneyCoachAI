export interface GoalRecommendation {
  goalName: string;
  remainingAmount: number;
  averageMonthlySavings: number;
  estimatedMonthsToComplete: number;
  suggestedMonthlyContribution: number;
  recommendationMessage: string;

  monthsUntilTargetDate: number;
  requiredMonthlyContribution: number;
  additionalMonthlySavingsNeeded: number;
}