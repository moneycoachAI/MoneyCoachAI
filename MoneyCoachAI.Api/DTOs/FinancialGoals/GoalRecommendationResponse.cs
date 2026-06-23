namespace MoneyCoachAI.Api.DTOs.FinancialGoals;

public class GoalRecommendationResponse
{
    public string GoalName { get; set; } = string.Empty;

    public decimal RemainingAmount { get; set; }

    public decimal AverageMonthlySavings { get; set; }

    public int EstimatedMonthsToComplete { get; set; }

    public decimal SuggestedMonthlyContribution { get; set; }

    public string RecommendationMessage { get; set; } = string.Empty;

    public int MonthsUntilTargetDate { get; set; }

    public decimal RequiredMonthlyContribution { get; set; }

    public decimal AdditionalMonthlySavingsNeeded { get; set; }
}