using MongoDB.Driver;
using MoneyCoachAI.Api.Models;
using MoneyCoachAI.Api.Services;

namespace MoneyCoachAI.Api.Repositories;

public class IncomeRepository
{
    private readonly IMongoCollection<Income> _incomes;

    public IncomeRepository(DatabaseService databaseService)
    {
        _incomes = databaseService.IncomesCollection;
    }

    public async Task CreateAsync(Income income)
    {
        await _incomes.InsertOneAsync(income);
    }

    public async Task<List<Income>> GetByUserIdAsync(string userId)
    {
        return await _incomes
            .Find(income => income.UserId == userId)
            .ToListAsync();
    }

    public async Task<List<Income>> GetByUserMonthYearAsync(
     string userId,
     int month,
     int year)
    {
        var startDate = new DateTime(year, month, 1).ToUniversalTime();
        var endDate = new DateTime(year, month, 1).AddMonths(1).ToUniversalTime();

        return await _incomes
            .Find(income =>
                income.UserId == userId &&
                income.Date >= startDate &&
                income.Date < endDate)
            .ToListAsync();
    }

    public async Task<List<Income>> GetByUserYearAsync(
    string userId,
    int year)
    {
        var startDate = new DateTime(year, 1, 1).ToUniversalTime();
        var endDate = new DateTime(year + 1, 1, 1).ToUniversalTime();

        return await _incomes
            .Find(income =>
                income.UserId == userId &&
                income.Date >= startDate &&
                income.Date < endDate)
            .ToListAsync();
    }

    public async Task<Income?> GetByIdAndUserIdAsync(
        string id,
        string userId)
    {
        return await _incomes
            .Find(income => income.Id == id && income.UserId == userId)
            .FirstOrDefaultAsync();
    }

    public async Task UpdateAsync(
        string id,
        string userId,
        Income updatedIncome)
    {
        await _incomes.ReplaceOneAsync(
            income => income.Id == id && income.UserId == userId,
            updatedIncome);
    }

    public async Task<bool> ExistsRecurringIncomeAsync(
    string userId,
    string recurringTransactionId,
    int month,
    int year)
    {
        var startDate = new DateTime(year, month, 1);
        var endDate = startDate.AddMonths(1);

        return await _incomes
            .Find(income =>
                income.UserId == userId &&
                income.RecurringTransactionId == recurringTransactionId &&
                income.Date >= startDate &&
                income.Date < endDate)
            .AnyAsync();
    }

    public async Task DeleteAsync(string id, string userId)
    {
        await _incomes.DeleteOneAsync(
            income => income.Id == id && income.UserId == userId);
    }
}