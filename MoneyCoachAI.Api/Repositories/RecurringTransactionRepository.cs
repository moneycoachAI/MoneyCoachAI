using MoneyCoachAI.Api.Models;
using MoneyCoachAI.Api.Services;
using MongoDB.Driver;

namespace MoneyCoachAI.Api.Repositories;

public class RecurringTransactionRepository
{
    private readonly IMongoCollection<RecurringTransaction> _recurringTransactions;

    public RecurringTransactionRepository(DatabaseService databaseService)
    {
        _recurringTransactions = databaseService.RecurringTransactions;
    }

    public async Task<List<RecurringTransaction>> GetByUserAsync(string userId)
    {
        return await _recurringTransactions
            .Find(transaction => transaction.UserId == userId)
            .ToListAsync();
    }

    public async Task CreateAsync(RecurringTransaction transaction)
    {
        await _recurringTransactions.InsertOneAsync(transaction);
    }

    public async Task DeleteAsync(string id, string userId)
    {
        await _recurringTransactions.DeleteOneAsync(
            transaction => transaction.Id == id &&
                           transaction.UserId == userId);
    }
}