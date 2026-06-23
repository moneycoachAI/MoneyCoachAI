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
            .Select(expense => expense.Date.Month)
            .Union(budgets.Select(budget => budget.Month))
            .Union(incomes.Select(income => income.Date.Month))
            .Distinct()
            .OrderBy(month => month)
            .ToList();

        var cards = new List<MonthlyDashboardCardResponse>();

        foreach (var month in activeMonths)
        {
            var monthExpenses = expenses
                .Where(expense => expense.Date.Month == month)
                .ToList();

            var monthBudgets = budgets
                .Where(budget => budget.Month == month)
                .ToList();

            var monthIncomes = incomes
                .Where(income => income.Date.Month == month)
                .ToList();

            var totalSpent = monthExpenses.Sum(expense => expense.Amount);
            var totalBudget = monthBudgets.Sum(budget => budget.MonthlyLimit);
            var totalIncome = monthIncomes.Sum(income => income.Amount);

            var savings = totalIncome - totalSpent;

            var savingsRate =
                totalIncome > 0
                    ? (savings / totalIncome) * 100
                    : 0;

            var suggestions = await _suggestionService.GetSuggestionsAsync(
                userId,
                month,
                year);

            var topSuggestion = suggestions
                .OrderByDescending(suggestion =>
                    suggestion.Severity == "Danger" ? 4 :
                    suggestion.Severity == "Warning" ? 3 :
                    suggestion.Severity == "Info" ? 2 :
                    suggestion.Severity == "Success" ? 1 : 0)
                .FirstOrDefault();

            var topSeverity = topSuggestion?.Severity ?? "Info";
            var topMessage = topSuggestion?.Message ?? "No suggestions available.";

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
                SuggestionCount = suggestions.Count(),
                TopSeverity = topSeverity,
                TopMessage = topMessage,
                HealthScore = healthScore,
                HealthStatus = healthStatus
            });
        }

        return cards;
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
            .Select(expense => expense.Date.Month)
            .Union(incomes.Select(income => income.Date.Month))
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

}