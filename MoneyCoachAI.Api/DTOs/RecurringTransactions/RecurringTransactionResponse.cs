namespace MoneyCoachAI.Api.DTOs.RecurringTransactions;

public class RecurringTransactionResponse
{
    public string Id { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public string Type { get; set; } = string.Empty;

    public string Category { get; set; } = string.Empty;

    public string? OtherDescription { get; set; }

    public string? Description { get; set; }

    public string Frequency { get; set; } = string.Empty;

    public DateTime StartDate { get; set; }

    public int ScheduleDay { get; set; }

    public DateTime NextOccurrenceDate { get; set; }

    public DateTime? EndDate { get; set; }

    public int ReminderDaysBefore { get; set; }

    public int ReminderHour { get; set; }

    public DateTime? LastCompletedOccurrenceDate { get; set; }

    public string ReminderStatus { get; set; } = string.Empty;

    public string ReminderMessage { get; set; } = string.Empty;

    public int DaysUntilDue { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}