namespace MoneyCoachAI.Api.DTOs;

public class CategoryReportResponse
{
    public string Category { get; set; } = string.Empty;

    public decimal TotalSpent { get; set; }
}