namespace MoneyCoachAI.Api.DTOs.RecurringTransactions;

public class CreateRecurringTransactionRequest
{
    public string Title { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public string Category { get; set; } = string.Empty;

    public string Type { get; set; } = string.Empty;

    public string Frequency { get; set; } = "Monthly";

    public DateTime StartDate { get; set; }
}