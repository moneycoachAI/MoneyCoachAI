using MoneyCoachAI.Api.DTOs.NetWorth;
using MoneyCoachAI.Api.Models;
using MoneyCoachAI.Api.Repositories;

namespace MoneyCoachAI.Api.Services;

public class NetWorthService
{
    private readonly NetWorthRepository _netWorthRepository;
    private readonly NetWorthSnapshotRepository _snapshotRepository;

    public NetWorthService(NetWorthRepository netWorthRepository, NetWorthSnapshotRepository snapshotRepository)
    {
        _netWorthRepository = netWorthRepository;
        _snapshotRepository = snapshotRepository;

    }

    public async Task<List<NetWorthItemResponse>> GetItemsAsync(string userId)
    {
        var items = await _netWorthRepository.GetByUserAsync(userId);

        return items.Select(item => new NetWorthItemResponse
        {
            Id = item.Id,
            Name = item.Name,
            Amount = item.Amount,
            Type = item.Type
        }).ToList();
    }

    public async Task CreateItemAsync(
        string userId,
        CreateNetWorthItemRequest request)
    {
        var item = new NetWorthItem
        {
            UserId = userId,
            Name = request.Name,
            Amount = request.Amount,
            Type = request.Type
        };

        await _netWorthRepository.CreateAsync(item);
        await CreateSnapshotAsync(userId);
    }

    public async Task DeleteItemAsync(string id, string userId)
    {
        await _netWorthRepository.DeleteAsync(id, userId);
        await CreateSnapshotAsync(userId);
    }

    public async Task UpdateItemAsync(
    string id,
    string userId,
    CreateNetWorthItemRequest request)
    {
        var item =
            await _netWorthRepository.GetByIdAsync(id);

        if (item == null)
        {
            throw new Exception("Item not found.");
        }

        if (item.UserId != userId)
        {
            throw new Exception("Unauthorized.");
        }

        item.Name = request.Name;
        item.Amount = request.Amount;
        item.Type = request.Type;

        await _netWorthRepository.UpdateAsync(item);

        await CreateSnapshotAsync(userId);
    }

    public async Task<NetWorthSummaryResponse> GetSummaryAsync(string userId)
    {
        var items = await _netWorthRepository.GetByUserAsync(userId);

        var totalAssets = items
            .Where(item => item.Type == "Asset")
            .Sum(item => item.Amount);

        var totalLiabilities = items
            .Where(item => item.Type == "Liability")
            .Sum(item => item.Amount);

        return new NetWorthSummaryResponse
        {
            TotalAssets = totalAssets,
            TotalLiabilities = totalLiabilities,
            NetWorth = totalAssets - totalLiabilities
        };
    }

    private async Task CreateSnapshotAsync(string userId)
    {
        var summary = await GetSummaryAsync(userId);

        var snapshot = new NetWorthSnapshot
        {
            UserId = userId,
            TotalAssets = summary.TotalAssets,
            TotalLiabilities = summary.TotalLiabilities,
            NetWorth = summary.NetWorth,
            SnapshotDate = DateTime.UtcNow
        };

        await _snapshotRepository.CreateAsync(snapshot);
    }

    public async Task<List<NetWorthTrendPointResponse>> GetTrendAsync(string userId)
    {
        var snapshots =
            await _snapshotRepository.GetByUserAsync(userId);

        return snapshots
            .Select(snapshot => new NetWorthTrendPointResponse
            {
                SnapshotDate = snapshot.SnapshotDate,
                NetWorth = snapshot.NetWorth
            })
            .ToList();
    }
}