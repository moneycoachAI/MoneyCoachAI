namespace MoneyCoachAI.Api.DTOs.NetWorth;

public class NetWorthItemResponse
{
    public string Id { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public string Type { get; set; } = string.Empty;
}