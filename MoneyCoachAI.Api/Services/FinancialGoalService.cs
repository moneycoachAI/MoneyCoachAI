using MoneyCoachAI.Api.DTOs.FinancialGoals;
using MoneyCoachAI.Api.Models;
using MoneyCoachAI.Api.Repositories;

namespace MoneyCoachAI.Api.Services;

public class FinancialGoalService
{
    private readonly FinancialGoalRepository _goalRepository;

    public FinancialGoalService(
        FinancialGoalRepository goalRepository)
    {
        _goalRepository = goalRepository;
    }

    public async Task<List<FinancialGoalResponse>>
        GetGoalsAsync(string userId)
    {
        var goals =
            await _goalRepository.GetByUserAsync(userId);

        return goals.Select(goal => new FinancialGoalResponse
        {
            Id = goal.Id,
            Name = goal.Name,
            TargetAmount = goal.TargetAmount,
            CurrentAmount = goal.CurrentAmount,
            TargetDate = goal.TargetDate,

            ProgressPercentage =
                goal.TargetAmount == 0
                    ? 0
                    : Math.Round(
                        (goal.CurrentAmount /
                         goal.TargetAmount) * 100,
                        1)
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
            TargetDate = request.TargetDate
        };

        await _goalRepository.CreateAsync(goal);
    }

    public async Task UpdateProgressAsync(
        string goalId,
        decimal amount)
    {
        var goal =
            await _goalRepository.GetByIdAsync(goalId);

        if (goal == null)
        {
            return;
        }

        goal.CurrentAmount += amount;

        await _goalRepository.UpdateAsync(goal);
    }

    public async Task DeleteGoalAsync(
        string goalId)
    {
        await _goalRepository.DeleteAsync(goalId);
    }
}