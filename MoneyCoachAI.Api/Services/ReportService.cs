using MoneyCoachAI.Api.DTOs;
using MoneyCoachAI.Api.Repositories;

namespace MoneyCoachAI.Api.Services;

public class ReportService
{
    private readonly ExpenseRepository _expenseRepository;
    private readonly BudgetRepository _budgetRepository;
    private readonly IncomeRepository _incomeRepository;
    private readonly MoneyDueRepository _moneyDueRepository;

    public ReportService(
        ExpenseRepository expenseRepository,
        BudgetRepository budgetRepository,
        IncomeRepository incomeRepository,
        MoneyDueRepository moneyDueRepository)
    {
        _expenseRepository = expenseRepository;
        _budgetRepository = budgetRepository;
        _incomeRepository = incomeRepository;
        _moneyDueRepository = moneyDueRepository;
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

        var incomes =
            await _incomeRepository.GetByUserMonthYearAsync(
                userId,
                month,
                year);

        var totalIncome =
            incomes.Sum(income => income.Amount);

        var totalSpent =
            expenses.Sum(expense => expense.Amount);

        return new MonthlyReportResponse
        {
            Month = month,
            Year = year,

            TotalIncome = totalIncome,

            TotalSpent = totalSpent,

            Savings = totalIncome - totalSpent
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
                TotalSpent = group.Sum(expense => expense.Amount),

                Descriptions = group
                    .Where(expense =>
                        !string.IsNullOrWhiteSpace(expense.Description))
                    .Select(expense => expense.Description.Trim())
                    .Distinct()
                    .ToList()
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


    public async Task<MoneyDueReportResponse> GetMoneyDueReportAsync(
        string userId,
        int month,
        int year)
    {
        if (month < 1 || month > 12)
        {
            throw new ArgumentOutOfRangeException(nameof(month));
        }

        var items = await _moneyDueRepository.GetByUserIdAsync(userId);

        // A monthly Money Due report is based on the record's due date.
        var monthlyItems = items
            .Where(item =>
                item.DueDate.Month == month &&
                item.DueDate.Year == year)
            .ToList();

        var activeItems = monthlyItems
            .Where(item =>
                item.Status != "Completed" &&
                item.Status != "Cancelled")
            .ToList();

        static bool IsType(MoneyCoachAI.Api.Models.MoneyDue item, string dueType) =>
            string.Equals(
                item.DueType,
                dueType,
                StringComparison.OrdinalIgnoreCase);

        var totalReceivable = activeItems
            .Where(item => IsType(item, "Receivable"))
            .Sum(item => Math.Max(0, item.TotalAmount - item.SettledAmount));

        var totalPayable = activeItems
            .Where(item => IsType(item, "Payable"))
            .Sum(item => Math.Max(0, item.TotalAmount - item.SettledAmount));

        var receivableInterest = monthlyItems
            .Where(item => item.HasInterest && IsType(item, "Receivable"))
            .Sum(item => item.InterestAmount);

        var payableInterest = monthlyItems
            .Where(item => item.HasInterest && IsType(item, "Payable"))
            .Sum(item => item.InterestAmount);

        var selectedMonthEnd = new DateTime(
            year,
            month,
            DateTime.DaysInMonth(year, month),
            23,
            59,
            59,
            DateTimeKind.Utc);

        return new MoneyDueReportResponse
        {
            TotalReceivable = totalReceivable,
            TotalPayable = totalPayable,
            ReceivableInterest = receivableInterest,
            PayableInterest = payableInterest,
            PendingCount = monthlyItems.Count(item => item.Status == "Pending"),
            PartiallyPaidCount = monthlyItems.Count(item => item.Status == "PartiallyPaid"),
            CompletedCount = monthlyItems.Count(item => item.Status == "Completed"),
            OverdueCount = activeItems.Count(item => item.DueDate < selectedMonthEnd),
            ActiveReceivableCount = activeItems.Count(item => IsType(item, "Receivable")),
            ActivePayableCount = activeItems.Count(item => IsType(item, "Payable"))
        };
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