using MoneyCoachAI.Api.Models;
using MongoDB.Driver;
using MoneyCoachAI.Api.Services;

namespace MoneyCoachAI.Api.Repositories;

public class FinancialGoalRepository
{
    private readonly IMongoCollection<FinancialGoal> _financialGoals;

    public FinancialGoalRepository(
        DatabaseService databaseService)
    {
        _financialGoals = databaseService.FinancialGoals;
    }

    public async Task<List<FinancialGoal>>
        GetByUserAsync(string userId)
    {
        return await _financialGoals
            .Find(goal => goal.UserId == userId)
            .ToListAsync();
    }

    public async Task<FinancialGoal?>
        GetByIdAsync(string id)
    {
        return await _financialGoals
            .Find(goal => goal.Id == id)
            .FirstOrDefaultAsync();
    }

    public async Task CreateAsync(
        FinancialGoal goal)
    {
        await _financialGoals.InsertOneAsync(goal);
    }

    public async Task UpdateAsync(
        FinancialGoal goal)
    {
        await _financialGoals.ReplaceOneAsync(
            existingGoal => existingGoal.Id == goal.Id,
            goal);
    }

    public async Task DeleteAsync(
        string id)
    {
        await _financialGoals.DeleteOneAsync(
            goal => goal.Id == id);
    }
}