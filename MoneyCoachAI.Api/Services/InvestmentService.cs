using MoneyCoachAI.Api.DTOs.Investments;
using MoneyCoachAI.Api.Models;
using MoneyCoachAI.Api.Repositories;

namespace MoneyCoachAI.Api.Services;

public class InvestmentService
{
    private readonly InvestmentRepository _repository;

    public InvestmentService(
        InvestmentRepository repository)
    {
        _repository = repository;
    }

    public async Task CreateInvestmentAsync(
        string userId,
        CreateInvestmentRequest request)
    {
        var investment = new Investment
        {
            UserId = userId,
            Name = request.Name,
            Type = request.Type,
            InvestedAmount = request.InvestedAmount,
            CurrentValue = request.CurrentValue,
            InvestmentDate = request.InvestmentDate
        };

        await _repository.CreateAsync(investment);
    }

    public async Task<List<InvestmentResponse>>
        GetInvestmentsAsync(string userId)
    {
        var investments =
            await _repository.GetByUserAsync(userId);

        return investments.Select(i =>
        {
            var profit =
                i.CurrentValue - i.InvestedAmount;

            return new InvestmentResponse
            {
                Id = i.Id,
                Name = i.Name,
                Type = i.Type,
                InvestedAmount = i.InvestedAmount,
                CurrentValue = i.CurrentValue,
                InvestmentDate = i.InvestmentDate,
                ProfitOrLoss = profit,
                ProfitOrLossPercentage =
                    i.InvestedAmount == 0
                        ? 0
                        : Math.Round(
                            (profit / i.InvestedAmount) * 100,
                            2)
            };
        }).ToList();
    }

    public async Task<InvestmentSummaryResponse>
        GetSummaryAsync(string userId)
    {
        var investments =
            await _repository.GetByUserAsync(userId);

        var invested =
            investments.Sum(i => i.InvestedAmount);

        var current =
            investments.Sum(i => i.CurrentValue);

        var profit =
            current - invested;

        return new InvestmentSummaryResponse
        {
            TotalInvested = invested,
            TotalCurrentValue = current,
            TotalProfitOrLoss = profit,
            ProfitOrLossPercentage =
                invested == 0
                    ? 0
                    : Math.Round(
                        (profit / invested) * 100,
                        2)
        };
    }

    public async Task DeleteInvestmentAsync(
        string id,
        string userId)
    {
        await _repository.DeleteAsync(id, userId);
    }

    public async Task<List<InvestmentAllocationResponse>>
    GetAllocationAsync(string userId)
    {
        var investments =
            await _repository.GetByUserAsync(userId);

        return investments
            .GroupBy(i => i.Type)
            .Select(group => new InvestmentAllocationResponse
            {
                Type = group.Key,
                Amount = group.Sum(i => i.CurrentValue)
            })
            .ToList();
    }
}