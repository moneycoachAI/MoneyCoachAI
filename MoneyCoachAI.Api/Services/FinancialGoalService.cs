using MoneyCoachAI.Api.DTOs.FinancialGoals;
using MoneyCoachAI.Api.Models;
using MoneyCoachAI.Api.Repositories;

namespace MoneyCoachAI.Api.Services;

public class FinancialGoalService
{
    private readonly FinancialGoalRepository _goalRepository;
    private readonly DashboardService _dashboardService;

    public FinancialGoalService(
        FinancialGoalRepository goalRepository,
        DashboardService dashboardService)
    {
        _goalRepository = goalRepository;
        _dashboardService = dashboardService;
    }

    public async Task<List<FinancialGoalResponse>> GetGoalsAsync(string userId)
    {
        var goals = await _goalRepository.GetByUserAsync(userId);

        return goals.Select(goal => new FinancialGoalResponse
        {
            Id = goal.Id,
            Name = goal.Name,
            TargetAmount = goal.TargetAmount,
            CurrentAmount = goal.CurrentAmount,
            CreatedAt = goal.CreatedAt,
            TargetDate = goal.TargetDate,

            ProgressPercentage =
                goal.TargetAmount == 0
                    ? 0
                    : Math.Round(
                        (goal.CurrentAmount / goal.TargetAmount) * 100,
                        1),

            ProgressHistory = goal.ProgressHistory
                .Select(entry => new GoalProgressEntryResponse
                {
                    Amount = entry.Amount,
                    Date = entry.Date
                })
                .OrderByDescending(entry => entry.Date)
                .ToList()
        }).ToList();
    }

    public async Task CreateGoalAsync(
        string userId,
        CreateFinancialGoalRequest request)
    {
        var goal = new FinancialGoal
        {
            UserId = userId,
            Name = request.Name,
            TargetAmount = request.TargetAmount,
            CurrentAmount = 0,
            TargetDate = request.TargetDate,
            CreatedAt = DateTime.UtcNow,
            ProgressHistory = new List<GoalProgressEntry>(),
                       
        };

        await _goalRepository.CreateAsync(goal);
    }

    public async Task UpdateProgressAsync(
        string goalId,
        decimal amount)
    {
        var goal = await _goalRepository.GetByIdAsync(goalId);

        if (goal == null)
        {
            return;
        }

        goal.CurrentAmount += amount;

        goal.ProgressHistory ??= new List<GoalProgressEntry>();

        goal.ProgressHistory.Add(new GoalProgressEntry
        {
            Amount = amount,
            Date = DateTime.UtcNow
        });

        await _goalRepository.UpdateAsync(goal);
    }

    public async Task DeleteGoalAsync(string goalId)
    {
        await _goalRepository.DeleteAsync(goalId);
    }

    public async Task<List<GoalRecommendationResponse>>
        GetRecommendationsAsync(string userId)
    {
        var goals = await _goalRepository.GetByUserAsync(userId);

        var currentYear = DateTime.UtcNow.Year;

        var cards = await _dashboardService.GetMonthlyCardsAsync(
            userId,
            currentYear);

        var averageMonthlySavings =
            cards.Count == 0
                ? 0
                : cards.Average(card => card.Savings);

        var recommendations = new List<GoalRecommendationResponse>();

        foreach (var goal in goals)
        {
            if (goal.CurrentAmount >= goal.TargetAmount)
            {
                continue;
            }

            var remaining = goal.TargetAmount - goal.CurrentAmount;

            var monthsUntilTargetDate = 0;
            var requiredMonthlyContribution = remaining;
            var additionalMonthlySavingsNeeded = 0m;

            if (goal.TargetDate.HasValue)
            {
                var today = DateTime.UtcNow.Date;
                var targetDate = goal.TargetDate.Value.Date;

                monthsUntilTargetDate =
                    ((targetDate.Year - today.Year) * 12) +
                    targetDate.Month - today.Month;

                if (targetDate.Day > today.Day)
                {
                    monthsUntilTargetDate++;
                }

                if (monthsUntilTargetDate > 0)
                {
                    requiredMonthlyContribution =
                        Math.Round(remaining / monthsUntilTargetDate, 2);

                    additionalMonthlySavingsNeeded =
                        requiredMonthlyContribution > averageMonthlySavings
                            ? Math.Round(
                                requiredMonthlyContribution -
                                averageMonthlySavings,
                                2)
                            : 0;
                }
            }

            var estimatedMonths =
                averageMonthlySavings <= 0
                    ? 0
                    : (int)Math.Ceiling(
                        remaining / averageMonthlySavings);

            recommendations.Add(new GoalRecommendationResponse
            {
                GoalName = goal.Name,
                RemainingAmount = remaining,
                AverageMonthlySavings = averageMonthlySavings,
                EstimatedMonthsToComplete = estimatedMonths,

                MonthsUntilTargetDate = monthsUntilTargetDate,
                RequiredMonthlyContribution = requiredMonthlyContribution,
                AdditionalMonthlySavingsNeeded = additionalMonthlySavingsNeeded,

                SuggestedMonthlyContribution =
                    estimatedMonths > 0
                        ? Math.Round(remaining / estimatedMonths, 2)
                        : remaining,

                RecommendationMessage =
                    goal.TargetDate.HasValue && monthsUntilTargetDate > 0
                        ? additionalMonthlySavingsNeeded > 0
                            ? $"At your current savings rate, you may reach this goal in {estimatedMonths} month(s). To complete it by your target date, increase monthly savings by ₹{additionalMonthlySavingsNeeded}."
                            : "At your current savings rate, you are on track to complete this goal by the target date."
                        : averageMonthlySavings > 0
                            ? $"At your current savings rate, you may reach this goal in {estimatedMonths} month(s)."
                            : "Increase savings to achieve this goal faster."
            });
        }

        return recommendations;
    }
}