using MoneyCoachAI.Api.Models;
using MoneyCoachAI.Api.Services;
using MongoDB.Driver;

namespace MoneyCoachAI.Api.Repositories;

public class InvestmentRepository
{
    private readonly IMongoCollection<Investment> _investments;

    public InvestmentRepository(DatabaseService databaseService)
    {
        _investments = databaseService.Investments;
    }

    public async Task<List<Investment>> GetByUserAsync(string userId)
    {
        return await _investments
            .Find(i => i.UserId == userId)
            .ToListAsync();
    }

    public async Task CreateAsync(Investment investment)
    {
        await _investments.InsertOneAsync(investment);
    }

    public async Task DeleteAsync(string id, string userId)
    {
        await _investments.DeleteOneAsync(
            i => i.Id == id &&
                 i.UserId == userId);
    }
}