namespace MoneyCoachAI.Api.Models;

public class GoalProgressEntry
{
    public decimal Amount { get; set; }

    public DateTime Date { get; set; } = DateTime.UtcNow;
}