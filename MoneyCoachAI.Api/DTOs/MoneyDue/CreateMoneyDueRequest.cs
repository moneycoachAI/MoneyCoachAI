namespace MoneyCoachAI.Api.DTOs.MoneyDue;

public class CreateMoneyDueRequest
{
    public string DueType { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string PartyName { get; set; } = string.Empty;

    public string Category { get; set; } = string.Empty;

    public string? OtherDescription { get; set; }

    public decimal TotalAmount { get; set; }

    public DateTime DueDate { get; set; }

    public int ReminderDaysBefore { get; set; } = 1;

    public string? Description { get; set; }
}