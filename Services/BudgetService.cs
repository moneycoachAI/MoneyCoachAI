using MoneyCoachAI.Api.DTOs;
using MoneyCoachAI.Api.Models;
using MoneyCoachAI.Api.Repositories;

namespace MoneyCoachAI.Api.Services;

public class BudgetService
{
    private readonly BudgetRepository _budgetRepository;

    public BudgetService(BudgetRepository budgetRepository)
    {
        _budgetRepository = budgetRepository;
    }

    public async Task CreateBudgetAsync(string userId, CreateBudgetRequest request)
    {
        var budget = new Budget
        {
            UserId = userId,
            Category = request.Category,
            MonthlyLimit = request.MonthlyLimit,
            Month = request.Month,
            Year = request.Year,
            CreatedAt = DateTime.UtcNow
        };

        await _budgetRepository.CreateAsync(budget);
    }

    public async Task<List<Budget>> GetBudgetsAsync(string userId)
    {
        return await _budgetRepository.GetByUserIdAsync(userId);
    }

    public async Task<Budget?> GetBudgetByIdAsync(string id, string userId)
    {
        return await _budgetRepository.GetByIdAndUserIdAsync(id, userId);
    }

    public async Task<bool> UpdateBudgetAsync(string id, string userId, UpdateBudgetRequest request)
    {
        var existingBudget = await _budgetRepository.GetByIdAndUserIdAsync(id, userId);

        if (existingBudget == null)
        {
            return false;
        }

        existingBudget.Category = request.Category;
        existingBudget.MonthlyLimit = request.MonthlyLimit;
        existingBudget.Month = request.Month;
        existingBudget.Year = request.Year;

        await _budgetRepository.UpdateAsync(id, userId, existingBudget);

        return true;
    }

    public async Task<bool> DeleteBudgetAsync(string id, string userId)
    {
        var existingBudget = await _budgetRepository.GetByIdAndUserIdAsync(id, userId);

        if (existingBudget == null)
        {
            return false;
        }

        await _budgetRepository.DeleteAsync(id, userId);

        return true;
    }
}