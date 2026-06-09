namespace MoneyCoachAI.Api.DTOs;

public class MonthlyReportResponse
{
    public int Month { get; set; }

    public int Year { get; set; }

    public decimal TotalSpent { get; set; }
}