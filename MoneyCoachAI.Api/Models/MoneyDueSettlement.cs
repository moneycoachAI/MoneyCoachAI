namespace MoneyCoachAI.Api.Models;

public class MoneyDueSettlement
{
    public decimal Amount { get; set; }

    public DateTime SettlementDate { get; set; }

    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}