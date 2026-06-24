namespace MoneyCoachAI.Api.DTOs.NetWorth;

public class NetWorthSummaryResponse
{
    public decimal TotalAssets { get; set; }

    public decimal TotalLiabilities { get; set; }

    public decimal NetWorth { get; set; }
}