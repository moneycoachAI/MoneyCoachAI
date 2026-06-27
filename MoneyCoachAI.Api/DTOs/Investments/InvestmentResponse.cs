namespace MoneyCoachAI.Api.DTOs.Investments;

public class InvestmentResponse
{
    public string Id { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string Type { get; set; } = string.Empty;

    public decimal InvestedAmount { get; set; }

    public decimal CurrentValue { get; set; }

    public decimal ProfitOrLoss { get; set; }

    public decimal ProfitOrLossPercentage { get; set; }

    public DateTime InvestmentDate { get; set; }
}