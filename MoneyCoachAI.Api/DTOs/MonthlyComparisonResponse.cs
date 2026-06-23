namespace MoneyCoachAI.Api.DTOs;

public class MonthlyComparisonResponse
{
    public int CurrentMonth { get; set; }
    public int CurrentYear { get; set; }

    public int PreviousMonth { get; set; }
    public int PreviousYear { get; set; }

    public decimal CurrentIncome { get; set; }
    public decimal PreviousIncome { get; set; }

    public decimal CurrentSpent { get; set; }
    public decimal PreviousSpent { get; set; }

    public decimal CurrentSavings { get; set; }
    public decimal PreviousSavings { get; set; }

    public double IncomeChangePercent { get; set; }
    public double ExpenseChangePercent { get; set; }
    public double SavingsChangePercent { get; set; }
}