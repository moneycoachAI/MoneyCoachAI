namespace MoneyCoachAI.Api.DTOs;

public class MonthlyReportResponse
{
    public int Month { get; set; }

    public int Year { get; set; }

    public decimal TotalIncome { get; set; }

    public decimal TotalSpent { get; set; }

    public decimal Savings { get; set; }
}