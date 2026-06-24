namespace MoneyCoachAI.Api.DTOs.RecurringTransactions;

public class RecurringTransactionResponse
{
    public string Id { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public string Category { get; set; } = string.Empty;

    public string Type { get; set; } = string.Empty;

    public string Frequency { get; set; } = string.Empty;

    public DateTime StartDate { get; set; }

    public bool IsActive { get; set; }
}