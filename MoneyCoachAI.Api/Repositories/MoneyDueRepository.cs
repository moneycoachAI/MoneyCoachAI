using MoneyCoachAI.Api.Models;
using MoneyCoachAI.Api.Services;
using MongoDB.Driver;

namespace MoneyCoachAI.Api.Repositories;

public class MoneyDueRepository
{
    private readonly IMongoCollection<MoneyDue> _moneyDueCollection;

    public MoneyDueRepository(DatabaseService databaseService)
    {
        _moneyDueCollection = databaseService.MoneyDueCollection;
    }

    public async Task<List<MoneyDue>> GetByUserIdAsync(string userId)
    {
        return await _moneyDueCollection
            .Find(x => x.UserId == userId)
            .SortByDescending(x => x.CreatedAt)
            .ToListAsync();
    }

    public async Task<MoneyDue?> GetByIdAsync(string id)
    {
        return await _moneyDueCollection
            .Find(x => x.Id == id)
            .FirstOrDefaultAsync();
    }

    public async Task CreateAsync(MoneyDue moneyDue)
    {
        await _moneyDueCollection.InsertOneAsync(moneyDue);
    }

    public async Task UpdateAsync(MoneyDue moneyDue)
    {
        await _moneyDueCollection.ReplaceOneAsync(
            x => x.Id == moneyDue.Id,
            moneyDue);
    }

    public async Task DeleteAsync(string id)
    {
        await _moneyDueCollection.DeleteOneAsync(x => x.Id == id);
    }

    public async Task<List<MoneyDue>> GetPendingAsync()
    {
        return await _moneyDueCollection
            .Find(x =>
                x.Status == "Pending" ||
                x.Status == "PartiallyPaid")
            .ToListAsync();
    }
}