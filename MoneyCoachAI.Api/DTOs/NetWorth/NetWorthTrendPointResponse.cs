namespace MoneyCoachAI.Api.DTOs.NetWorth;

public class NetWorthTrendPointResponse
{
    public DateTime SnapshotDate { get; set; }

    public decimal NetWorth { get; set; }
}