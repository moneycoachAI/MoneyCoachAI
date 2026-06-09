namespace MoneyCoachAI.Api.DTOs;

public class UpdateBudgetRequest
{
    public string Category { get; set; } = string.Empty;

    public decimal MonthlyLimit { get; set; }

    public int Month { get; set; }

    public int Year { get; set; }
}