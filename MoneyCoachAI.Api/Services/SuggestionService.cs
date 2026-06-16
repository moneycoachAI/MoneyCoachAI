using MoneyCoachAI.Api.DTOs;
using MoneyCoachAI.Api.Repositories;

namespace MoneyCoachAI.Api.Services;

public class SuggestionService
{
    private readonly ReportService _reportService;
    private readonly IncomeRepository _incomeRepository;

    public SuggestionService(
        ReportService reportService,
        IncomeRepository incomeRepository)
    {
        _reportService = reportService;
        _incomeRepository = incomeRepository;
    }

    public async Task<List<SuggestionResponse>> GetSuggestionsAsync(
        string userId,
        int month,
        int year)
    {
        var suggestions = new List<SuggestionResponse>();

        var monthlyReport = await _reportService.GetMonthlyReportAsync(
            userId,
            month,
            year);

        var categoryReport = await _reportService.GetCategoryReportAsync(
            userId,
            month,
            year);

        var budgetSummary = await _reportService.GetBudgetSummaryAsync(
            userId,
            month,
            year);

        var incomes = await _incomeRepository.GetByUserMonthYearAsync(
            userId,
            month,
            year);

        var totalIncome = incomes.Sum(income => income.Amount);
        var totalSpent = monthlyReport.TotalSpent;
        var savings = totalIncome - totalSpent;

       

        // Income-based suggestions
        if (totalIncome <= 0 && totalSpent > 0)
        {
            suggestions.Add(new SuggestionResponse
            {
                Type = "NoIncomeRecorded",
                Category = "Overall",
                Severity = "Info",
                Message = "No income recorded for this month. Add your income to get accurate savings and spending insights."
            });
        }
        else if (totalIncome > 0)
        {
            var incomeUsedPercentage = (totalSpent / totalIncome) * 100;

            if (totalSpent > totalIncome)
            {
                suggestions.Add(new SuggestionResponse
                {
                    Type = "ExpensesExceededIncome",
                    Category = "Overall",
                    Severity = "Danger",
                    Message = $"Danger! You spent ₹{Math.Abs(savings)} more than your income this month. Try reducing unnecessary expenses immediately."
                });
            }
            else if (incomeUsedPercentage >= 80)
            {
                suggestions.Add(new SuggestionResponse
                {
                    Type = "HighIncomeUsage",
                    Category = "Overall",
                    Severity = "Warning",
                    Message = $"Warning! You have already spent {incomeUsedPercentage:F1}% of your income. Keep control of spending for the rest of the month."
                });
            }
            else
            {
                var savingsRate = ((totalIncome - totalSpent) / totalIncome) * 100;

                if (savingsRate >= 30)
                {
                    suggestions.Add(new SuggestionResponse
                    {
                        Type = "GoodSavingsRate",
                        Category = "Overall",
                        Severity = "Success",
                        Message = $"Excellent! You saved {savingsRate:F1}% of your income this month. Keep building this habit."
                    });
                }
            }
        }

        // Budget-based suggestions
        foreach (var budget in budgetSummary)
        {
            if (budget.BudgetLimit <= 0)
            {
                continue;
            }

            var usedPercentage = (budget.Spent / budget.BudgetLimit) * 100;

            if (budget.IsOverBudget)
            {
                suggestions.Add(new SuggestionResponse
                {
                    Type = "OverBudget",
                    Category = budget.Category,
                    Severity = "Danger",
                    Message = $"Danger! You exceeded your {budget.Category} budget by ₹{Math.Abs(budget.Remaining)}. Try reducing {budget.Category} spending immediately."
                });
            }
            else if (usedPercentage >= 80)
            {
                suggestions.Add(new SuggestionResponse
                {
                    Type = "NearBudgetLimit",
                    Category = budget.Category,
                    Severity = "Warning",
                    Message = $"Warning! You have already used {usedPercentage:F1}% of your {budget.Category} budget. Spend carefully for the rest of the month."
                });
            }
            else if (usedPercentage <= 50)
            {
                suggestions.Add(new SuggestionResponse
                {
                    Type = "GoodBudgetControl",
                    Category = budget.Category,
                    Severity = "Success",
                    Message = $"Great job! You have used only {usedPercentage:F1}% of your {budget.Category} budget. Keep going and maintain this habit."
                });
            }
            else
            {
                suggestions.Add(new SuggestionResponse
                {
                    Type = "HealthySpending",
                    Category = budget.Category,
                    Severity = "Info",
                    Message = $"Your {budget.Category} spending is under control. You have used {usedPercentage:F1}% of your budget."
                });
            }
        }

        // Category-based suggestions
        foreach (var category in categoryReport)
        {
            if (monthlyReport.TotalSpent <= 0)
            {
                continue;
            }

            var categoryPercentage =
                (category.TotalSpent / monthlyReport.TotalSpent) * 100;

            if (categoryPercentage >= 50)
            {
                suggestions.Add(new SuggestionResponse
                {
                    Type = "HighCategorySpending",
                    Category = category.Category,
                    Severity = "Info",
                    Message = $"{category.Category} makes up {categoryPercentage:F1}% of your total monthly spending. Consider reviewing this category."
                });
            }
        }

        if (suggestions.Count == 0)
        {
            suggestions.Add(new SuggestionResponse
            {
                Type = "NoData",
                Category = "Overall",
                Severity = "Info",
                Message = "No budget, income, or spending data found for this month. Add income, expenses, and budgets to get smart suggestions."
            });
        }

        return suggestions;
    }
}