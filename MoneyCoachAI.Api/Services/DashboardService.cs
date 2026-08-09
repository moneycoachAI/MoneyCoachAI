using MoneyCoachAI.Api.DTOs;
using MoneyCoachAI.Api.Repositories;

namespace MoneyCoachAI.Api.Services;

public class DashboardService
{
    private readonly ExpenseRepository _expenseRepository;
    private readonly BudgetRepository _budgetRepository;
    private readonly IncomeRepository _incomeRepository;
    private readonly SuggestionService _suggestionService;

    public DashboardService(
        ExpenseRepository expenseRepository,
        BudgetRepository budgetRepository,
        IncomeRepository incomeRepository,
        SuggestionService suggestionService)
    {
        _expenseRepository = expenseRepository;
        _budgetRepository = budgetRepository;
        _incomeRepository = incomeRepository;
        _suggestionService = suggestionService;
    }

    public async Task<List<MonthlyDashboardCardResponse>> GetMonthlyCardsAsync(
        string userId,
        int year)
    {
        var expenses = await _expenseRepository.GetByUserYearAsync(userId, year);
        var budgets = await _budgetRepository.GetByUserYearAsync(userId, year);
        var incomes = await _incomeRepository.GetByUserYearAsync(userId, year);

        var activeMonths = expenses
            .Select(expense => expense.Date.ToLocalTime().Month)
            .Union(budgets.Select(budget => budget.Month))
            .Union(incomes.Select(income => income.Date.Month))
            .Distinct()
            .OrderBy(month => month)
            .ToList();

        var cards = new List<MonthlyDashboardCardResponse>();

        foreach (var month in activeMonths)
        {
            var monthExpenses = expenses
                .Where(expense => expense.Date.ToLocalTime().Month == month)
                .ToList();

            var monthBudgets = budgets
                .Where(budget => budget.Month == month)
                .ToList();

            var monthIncomes = incomes
                .Where(income => income.Date.ToLocalTime().Month == month)
                .ToList();

            var totalSpent = monthExpenses.Sum(expense => expense.Amount);
            var totalBudget = monthBudgets.Sum(budget => budget.MonthlyLimit);
            var totalIncome = monthIncomes.Sum(income => income.Amount);

            var savings = totalIncome - totalSpent;

            var savingsRate =
                totalIncome > 0
                    ? (savings / totalIncome) * 100
                    : 0;

            var dashboardSuggestions =
                new List<(string Severity, string Message)>();

            if (totalIncome <= 0 && totalSpent > 0)
            {
                dashboardSuggestions.Add((
                    "Info",
                    "No income recorded for this month."
                ));
            }
            else if (totalIncome > 0)
            {
                var incomeUsedPercentage =
                    (totalSpent / totalIncome) * 100;

                if (totalSpent > totalIncome)
                {
                    dashboardSuggestions.Add((
                        "Danger",
                        $"You spent ₹{Math.Abs(savings)} more than your income this month."
                    ));
                }
                else if (incomeUsedPercentage >= 80)
                {
                    dashboardSuggestions.Add((
                        "Warning",
                        $"You used {incomeUsedPercentage:F1}% of your income this month."
                    ));
                }
                else if (savingsRate >= 30)
                {
                    dashboardSuggestions.Add((
                        "Success",
                        $"You saved {savingsRate:F1}% of your income this month."
                    ));
                }
            }

            foreach (var budget in monthBudgets)
            {
                if (budget.MonthlyLimit <= 0)
                {
                    continue;
                }

                var spent = monthExpenses
                    .Where(expense =>
                        expense.Category == budget.Category)
                    .Sum(expense => expense.Amount);

                var usedPercentage =
                    (spent / budget.MonthlyLimit) * 100;

                if (spent > budget.MonthlyLimit)
                {
                    dashboardSuggestions.Add((
                        "Danger",
                        $"You exceeded your {budget.Category} budget."
                    ));
                }
                else if (usedPercentage >= 80)
                {
                    dashboardSuggestions.Add((
                        "Warning",
                        $"You used {usedPercentage:F1}% of your {budget.Category} budget."
                    ));
                }
            }

            if (totalSpent > 0)
            {
                var topCategory = monthExpenses
                    .GroupBy(expense => expense.Category)
                    .Select(group => new
                    {
                        Category = group.Key,
                        Amount = group.Sum(expense => expense.Amount)
                    })
                    .OrderByDescending(item => item.Amount)
                    .FirstOrDefault();

                if (topCategory != null)
                {
                    var percentage =
                        (topCategory.Amount / totalSpent) * 100;

                    if (percentage >= 50)
                    {
                        dashboardSuggestions.Add((
                            "Info",
                            $"{topCategory.Category} makes up {percentage:F1}% of your spending."
                        ));
                    }
                }
            }

            if (dashboardSuggestions.Count == 0)
            {
                dashboardSuggestions.Add((
                    "Info",
                    "Your financial activity looks stable."
                ));
            }

            var topSuggestion = dashboardSuggestions
                .OrderByDescending(suggestion =>
                    suggestion.Severity == "Danger" ? 4 :
                    suggestion.Severity == "Warning" ? 3 :
                    suggestion.Severity == "Info" ? 2 :
                    suggestion.Severity == "Success" ? 1 : 0)
                .First();

            var topSeverity = topSuggestion.Severity;
            var topMessage = topSuggestion.Message;

            var healthScore = 100;

            if (savingsRate < 0)
            {
                healthScore -= 40;
            }
            else if (savingsRate < 10)
            {
                healthScore -= 20;
            }

            if (topSeverity == "Danger")
            {
                healthScore -= 30;
            }
            else if (topSeverity == "Warning")
            {
                healthScore -= 15;
            }

            if (healthScore < 0)
            {
                healthScore = 0;
            }

            string healthStatus;

            if (healthScore >= 75)
            {
                healthStatus = "Healthy";
            }
            else if (healthScore >= 50)
            {
                healthStatus = "Moderate";
            }
            else
            {
                healthStatus = "Risky";
            }

            cards.Add(new MonthlyDashboardCardResponse
            {
                Month = month,
                Year = year,
                TotalIncome = totalIncome,
                TotalSpent = totalSpent,
                TotalBudget = totalBudget,
                Remaining = totalBudget - totalSpent,
                Savings = savings,
                SavingsRate = savingsRate,
                SuggestionCount = dashboardSuggestions.Count(),
                TopSeverity = topSeverity,
                TopMessage = topMessage,
                HealthScore = healthScore,
                HealthStatus = healthStatus
            });
        }

        return cards;
    }

    public async Task<decimal> GetAverageMonthlySavingsAsync(
    string userId,
    int year)
    {
        var expenses =
            await _expenseRepository.GetByUserYearAsync(
                userId,
                year);

        var incomes =
            await _incomeRepository.GetByUserYearAsync(
                userId,
                year);

        var activeMonths = expenses
            .Select(expense => expense.Date.ToLocalTime().Month)
            .Union(
                incomes.Select(
                    income => income.Date.ToLocalTime().Month))
            .Distinct()
            .ToList();

        if (activeMonths.Count == 0)
        {
            return 0;
        }

        var monthlySavings = activeMonths
            .Select(month =>
            {
                var totalIncome = incomes
                    .Where(income =>
                        income.Date.ToLocalTime().Month == month)
                    .Sum(income => income.Amount);

                var totalExpenses = expenses
                    .Where(expense =>
                        expense.Date.ToLocalTime().Month == month)
                    .Sum(expense => expense.Amount);

                return totalIncome - totalExpenses;
            })
            .ToList();

        return monthlySavings.Average();
    }


    public async Task<MonthlyComparisonResponse>
    GetMonthlyComparisonAsync(
        string userId,
        int month,
        int year)
    {
        var expenses = await _expenseRepository.GetByUserYearAsync(userId, year);
        var incomes = await _incomeRepository.GetByUserYearAsync(userId, year);

     

        var activeMonths = expenses
            .Select(expense => expense.Date.ToLocalTime().Month)
            .Union(incomes.Select(income => income.Date.ToLocalTime().Month))
            .Distinct()
            .OrderBy(activeMonth => activeMonth)
            .ToList();


        var currentMonthIndex = activeMonths.IndexOf(month);

        if (currentMonthIndex <= 0)
        {
            return new MonthlyComparisonResponse
            {
                CurrentMonth = month,
                CurrentYear = year,
                PreviousMonth = 0,
                PreviousYear = year
            };
        }

        var previousMonth = activeMonths[currentMonthIndex - 1];
        var previousYear = year;

        var currentExpenses =
            await _expenseRepository.GetByUserMonthYearAsync(
                userId,
                month,
                year);

        var currentIncomes =
            await _incomeRepository.GetByUserMonthYearAsync(
                userId,
                month,
                year);



        var previousExpenses =
            await _expenseRepository.GetByUserMonthYearAsync(
                userId,
                previousMonth,
                previousYear);

        var previousIncomes =
            await _incomeRepository.GetByUserMonthYearAsync(
                userId,
                previousMonth,
                previousYear);

        var currentIncome = currentIncomes.Sum(x => x.Amount);
        var previousIncome = previousIncomes.Sum(x => x.Amount);

        var currentSpent = currentExpenses.Sum(x => x.Amount);
        var previousSpent = previousExpenses.Sum(x => x.Amount);

        var currentSavings = currentIncome - currentSpent;
        var previousSavings = previousIncome - previousSpent;

        double incomeChange =
            previousIncome == 0
                ? 0
                : (double)((currentIncome - previousIncome)
                    / previousIncome * 100);

        double expenseChange =
            previousSpent == 0
                ? 0
                : (double)((currentSpent - previousSpent)
                    / previousSpent * 100);

        double savingsChange =
            previousSavings == 0
                ? 0
                : (double)((currentSavings - previousSavings)
                    / Math.Abs(previousSavings) * 100);

        return new MonthlyComparisonResponse
        {
            CurrentMonth = month,
            CurrentYear = year,

            PreviousMonth = previousMonth,
            PreviousYear = previousYear,

            CurrentIncome = currentIncome,
            PreviousIncome = previousIncome,

            CurrentSpent = currentSpent,
            PreviousSpent = previousSpent,

            CurrentSavings = currentSavings,
            PreviousSavings = previousSavings,

            IncomeChangePercent = Math.Round(incomeChange, 1),
            ExpenseChangePercent = Math.Round(expenseChange, 1),
            SavingsChangePercent = Math.Round(savingsChange, 1)
        };
    }

    public async Task<List<AiAdvisorInsightResponse>>
    GetAiAdvisorInsightsAsync(
        string userId,
        int month,
        int year)
    {
        var insights =
            new List<AiAdvisorInsightResponse>();

        var comparison =
            await GetMonthlyComparisonAsync(
                userId,
                month,
                year);

        if (comparison.ExpenseChangePercent > 20)
        {
            insights.Add(
                new AiAdvisorInsightResponse
                {
                    Title = "Expense Alert",
                    Severity = "Warning",
                    Message =
                        $"Your expenses increased by {comparison.ExpenseChangePercent:F1}% compared to the previous month. Review discretionary spending."
                });
        }

        if (comparison.IncomeChangePercent < 0)
        {
            insights.Add(
                new AiAdvisorInsightResponse
                {
                    Title = "Income Drop",
                    Severity = "Danger",
                    Message =
                        $"Your income decreased by {Math.Abs(comparison.IncomeChangePercent):F1}% compared to the previous month."
                });
        }

        if (comparison.SavingsChangePercent > 0)
        {
            insights.Add(
                new AiAdvisorInsightResponse
                {
                    Title = "Savings Improvement",
                    Severity = "Success",
                    Message =
                        $"Great job! Your savings improved by {comparison.SavingsChangePercent:F1}% compared to the previous month."
                });
        }

        if (comparison.CurrentSavings < 0)
        {
            insights.Add(
                new AiAdvisorInsightResponse
                {
                    Title = "Negative Savings",
                    Severity = "Danger",
                    Message =
                        $"You spent more than you earned this month. Consider reducing non-essential expenses."
                });
        }

        if (!insights.Any())
        {
            insights.Add(
                new AiAdvisorInsightResponse
                {
                    Title = "Healthy Finances",
                    Severity = "Success",
                    Message =
                        "Your financial activity looks stable. Keep following your current budgeting habits."
                });
        }

        return insights;
    }

}