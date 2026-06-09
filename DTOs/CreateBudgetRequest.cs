namespace MoneyCoachAI.Api.DTOs;

public class CreateBudgetRequest
{
    public string Category { get; set; } = string.Empty;

    public decimal MonthlyLimit { get; set; }

    public int Month { get; set; }

    public int Year { get; set; }
}