using MoneyCoachAI.Api.Models;
using MoneyCoachAI.Api.Services;
using MongoDB.Driver;

namespace MoneyCoachAI.Api.Repositories;

public class NetWorthSnapshotRepository
{
    private readonly IMongoCollection<NetWorthSnapshot> _snapshots;

    public NetWorthSnapshotRepository(DatabaseService databaseService)
    {
        _snapshots = databaseService.NetWorthSnapshots;
    }

    public async Task CreateAsync(NetWorthSnapshot snapshot)
    {
        await _snapshots.InsertOneAsync(snapshot);
    }

    public async Task<List<NetWorthSnapshot>> GetByUserAsync(string userId)
    {
        return await _snapshots
            .Find(snapshot => snapshot.UserId == userId)
            .SortBy(snapshot => snapshot.SnapshotDate)
            .ToListAsync();
    }
}