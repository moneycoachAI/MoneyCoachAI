namespace MoneyCoachAI.Api.DTOs;

public class UpdateIncomeRequest
{
    public decimal Amount { get; set; }

    public string Source { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public DateTime Date { get; set; }
}