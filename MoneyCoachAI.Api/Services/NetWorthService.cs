using MoneyCoachAI.Api.DTOs.NetWorth;
using MoneyCoachAI.Api.Models;
using MoneyCoachAI.Api.Repositories;

namespace MoneyCoachAI.Api.Services;

public class NetWorthService
{
    private readonly NetWorthRepository _netWorthRepository;

    public NetWorthService(NetWorthRepository netWorthRepository)
    {
        _netWorthRepository = netWorthRepository;
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
    }

    public async Task DeleteItemAsync(string id, string userId)
    {
        await _netWorthRepository.DeleteAsync(id, userId);
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
}