namespace MoneyCoachAI.Api.DTOs;

public class MonthlyReportPdfResponse
{
    // =========================
    // Financial Overview
    // =========================

    public decimal TotalIncome { get; set; }

    public decimal TotalSpent { get; set; }

    public decimal Savings { get; set; }

    public decimal SavingsRate { get; set; }

    public decimal TotalBudget { get; set; }

    public decimal RemainingBudget { get; set; }

    public int HealthScore { get; set; }

    public string HealthStatus { get; set; } = string.Empty;


    // =========================
    // Monthly Comparison
    // =========================

    public PdfMonthlyComparison Comparison { get; set; } = new();


    // =========================
    // Category Spending
    // =========================

    public List<PdfCategoryItem> Categories { get; set; } = [];


    // =========================
    // Budget Performance
    // =========================

    public List<PdfBudgetItem> Budgets { get; set; } = [];


    // =========================
    // Smart Suggestions
    // =========================

    public List<PdfSuggestionItem> Suggestions { get; set; } = [];


    // =========================
    // AI Advisor
    // =========================

    public List<PdfAiInsightItem> AiInsights { get; set; } = [];


    // =========================
    // Financial Goals
    // =========================

    public List<PdfFinancialGoalItem> FinancialGoals { get; set; } = [];


    // =========================
    // Investments
    // =========================

    public PdfInvestmentSummary InvestmentSummary { get; set; } = new();

    public List<PdfInvestmentAllocationItem> InvestmentAllocation { get; set; } = [];


    // =========================
    // Net Worth
    // =========================

    public PdfNetWorthSummary NetWorth { get; set; } = new();


    // =========================
    // Recurring Transactions
    // =========================

    public List<PdfRecurringTransactionItem> RecurringTransactions { get; set; } = [];
}


// ============================================================
// Monthly Comparison
// ============================================================

public class PdfMonthlyComparison
{
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


// ============================================================
// Category Spending
// ============================================================

public class PdfCategoryItem
{
    public string Category { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public decimal Percentage { get; set; }
}


// ============================================================
// Budget
// ============================================================

public class PdfBudgetItem
{
    public string Category { get; set; } = string.Empty;

    public decimal BudgetLimit { get; set; }

    public decimal Spent { get; set; }

    public decimal Remaining { get; set; }

    public decimal UsedPercentage { get; set; }

    public bool IsOverBudget { get; set; }
}


// ============================================================
// Smart Suggestions
// ============================================================

public class PdfSuggestionItem
{
    public string Type { get; set; } = string.Empty;

    public string Category { get; set; } = string.Empty;

    public string Severity { get; set; } = string.Empty;

    public string Message { get; set; } = string.Empty;
}


// ============================================================
// AI Advisor Insights
// ============================================================

public class PdfAiInsightItem
{
    public string Title { get; set; } = string.Empty;

    public string Severity { get; set; } = string.Empty;

    public string Message { get; set; } = string.Empty;
}


// ============================================================
// Financial Goals
// ============================================================

public class PdfFinancialGoalItem
{
    public string Name { get; set; } = string.Empty;

    public decimal TargetAmount { get; set; }

    public decimal CurrentAmount { get; set; }

    public decimal ProgressPercentage { get; set; }

    public DateTime? TargetDate { get; set; }

    public decimal SuggestedMonthlyContribution { get; set; }

    public string Recommendation { get; set; } = string.Empty;
}


// ============================================================
// Investments
// ============================================================

public class PdfInvestmentSummary
{
    public decimal TotalInvested { get; set; }

    public decimal TotalCurrentValue { get; set; }

    public decimal TotalProfitOrLoss { get; set; }

    public decimal ProfitOrLossPercentage { get; set; }
}


public class PdfInvestmentAllocationItem
{
    public string Type { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public decimal Percentage { get; set; }
}


// ============================================================
// Net Worth
// ============================================================

public class PdfNetWorthSummary
{
    public decimal TotalAssets { get; set; }

    public decimal TotalLiabilities { get; set; }

    public decimal NetWorth { get; set; }
}


// ============================================================
// Recurring Transactions
// ============================================================

public class PdfRecurringTransactionItem
{
    public string Title { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public string Type { get; set; } = string.Empty;

    public string Category { get; set; } = string.Empty;

    public string? OtherDescription { get; set; }

    public DateTime NextOccurrenceDate { get; set; }

    public string ReminderStatus { get; set; } = string.Empty;

    public string ReminderMessage { get; set; } = string.Empty;

    public int DaysUntilDue { get; set; }
}