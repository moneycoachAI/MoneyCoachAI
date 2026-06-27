namespace MoneyCoachAI.Api.DTOs.Investments;

public class CreateInvestmentRequest
{
    public string Name { get; set; } = string.Empty;

    public string Type { get; set; } = string.Empty;

    public decimal InvestedAmount { get; set; }

    public decimal CurrentValue { get; set; }

    public DateTime InvestmentDate { get; set; }
}