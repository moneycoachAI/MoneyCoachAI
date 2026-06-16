using MongoDB.Driver;
using MoneyCoachAI.Api.Models;
using MoneyCoachAI.Api.Services;

namespace MoneyCoachAI.Api.Repositories;

public class ExpenseRepository
{
    private readonly IMongoCollection<Expense> _expenses;

    public ExpenseRepository(DatabaseService databaseService)
    {
        _expenses = databaseService.ExpensesCollection;
    }

    public async Task CreateAsync(Expense expense)
    {
        await _expenses.InsertOneAsync(expense);
    }

    public async Task<List<Expense>> GetByUserIdAsync(string userId)
    {
        return await _expenses
            .Find(expense => expense.UserId == userId)
            .ToListAsync();
    }

    public async Task<List<Expense>> GetByUserYearAsync(string userId, int year)
    {
        return await _expenses
            .Find(expense =>
                expense.UserId == userId &&
                expense.Date.Year == year)
            .ToListAsync();
    }

    public async Task<Expense?> GetByIdAndUserIdAsync(string id, string userId)
    {
        return await _expenses
            .Find(expense => expense.Id == id && expense.UserId == userId)
            .FirstOrDefaultAsync();
    }

    public async Task UpdateAsync(string id, string userId, Expense updatedExpense)
    {
        await _expenses.ReplaceOneAsync(
            expense => expense.Id == id && expense.UserId == userId,
            updatedExpense);
    }

    public async Task DeleteAsync(string id, string userId)
    {
        await _expenses.DeleteOneAsync(
            expense => expense.Id == id && expense.UserId == userId);
    }

    public async Task<List<Expense>> GetByUserMonthYearAsync(
        string userId,
        int month,
        int year)
    {
        return await _expenses
            .Find(expense =>
                expense.UserId == userId &&
                expense.Date.Month == month &&
                expense.Date.Year == year)
            .ToListAsync();
    }
}