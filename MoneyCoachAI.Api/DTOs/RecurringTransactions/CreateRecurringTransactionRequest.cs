namespace MoneyCoachAI.Api.DTOs.RecurringTransactions;

public class CreateRecurringTransactionRequest
{
    public string Title { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public string Type { get; set; } = string.Empty;

    public string Category { get; set; } = string.Empty;

    public string? OtherDescription { get; set; }

    public string? Description { get; set; }

    public string Frequency { get; set; } = "Monthly";

    public DateTime StartDate { get; set; }

    public DateTime? EndDate { get; set; }
}