namespace MoneyCoachAI.Api.DTOs.MoneyDue;

public class UpdateMoneyDueRequest
{
    public string DueType { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string PartyName { get; set; } = string.Empty;

    public string Category { get; set; } = string.Empty;

    public string? OtherDescription { get; set; }

    public bool HasInterest { get; set; }

    public decimal PrincipalAmount { get; set; }

    public decimal InterestRate { get; set; }

    public string? InterestPeriod { get; set; }

    public int InterestPeriods { get; set; }

    public string InterestMethod { get; set; } = "Simple";

    public decimal TotalAmount { get; set; }

    public DateTime DueDate { get; set; }

    public int ReminderDaysBefore { get; set; } = 1;

    public decimal Amount { get; set; }

    public DateTime SettlementDate { get; set; }

    public string? Description { get; set; }
}