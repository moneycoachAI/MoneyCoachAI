using MoneyCoachAI.Api.DTOs;
using MoneyCoachAI.Api.Models;
using MoneyCoachAI.Api.Repositories;

namespace MoneyCoachAI.Api.Services;

public class ExpenseService
{
    private readonly ExpenseRepository _expenseRepository;


    public ExpenseService(ExpenseRepository expenseRepository)
    {
        _expenseRepository = expenseRepository;
    }

    public async Task CreateExpenseAsync(string userId, CreateExpenseRequest request)
    {
        var expense = new Expense
        {
            UserId = userId,
            Amount = request.Amount,
            Category = request.Category,
            Description = request.Description,
            Date = request.Date,
            CreatedAt = DateTime.UtcNow
        };

        await _expenseRepository.CreateAsync(expense);
    }

    public async Task<List<Expense>> GetExpensesAsync(string userId)
    {
        return await _expenseRepository.GetByUserIdAsync(userId);
    }

    public async Task<Expense?> GetExpenseByIdAsync(string id, string userId)
    {
        return await _expenseRepository.GetByIdAndUserIdAsync(id, userId);
    }

    public async Task<bool> UpdateExpenseAsync(string id, UpdateExpenseRequest request, string userId)
    {
        var existingExpense = await _expenseRepository.GetByIdAndUserIdAsync(id, userId);

        if (existingExpense == null)
        {
            return false;
        }

        existingExpense.Amount = request.Amount;
        existingExpense.Category = request.Category;
        existingExpense.Description = request.Description;
        existingExpense.Date = request.Date;

        await _expenseRepository.UpdateAsync(id, userId, existingExpense);

        return true;
    }

    public async Task<bool> DeleteExpenseAsync(string id, string userId)
    {
        var existingExpense = await _expenseRepository.GetByIdAndUserIdAsync(id, userId);

        if (existingExpense == null)
        {
            return false;
        }

        await _expenseRepository.DeleteAsync(id, userId);

        return true;
    }
}