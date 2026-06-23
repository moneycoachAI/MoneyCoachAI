namespace MoneyCoachAI.Api.DTOs;

public class MonthlyReportPdfResponse
{
    public decimal TotalIncome { get; set; }

    public decimal TotalSpent { get; set; }

    public decimal Savings { get; set; }

    public decimal SavingsRate { get; set; }

    public List<string> Suggestions { get; set; } = [];

    public List<string> AiInsights { get; set; } = [];
}