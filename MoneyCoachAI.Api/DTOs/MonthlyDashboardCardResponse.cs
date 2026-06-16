namespace MoneyCoachAI.Api.DTOs;

public class MonthlyDashboardCardResponse
{
    public int Month { get; set; }

    public int Year { get; set; }

    public decimal TotalIncome { get; set; }

    public decimal TotalSpent { get; set; }

    public decimal TotalBudget { get; set; }

    public decimal Remaining { get; set; }

    public decimal Savings { get; set; }

    public decimal SavingsRate { get; set; }

    public int SuggestionCount { get; set; }

    public string TopSeverity { get; set; } = string.Empty;

    public string TopMessage { get; set; } = string.Empty;
}