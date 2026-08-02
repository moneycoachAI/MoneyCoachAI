namespace MoneyCoachAI.Api.DTOs.MoneyDue;

public class MoneyDueResponse
{
    public string Id { get; set; } = string.Empty;

    public string DueType { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string PartyName { get; set; } = string.Empty;

    public string Category { get; set; } = string.Empty;

    public string? OtherDescription { get; set; }

    public decimal TotalAmount { get; set; }

    public decimal SettledAmount { get; set; }

    public List<MoneyDueSettlementResponse> Settlements { get; set; } = [];

    public decimal RemainingAmount { get; set; }

    public DateTime DueDate { get; set; }

    public int ReminderDaysBefore { get; set; }

    public string? Description { get; set; }

    public string Status { get; set; } = string.Empty;

    public bool IsOverdue { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? CompletedAt { get; set; }
}