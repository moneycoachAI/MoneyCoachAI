namespace MoneyCoachAI.Api.DTOs;

public class BudgetSummaryResponse
{
    public string Category { get; set; } = string.Empty;

    public decimal BudgetLimit { get; set; }

    public decimal Spent { get; set; }

    public decimal Remaining { get; set; }

    public bool IsOverBudget { get; set; }
}