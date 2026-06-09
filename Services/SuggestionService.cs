using MoneyCoachAI.Api.DTOs;

namespace MoneyCoachAI.Api.Services;

public class SuggestionService
{
    private readonly ReportService _reportService;

    public SuggestionService(ReportService reportService)
    {
        _reportService = reportService;
    }

    public async Task<List<SuggestionResponse>> GetSuggestionsAsync(string userId,int month, int year)
    {
        var suggestions = new List<SuggestionResponse>();

        var monthlyReport = await _reportService.GetMonthlyReportAsync(userId, month, year);

        var categoryReport = await _reportService.GetCategoryReportAsync(userId, month, year);

        var budgetSummary = await _reportService.GetBudgetSummaryAsync(userId, month, year);

        foreach(var budget in budgetSummary)
        {
            if (budget.IsOverBudget)
            {
                suggestions.Add(new SuggestionResponse
                {
                    Type = "OverBudget",
                    Category = budget.Category,
                    Message = $"You exceeded your {budget.Category} budget by ₹ {Math.Abs(budget.Remaining)}. Try reducing {budget.Category} spending by 15-20% next month,"
                });
            }
            else if (budget.BudgetLimit > 0)
            {
                var userPercentage = (budget.Spent /budget.BudgetLimit) * 100;

                if(userPercentage > 80)
                {
                    suggestions.Add(new SuggestionResponse
                    {
                        Type = "NearBudgetLimit",
                        Category = budget.Category,
                        Message = $"You have used {userPercentage:F1}% of your {budget.Category} budget. Be careful for the rest of the month."
                    });
                }
            }
        }

        foreach (var category in categoryReport)
        {
            if (monthlyReport.TotalSpent > 0)
            {
                var categoryPercentage = (category.TotalSpent / monthlyReport.TotalSpent) * 100;

                if (categoryPercentage >= 50)
                {
                    suggestions.Add(new SuggestionResponse
                    {
                        Type = "HighCategorySpending",
                        Category = category.Category,
                        Message = $"{category.Category} makes up {categoryPercentage:F1}% of your total monthly spending. Consider reviewing this category."
                    });
                }
            }
        }

        if (suggestions.Count == 0)
        {
            suggestions.Add(new SuggestionResponse
            {
                Type = "GoodProgress",
                Category = "Overall",
                Message = "Your spending looks controlled this month. Keep tracking your expenses regularly."
            });
        }

        return suggestions;
    }
}