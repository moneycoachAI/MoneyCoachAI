namespace MoneyCoachAI.Api.DTOs;

public class MoneyDueReportResponse
{
    public decimal TotalReceivable { get; set; }
    public decimal TotalPayable { get; set; }
    public decimal ReceivableInterest { get; set; }
    public decimal PayableInterest { get; set; }
    public int PendingCount { get; set; }
    public int PartiallyPaidCount { get; set; }
    public int CompletedCount { get; set; }
    public int OverdueCount { get; set; }
    public int ActiveReceivableCount { get; set; }
    public int ActivePayableCount { get; set; }
}