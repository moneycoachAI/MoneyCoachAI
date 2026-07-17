using MoneyCoachAI.Api.Models;
using MoneyCoachAI.Api.Services;
using MongoDB.Driver;

namespace MoneyCoachAI.Api.Repositories;

public class NetWorthRepository
{
    private readonly IMongoCollection<NetWorthItem> _netWorthItems;

    public NetWorthRepository(DatabaseService databaseService)
    {
        _netWorthItems = databaseService.NetWorthItems;
    }

    public async Task<List<NetWorthItem>> GetByUserAsync(string userId)
    {
        return await _netWorthItems
            .Find(item => item.UserId == userId)
            .ToListAsync();
    }

    public async Task CreateAsync(NetWorthItem item)
    {
        await _netWorthItems.InsertOneAsync(item);
    }

    public async Task<NetWorthItem?> GetByIdAsync(string id)
    {
        return await _netWorthItems
            .Find(item => item.Id == id)
            .FirstOrDefaultAsync();
    }

    public async Task UpdateAsync(NetWorthItem item)
    {
        await _netWorthItems.ReplaceOneAsync(
            x => x.Id == item.Id,
            item
        );
    }

    public async Task DeleteAsync(string id, string userId)
    {
        await _netWorthItems.DeleteOneAsync(
            item => item.Id == id && item.UserId == userId);
    }
}