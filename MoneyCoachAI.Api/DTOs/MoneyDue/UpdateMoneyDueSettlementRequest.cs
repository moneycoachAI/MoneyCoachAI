namespace MoneyCoachAI.Api.DTOs.MoneyDue;

public class UpdateMoneyDueSettlementRequest
{
    public decimal Amount { get; set; }

    public DateTime SettlementDate { get; set; }

    public string? Description { get; set; }
}