namespace MoneyCoachAI.Api.DTOs.MoneyDue;

public class RecordMoneyDueSettlementRequest
{
    public decimal Amount { get; set; }

    public DateTime SettlementDate { get; set; }

    public string? Description { get; set; }
}