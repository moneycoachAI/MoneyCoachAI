using MongoDB.Driver;
using MoneyCoachAI.Api.Models;
using MoneyCoachAI.Api.Services;

namespace MoneyCoachAI.Api.Repositories;

public class BudgetRepository
{
    private readonly IMongoCollection<Budget> _budgets;

    public BudgetRepository(DatabaseService databaseService)
    {
        _budgets = databaseService.BudgetsCollection;
    }

    public async Task CreateAsync(Budget budget)
    {
        await _budgets.InsertOneAsync(budget);
    }

    public async Task<List<Budget>> GetByUserIdAsync(string userId)
    {
        return await _budgets
            .Find(budget => budget.UserId == userId)
            .ToListAsync();
    }

    public async Task<Budget?> GetByIdAndUserIdAsync(string id, string userId)
    {
        return await _budgets
            .Find(budget => budget.Id == id && budget.UserId == userId)
            .FirstOrDefaultAsync();
    }

    public async Task UpdateAsync(string id, string userId, Budget updatedBudget)
    {
        await _budgets.ReplaceOneAsync(
            budget => budget.Id == id && budget.UserId == userId,
            updatedBudget);
    }

    public async Task DeleteAsync(string id, string userId)
    {
        await _budgets.DeleteOneAsync(
            budget => budget.Id == id && budget.UserId == userId);
    }

    public async Task<List<Budget>> GetByUserMonthYearAsync(
    string userId,
    int month,
    int year)
    {
        return await _budgets
            .Find(budget =>
                budget.UserId == userId &&
                budget.Month == month &&
                budget.Year == year)
            .ToListAsync();
    }
}