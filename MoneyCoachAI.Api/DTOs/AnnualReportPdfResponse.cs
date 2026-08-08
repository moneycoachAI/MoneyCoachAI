namespace MoneyCoachAI.Api.DTOs;

public class AnnualReportPdfResponse
{
    public int Year { get; set; }

    public decimal TotalIncome { get; set; }
    public decimal TotalSpent { get; set; }
    public decimal TotalSavings { get; set; }
    public decimal AverageSavingsRate { get; set; }

    public int AverageHealthScore { get; set; }
    public string OverallHealthStatus { get; set; } = string.Empty;

    public List<AnnualMonthPdfItem> Months { get; set; } = [];

    public List<PdfFinancialGoalItem> FinancialGoals { get; set; } = [];

    public PdfInvestmentSummary InvestmentSummary { get; set; } = new();
    public List<PdfInvestmentAllocationItem> InvestmentAllocation { get; set; } = [];

    public PdfNetWorthSummary NetWorth { get; set; } = new();

    public List<AnnualNetWorthItem> NetWorthItems { get; set; } = [];

    public List<AnnualMoneyDueItem> MoneyDueItems { get; set; } = [];

    public List<PdfRecurringTransactionItem> RecurringTransactions { get; set; } = [];
}

public class AnnualNetWorthItem
{
    public string Name { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public string Type { get; set; } = string.Empty;
}

public class AnnualMoneyDueItem
{
    public string Title { get; set; } = string.Empty;

    public string PartyName { get; set; } = string.Empty;

    public string DueType { get; set; } = string.Empty;

    public string Category { get; set; } = string.Empty;

    public decimal TotalAmount { get; set; }

    public decimal SettledAmount { get; set; }

    public decimal RemainingAmount { get; set; }

    public DateTime DueDate { get; set; }

    public string Status { get; set; } = string.Empty;

    public bool IsOverdue { get; set; }
}

public class AnnualMonthPdfItem
{
    public int Month { get; set; }
    public string MonthName { get; set; } = string.Empty;

    public decimal TotalIncome { get; set; }
    public decimal TotalSpent { get; set; }
    public decimal TotalBudget { get; set; }
    public decimal RemainingBudget { get; set; }
    public decimal Savings { get; set; }
    public decimal SavingsRate { get; set; }

    public int HealthScore { get; set; }
    public string HealthStatus { get; set; } = string.Empty;

    public List<PdfCategoryItem> Categories { get; set; } = [];
    public List<PdfBudgetItem> Budgets { get; set; } = [];
    public List<PdfSuggestionItem> Suggestions { get; set; } = [];
    public List<PdfAiInsightItem> AiInsights { get; set; } = [];
}