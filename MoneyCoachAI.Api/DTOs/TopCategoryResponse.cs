namespace MoneyCoachAI.Api.DTOs;

public class TopCategoryResponse
{
    public string Category { get; set; } = string.Empty;

    public decimal TotalSpent { get; set; }

    public decimal PercentageOfTotal { get; set; }

    public string Severity { get; set; } = string.Empty;
}