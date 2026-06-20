using MoneyCoachAI.Api.DTOs;
using MoneyCoachAI.Api.Repositories;

namespace MoneyCoachAI.Api.Services;

public class ReportService
{
    private readonly ExpenseRepository _expenseRepository;
    private readonly BudgetRepository _budgetRepository;

    public ReportService(
        ExpenseRepository expenseRepository,
        BudgetRepository budgetRepository)
    {
        _expenseRepository = expenseRepository;
        _budgetRepository = budgetRepository;
    }

    public async Task<MonthlyReportResponse> GetMonthlyReportAsync(
        string userId,
        int month,
        int year)
    {
        var expenses = await _expenseRepository.GetByUserMonthYearAsync(
            userId,
            month,
            year);

        var totalSpent = expenses.Sum(expense => expense.Amount);

        return new MonthlyReportResponse
        {
            Month = month,
            Year = year,
            TotalSpent = totalSpent
        };
    }

    public async Task<List<CategoryReportResponse>> GetCategoryReportAsync(
        string userId,
        int month,
        int year)
    {
        var expenses = await _expenseRepository.GetByUserMonthYearAsync(
            userId,
            month,
            year);

        var categoryReport = expenses
            .GroupBy(expense => expense.Category)
            .Select(group => new CategoryReportResponse
            {
                Category = group.Key,
                TotalSpent = group.Sum(expense => expense.Amount)
            })
            .ToList();

        return categoryReport;
    }

    public async Task<List<BudgetSummaryResponse>> GetBudgetSummaryAsync(
        string userId,
        int month,
        int year)
    {
        var expenses = await _expenseRepository.GetByUserMonthYearAsync(
            userId,
            month,
            year);

        var budgets = await _budgetRepository.GetByUserMonthYearAsync(
            userId,
            month,
            year);

        var response = budgets.Select(budget =>
        {
            var spent = expenses
                .Where(expense => expense.Category == budget.Category)
                .Sum(expense => expense.Amount);

            return new BudgetSummaryResponse
            {
                Category = budget.Category,
                BudgetLimit = budget.MonthlyLimit,
                Spent = spent,
                Remaining = budget.MonthlyLimit - spent,
                IsOverBudget = spent > budget.MonthlyLimit
            };
        }).ToList();

        return response;
    }

    public async Task<TopCategoryResponse?> GetTopCategoryAsync(
    string userId,
    int month,
    int year)
    {
        var categoryReport =
            await GetCategoryReportAsync(userId, month, year);

        if (!categoryReport.Any())
        {
            return null;
        }

        var totalSpent =
            categoryReport.Sum(x => x.TotalSpent);

        var topCategory =
            categoryReport
                .OrderByDescending(x => x.TotalSpent)
                .First();

        var percentage =
            totalSpent > 0
                ? (topCategory.TotalSpent / totalSpent) * 100
                : 0;

        string severity =
            percentage >= 50 ? "High"
            : percentage >= 30 ? "Medium"
            : "Low";

        return new TopCategoryResponse
        {
            Category = topCategory.Category,
            TotalSpent = topCategory.TotalSpent,
            PercentageOfTotal = percentage,
            Severity = severity
        };
    }
}