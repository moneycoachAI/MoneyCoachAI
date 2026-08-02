namespace MoneyCoachAI.Api.DTOs.MoneyDue;

public class MoneyDueSettlementResponse
{
    public decimal Amount { get; set; }

    public DateTime SettlementDate { get; set; }

    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; }
}