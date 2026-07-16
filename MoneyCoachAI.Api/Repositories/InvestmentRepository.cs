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

    public async Task UpdateAsync(Investment investment)
    {
        await _investments.ReplaceOneAsync(
            x => x.Id == investment.Id,
            investment
        );
    }

    public async Task<Investment?> GetByIdAsync(string id)
    {
        return await _investments
            .Find(i => i.Id == id)
            .FirstOrDefaultAsync();
    }

    public async Task DeleteAsync(string id, string userId)
    {
        await _investments.DeleteOneAsync(
            i => i.Id == id &&
                 i.UserId == userId);
    }

}