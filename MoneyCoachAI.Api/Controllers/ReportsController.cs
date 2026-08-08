using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoneyCoachAI.Api.Services;
using System.Security.Claims;
using MoneyCoachAI.Api.DTOs;

namespace MoneyCoachAI.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly ReportService _reportService;
    private readonly SuggestionService _suggestionService;
    private readonly DashboardService _dashboardService;
    private readonly PdfReportService _pdfReportService;

    private readonly FinancialGoalService _financialGoalService;
    private readonly InvestmentService _investmentService;
    private readonly NetWorthService _netWorthService;
    private readonly RecurringTransactionService _recurringTransactionService;
    private readonly MoneyDueService _moneyDueService;
    private readonly AnnualPdfReportService _annualPdfReportService;

    public ReportsController(
        ReportService reportService,
        SuggestionService suggestionService,
        DashboardService dashboardService,
        PdfReportService pdfReportService,
        FinancialGoalService financialGoalService,
        InvestmentService investmentService,
        NetWorthService netWorthService,
        RecurringTransactionService recurringTransactionService,
        MoneyDueService moneyDueService,
        AnnualPdfReportService annualPdfReportService)
    {
        _reportService = reportService;
        _suggestionService = suggestionService;
        _dashboardService = dashboardService;
        _pdfReportService = pdfReportService;

        _financialGoalService = financialGoalService;
        _investmentService = investmentService;
        _netWorthService = netWorthService;
        _recurringTransactionService = recurringTransactionService;
        _moneyDueService = moneyDueService;
        _annualPdfReportService = annualPdfReportService;
    }

    [HttpGet("monthly")]
    public async Task<IActionResult> GetMonthlyReport(
        int month,
        int year)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId == null)
        {
            return Unauthorized();
        }

        var report = await _reportService.GetMonthlyReportAsync(
            userId,
            month,
            year);

        return Ok(report);
    }

    [HttpGet("categories")]
    public async Task<IActionResult> GetCategoryReport(
        int month,
        int year)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId == null)
        {
            return Unauthorized();
        }

        var report = await _reportService.GetCategoryReportAsync(
            userId,
            month,
            year);

        return Ok(report);
    }

    [HttpGet("budget-summary")]
    public async Task<IActionResult> GetBudgetSummary(
        int month,
        int year)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId == null)
        {
            return Unauthorized();
        }   

        var report = await _reportService.GetBudgetSummaryAsync(
            userId,
            month,
            year);

        return Ok(report);
    }


    [HttpGet("money-due")]
    public async Task<IActionResult> GetMoneyDueReport(
        int month,
        int year)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId == null)
        {
            return Unauthorized();
        }

        if (month < 1 || month > 12)
        {
            return BadRequest("Month must be between 1 and 12.");
        }

        if (year < 2000 || year > 2100)
        {
            return BadRequest("Year must be between 2000 and 2100.");
        }

        var report = await _reportService.GetMoneyDueReportAsync(
            userId,
            month,
            year);

        return Ok(report);
    }

    [HttpGet("monthly-pdf")]
    public async Task<IActionResult> ExportMonthlyPdf(
        int month,
        int year)
    {
        var userId =
            User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId == null)
        {
            return Unauthorized();
        }

        if (month < 1 || month > 12)
        {
            return BadRequest(
                "Month must be between 1 and 12.");
        }

        if (year < 2000 || year > 2100)
        {
            return BadRequest(
                "Year must be between 2000 and 2100.");
        }


        // =====================================================
        // Dashboard
        // =====================================================

        var dashboardCards =
            await _dashboardService.GetMonthlyCardsAsync(
                userId,
                year);

        var selectedCard =
            dashboardCards.FirstOrDefault(card =>
                card.Month == month &&
                card.Year == year);

        if (selectedCard == null)
        {
            return NotFound(
                "No dashboard data found for selected month.");
        }


        // =====================================================
        // Monthly comparison
        // =====================================================

        var comparison =
            await _dashboardService.GetMonthlyComparisonAsync(
                userId,
                month,
                year);


        // =====================================================
        // Reports
        // =====================================================

        var categoryReport =
            await _reportService.GetCategoryReportAsync(
                userId,
                month,
                year);

        var budgetSummary =
            await _reportService.GetBudgetSummaryAsync(
                userId,
                month,
                year);


        // =====================================================
        // Smart Suggestions
        // =====================================================

        var suggestions =
            await _suggestionService.GetSuggestionsAsync(
                userId,
                month,
                year);


        // =====================================================
        // AI Advisor
        // =====================================================

        var aiInsights =
            await _dashboardService.GetAiAdvisorInsightsAsync(
                userId,
                month,
                year);


        // =====================================================
        // Financial Goals
        // =====================================================

        var financialGoals =
            await _financialGoalService.GetGoalsAsync(
                userId);

        var goalRecommendations =
            await _financialGoalService.GetRecommendationsAsync(
                userId);


        // =====================================================
        // Investments
        // =====================================================

        var investmentSummary =
            await _investmentService.GetSummaryAsync(
                userId);

        var investmentAllocation =
            await _investmentService.GetAllocationAsync(
                userId);


        // =====================================================
        // Net Worth
        // =====================================================

        var netWorthSummary =
            await _netWorthService.GetSummaryAsync(
                userId);


        // =====================================================
        // Recurring Transactions
        // =====================================================

        var recurringTransactions =
            await _recurringTransactionService
                .GetRecurringTransactionsAsync(
                    userId);


        // =====================================================
        // Build PDF response
        // =====================================================

        var pdfData = new MonthlyReportPdfResponse
        {
            // -------------------------------------------------
            // Financial Overview
            // -------------------------------------------------

            TotalIncome =
                selectedCard.TotalIncome,

            TotalSpent =
                selectedCard.TotalSpent,

            Savings =
                selectedCard.Savings,

            SavingsRate =
                selectedCard.SavingsRate,

            TotalBudget =
                selectedCard.TotalBudget,

            RemainingBudget =
                selectedCard.Remaining,

            HealthScore =
                selectedCard.HealthScore,

            HealthStatus =
                selectedCard.HealthStatus,


            // -------------------------------------------------
            // Monthly Comparison
            // -------------------------------------------------

            Comparison = new PdfMonthlyComparison
            {
                PreviousMonth =
                    comparison.PreviousMonth,

                PreviousYear =
                    comparison.PreviousYear,

                CurrentIncome =
                    comparison.CurrentIncome,

                PreviousIncome =
                    comparison.PreviousIncome,

                CurrentSpent =
                    comparison.CurrentSpent,

                PreviousSpent =
                    comparison.PreviousSpent,

                CurrentSavings =
                    comparison.CurrentSavings,

                PreviousSavings =
                    comparison.PreviousSavings,

                IncomeChangePercent =
                    comparison.IncomeChangePercent,

                ExpenseChangePercent =
                    comparison.ExpenseChangePercent,

                SavingsChangePercent =
                    comparison.SavingsChangePercent
            },


            // -------------------------------------------------
            // Categories
            // -------------------------------------------------

            Categories = categoryReport
                .Select(category =>
                    new PdfCategoryItem
                    {
                        Category =
                            category.Category,

                        Amount =
                            category.TotalSpent,

                        Percentage =
                            selectedCard.TotalSpent <= 0
                                ? 0
                                : Math.Round(
                                    category.TotalSpent /
                                    selectedCard.TotalSpent *
                                    100,
                                    1)
                    })
                .OrderByDescending(category =>
                    category.Amount)
                .ToList(),


            // -------------------------------------------------
            // Budgets
            // -------------------------------------------------

            Budgets = budgetSummary
                .Select(budget =>
                    new PdfBudgetItem
                    {
                        Category =
                            budget.Category,

                        BudgetLimit =
                            budget.BudgetLimit,

                        Spent =
                            budget.Spent,

                        Remaining =
                            budget.Remaining,

                        UsedPercentage =
                            budget.BudgetLimit <= 0
                                ? 0
                                : Math.Round(
                                    budget.Spent /
                                    budget.BudgetLimit *
                                    100,
                                    1),

                        IsOverBudget =
                            budget.IsOverBudget
                    })
                .OrderByDescending(budget =>
                    budget.UsedPercentage)
                .ToList(),


            // -------------------------------------------------
            // Suggestions
            // -------------------------------------------------

            Suggestions = suggestions
                .Select(suggestion =>
                    new PdfSuggestionItem
                    {
                        Type =
                            suggestion.Type,

                        Category =
                            suggestion.Category,

                        Severity =
                            suggestion.Severity,

                        Message =
                            suggestion.Message
                    })
                .ToList(),


            // -------------------------------------------------
            // AI Advisor
            // -------------------------------------------------

            AiInsights = aiInsights
                .Select(insight =>
                    new PdfAiInsightItem
                    {
                        Title =
                            insight.Title,

                        Severity =
                            insight.Severity,

                        Message =
                            insight.Message
                    })
                .ToList(),


            // -------------------------------------------------
            // Financial Goals
            // -------------------------------------------------

            FinancialGoals = financialGoals
                .Select(goal =>
                {
                    var recommendation =
                        goalRecommendations.FirstOrDefault(
                            item =>
                                item.GoalName == goal.Name);

                    return new PdfFinancialGoalItem
                    {
                        Name =
                            goal.Name,

                        TargetAmount =
                            goal.TargetAmount,

                        CurrentAmount =
                            goal.CurrentAmount,

                        ProgressPercentage =
                            goal.ProgressPercentage,

                        TargetDate =
                            goal.TargetDate,

                        SuggestedMonthlyContribution =
                            recommendation?
                                .SuggestedMonthlyContribution
                            ?? 0,

                        Recommendation =
                            recommendation?
                                .RecommendationMessage
                            ?? string.Empty
                    };
                })
                .OrderByDescending(goal =>
                    goal.ProgressPercentage)
                .ToList(),


            // -------------------------------------------------
            // Investment Summary
            // -------------------------------------------------

            InvestmentSummary =
                new PdfInvestmentSummary
                {
                    TotalInvested =
                        investmentSummary.TotalInvested,

                    TotalCurrentValue =
                        investmentSummary.TotalCurrentValue,

                    TotalProfitOrLoss =
                        investmentSummary.TotalProfitOrLoss,

                    ProfitOrLossPercentage =
                        investmentSummary
                            .ProfitOrLossPercentage
                },


            // -------------------------------------------------
            // Investment Allocation
            // -------------------------------------------------

            InvestmentAllocation =
                investmentAllocation
                    .Select(allocation =>
                        new PdfInvestmentAllocationItem
                        {
                            Type =
                                allocation.Type,

                            Amount =
                                allocation.Amount,

                            Percentage =
                                investmentSummary.TotalCurrentValue
                                    <= 0
                                    ? 0
                                    : Math.Round(
                                        allocation.Amount /
                                        investmentSummary
                                            .TotalCurrentValue *
                                        100,
                                        1)
                        })
                    .OrderByDescending(allocation =>
                        allocation.Amount)
                    .ToList(),


            // -------------------------------------------------
            // Net Worth
            // -------------------------------------------------

            NetWorth =
                new PdfNetWorthSummary
                {
                    TotalAssets =
                        netWorthSummary.TotalAssets,

                    TotalLiabilities =
                        netWorthSummary.TotalLiabilities,

                    NetWorth =
                        netWorthSummary.NetWorth
                },


            // -------------------------------------------------
            // Recurring Transactions
            // -------------------------------------------------

            RecurringTransactions =
                recurringTransactions
                    .Where(transaction =>
                        transaction.IsActive)
                    .Select(transaction =>
                        new PdfRecurringTransactionItem
                        {
                            Title =
                                transaction.Title,

                            Amount =
                                transaction.Amount,

                            Type =
                                transaction.Type,

                            Category =
                                transaction.Category,

                            OtherDescription =
                                transaction.OtherDescription,

                            NextOccurrenceDate =
                                transaction.NextOccurrenceDate,

                            ReminderStatus =
                                transaction.ReminderStatus,

                            ReminderMessage =
                                transaction.ReminderMessage,

                            DaysUntilDue =
                                transaction.DaysUntilDue
                        })
                    .OrderBy(transaction =>
                        transaction.NextOccurrenceDate)
                    .ToList()
        };


        // =====================================================
        // Generate PDF
        // =====================================================

        var pdfBytes =
            _pdfReportService.GenerateMonthlyReportPdf(
                month,
                year,
                pdfData);

        return File(
            pdfBytes,
            "application/pdf",
            $"MoneyCoachAI_Report_{month}_{year}.pdf");
    }
   


    [HttpGet("annual-pdf")]
    public async Task<IActionResult> ExportAnnualPdf(
        int year)
    {
        var userId =
            User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId == null)
        {
            return Unauthorized();
        }

        if (
            year < 2000 ||
            year > DateTime.UtcNow.Year)
        {
            return BadRequest(
                "Please select a valid report year.");
        }


        // =====================================================
        // Monthly dashboard cards for selected year
        // =====================================================

        var dashboardCards =
            await _dashboardService.GetMonthlyCardsAsync(
                userId,
                year);

        var yearCards =
            dashboardCards
                .Where(card =>
                    card.Year == year)
                .OrderBy(card =>
                    card.Month)
                .ToList();

        if (yearCards.Count == 0)
        {
            return NotFound(
                "No financial data found for selected year.");
        }


        // =====================================================
        // Build each month's annual-report highlights
        // =====================================================

        var monthItems =
            new List<AnnualMonthPdfItem>();

        foreach (var card in yearCards)
        {
            var categoryReport =
                await _reportService.GetCategoryReportAsync(
                    userId,
                    card.Month,
                    year);

            var budgetSummary =
                await _reportService.GetBudgetSummaryAsync(
                    userId,
                    card.Month,
                    year);

            var suggestions =
                await _suggestionService.GetSuggestionsAsync(
                    userId,
                    card.Month,
                    year);

            var aiInsights =
                await _dashboardService.GetAiAdvisorInsightsAsync(
                    userId,
                    card.Month,
                    year);

            monthItems.Add(
                new AnnualMonthPdfItem
                {
                    Month =
                        card.Month,

                    MonthName =
                        new DateTime(
                            year,
                            card.Month,
                            1)
                        .ToString("MMMM"),

                    TotalIncome =
                        card.TotalIncome,

                    TotalSpent =
                        card.TotalSpent,

                    TotalBudget =
                        card.TotalBudget,

                    RemainingBudget =
                        card.Remaining,

                    Savings =
                        card.Savings,

                    SavingsRate =
                        card.SavingsRate,

                    HealthScore =
                        card.HealthScore,

                    HealthStatus =
                        card.HealthStatus,

                    Categories =
                        categoryReport
                            .Select(category =>
                                new PdfCategoryItem
                                {
                                    Category =
                                        category.Category,

                                    Amount =
                                        category.TotalSpent,

                                    Percentage =
                                        card.TotalSpent <= 0
                                            ? 0
                                            : Math.Round(
                                                category.TotalSpent /
                                                card.TotalSpent *
                                                100,
                                                1)
                                })
                            .OrderByDescending(category =>
                                category.Amount)
                            .ToList(),

                    Budgets =
                        budgetSummary
                            .Select(budget =>
                                new PdfBudgetItem
                                {
                                    Category =
                                        budget.Category,

                                    BudgetLimit =
                                        budget.BudgetLimit,

                                    Spent =
                                        budget.Spent,

                                    Remaining =
                                        budget.Remaining,

                                    UsedPercentage =
                                        budget.BudgetLimit <= 0
                                            ? 0
                                            : Math.Round(
                                                budget.Spent /
                                                budget.BudgetLimit *
                                                100,
                                                1),

                                    IsOverBudget =
                                        budget.IsOverBudget
                                })
                            .OrderByDescending(budget =>
                                budget.UsedPercentage)
                            .ToList(),

                    Suggestions =
                        suggestions
                            .Select(suggestion =>
                                new PdfSuggestionItem
                                {
                                    Type =
                                        suggestion.Type,

                                    Category =
                                        suggestion.Category,

                                    Severity =
                                        suggestion.Severity,

                                    Message =
                                        suggestion.Message
                                })
                            .ToList(),

                    AiInsights =
                        aiInsights
                            .Select(insight =>
                                new PdfAiInsightItem
                                {
                                    Title =
                                        insight.Title,

                                    Severity =
                                        insight.Severity,

                                    Message =
                                        insight.Message
                                })
                            .ToList()
                });
        }


        // =====================================================
        // Current/global financial position
        // =====================================================

        var financialGoals =
            await _financialGoalService.GetGoalsAsync(
                userId);

        var goalRecommendations =
            await _financialGoalService.GetRecommendationsAsync(
                userId);

        var investmentSummary =
            await _investmentService.GetSummaryAsync(
                userId);

        var investmentAllocation =
            await _investmentService.GetAllocationAsync(
                userId);

        var netWorthSummary =
            await _netWorthService.GetSummaryAsync(
                userId);

        var netWorthItems =
            await _netWorthService.GetItemsAsync(
                userId);

        var recurringTransactions =
            await _recurringTransactionService
                .GetRecurringTransactionsAsync(
                    userId);

        var moneyDueItems =
            await _moneyDueService.GetByUserIdAsync(
                userId);


        // =====================================================
        // Annual summary calculations
        // =====================================================

        var totalIncome =
            monthItems.Sum(month =>
                month.TotalIncome);

        var totalSpent =
            monthItems.Sum(month =>
                month.TotalSpent);

        var totalSavings =
            monthItems.Sum(month =>
                month.Savings);

        var averageSavingsRate =
            monthItems.Count == 0
                ? 0
                : Math.Round(
                    monthItems.Average(month =>
                        month.SavingsRate),
                    1);

        var averageHealthScore =
            monthItems.Count == 0
                ? 0
                : (int)Math.Round(
                    monthItems.Average(month =>
                        month.HealthScore));

        var overallHealthStatus =
            averageHealthScore >= 75
                ? "Healthy"
                : averageHealthScore >= 50
                    ? "Moderate"
                    : "Risky";


        // =====================================================
        // Build annual PDF response
        // =====================================================

        var pdfData =
            new AnnualReportPdfResponse
            {
                Year =
                    year,

                TotalIncome =
                    totalIncome,

                TotalSpent =
                    totalSpent,

                TotalSavings =
                    totalSavings,

                AverageSavingsRate =
                    averageSavingsRate,

                AverageHealthScore =
                    averageHealthScore,

                OverallHealthStatus =
                    overallHealthStatus,

                Months =
                    monthItems,

                FinancialGoals =
                    financialGoals
                        .Select(goal =>
                        {
                            var recommendation =
                                goalRecommendations
                                    .FirstOrDefault(item =>
                                        item.GoalName ==
                                        goal.Name);

                            return new PdfFinancialGoalItem
                            {
                                Name =
                                    goal.Name,

                                TargetAmount =
                                    goal.TargetAmount,

                                CurrentAmount =
                                    goal.CurrentAmount,

                                ProgressPercentage =
                                    goal.ProgressPercentage,

                                TargetDate =
                                    goal.TargetDate,

                                SuggestedMonthlyContribution =
                                    recommendation?
                                        .SuggestedMonthlyContribution
                                    ?? 0,

                                Recommendation =
                                    recommendation?
                                        .RecommendationMessage
                                    ?? string.Empty
                            };
                        })
                        .OrderByDescending(goal =>
                            goal.ProgressPercentage)
                        .ToList(),

                InvestmentSummary =
                    new PdfInvestmentSummary
                    {
                        TotalInvested =
                            investmentSummary.TotalInvested,

                        TotalCurrentValue =
                            investmentSummary.TotalCurrentValue,

                        TotalProfitOrLoss =
                            investmentSummary.TotalProfitOrLoss,

                        ProfitOrLossPercentage =
                            investmentSummary
                                .ProfitOrLossPercentage
                    },

                InvestmentAllocation =
                    investmentAllocation
                        .Select(allocation =>
                            new PdfInvestmentAllocationItem
                            {
                                Type =
                                    allocation.Type,

                                Amount =
                                    allocation.Amount,

                                Percentage =
                                    investmentSummary.TotalCurrentValue
                                        <= 0
                                        ? 0
                                        : Math.Round(
                                            allocation.Amount /
                                            investmentSummary
                                                .TotalCurrentValue *
                                            100,
                                            1)
                            })
                        .OrderByDescending(allocation =>
                            allocation.Amount)
                        .ToList(),

                NetWorth =
                    new PdfNetWorthSummary
                    {
                        TotalAssets =
                            netWorthSummary.TotalAssets,

                        TotalLiabilities =
                            netWorthSummary.TotalLiabilities,

                        NetWorth =
                            netWorthSummary.NetWorth
                    },

                NetWorthItems =
                    netWorthItems
                        .Select(item =>
                            new AnnualNetWorthItem
                            {
                                Name =
                                    item.Name,

                                Amount =
                                    item.Amount,

                                Type =
                                    item.Type
                            })
                        .OrderBy(item =>
                            item.Type)
                        .ThenByDescending(item =>
                            item.Amount)
                        .ToList(),

                MoneyDueItems =
                    moneyDueItems
                        .Where(item =>
                            !string.Equals(
                                item.Status,
                                "Cancelled",
                                StringComparison.OrdinalIgnoreCase))
                        .Select(item =>
                        {
                            var remainingAmount =
                                Math.Max(
                                    0,
                                    item.TotalAmount - item.SettledAmount);

                            var category =
                                string.Equals(
                                    item.Category,
                                    "Other",
                                    StringComparison.OrdinalIgnoreCase)
                                    ? string.IsNullOrWhiteSpace(
                                        item.OtherDescription)
                                        ? "Other"
                                        : item.OtherDescription.Trim()
                                    : item.Category;

                            var isOpen =
                                !string.Equals(
                                    item.Status,
                                    "Completed",
                                    StringComparison.OrdinalIgnoreCase) &&
                                !string.Equals(
                                    item.Status,
                                    "Cancelled",
                                    StringComparison.OrdinalIgnoreCase);

                            return new AnnualMoneyDueItem
                            {
                                Title =
                                    item.Title,

                                PartyName =
                                    item.PartyName,

                                DueType =
                                    item.DueType,

                                Category =
                                    category,

                                TotalAmount =
                                    item.TotalAmount,

                                SettledAmount =
                                    item.SettledAmount,

                                RemainingAmount =
                                    remainingAmount,

                                DueDate =
                                    item.DueDate,

                                Status =
                                    item.Status,

                                IsOverdue =
                                    isOpen &&
                                    item.DueDate.Date < DateTime.UtcNow.Date
                            };
                        })
                        .OrderBy(item =>
                            item.Status == "Completed" ? 1 : 0)
                        .ThenBy(item =>
                            item.DueDate)
                        .ToList(),

                RecurringTransactions =
                    recurringTransactions
                        .Where(transaction =>
                            transaction.IsActive)
                        .Select(transaction =>
                            new PdfRecurringTransactionItem
                            {
                                Title =
                                    transaction.Title,

                                Amount =
                                    transaction.Amount,

                                Type =
                                    transaction.Type,

                                Category =
                                    transaction.Category,

                                OtherDescription =
                                    transaction.OtherDescription,

                                NextOccurrenceDate =
                                    transaction.NextOccurrenceDate,

                                ReminderStatus =
                                    transaction.ReminderStatus,

                                ReminderMessage =
                                    transaction.ReminderMessage,

                                DaysUntilDue =
                                    transaction.DaysUntilDue
                            })
                        .OrderBy(transaction =>
                            transaction.NextOccurrenceDate)
                        .ToList()
            };


        // =====================================================
        // Generate annual PDF
        // =====================================================

        var pdfBytes =
            _annualPdfReportService
                .GenerateAnnualReportPdf(
                    pdfData);

        return File(
            pdfBytes,
            "application/pdf",
            $"MoneyCoachAI_Annual_Report_{year}.pdf");
    }

}   