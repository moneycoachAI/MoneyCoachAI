namespace MoneyCoachAI.Api.DTOs.Investments;

public class InvestmentSummaryResponse
{
    public decimal TotalInvested { get; set; }

    public decimal TotalCurrentValue { get; set; }

    public decimal TotalProfitOrLoss { get; set; }

    public decimal ProfitOrLossPercentage { get; set; }
}