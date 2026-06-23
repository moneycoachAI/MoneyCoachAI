namespace MoneyCoachAI.Api.DTOs.FinancialGoals;

public class CreateFinancialGoalRequest
{
    public string Name { get; set; } = string.Empty;

    public decimal TargetAmount { get; set; }

    public DateTime? TargetDate { get; set; }
}