using MoneyCoachAI.Api.DTOs;
using MoneyCoachAI.Api.Models;
using MoneyCoachAI.Api.Repositories;

namespace MoneyCoachAI.Api.Services;

public class IncomeService
{
    private readonly IncomeRepository _incomeRepository;

    public IncomeService(IncomeRepository incomeRepository)
    {
        _incomeRepository = incomeRepository;
    }

    public async Task<string> CreateIncomeAsync(
        string userId,
        CreateIncomeRequest request)
    {
        var income = new Income
        {
            UserId = userId,
            Amount = request.Amount,
            Source = request.Source,
            Description = request.Description,
            Date = request.Date
        };

        await _incomeRepository.CreateAsync(income);

        return income.Id;
    }

    public async Task<List<Income>> GetIncomesAsync(string userId)
    {
        return await _incomeRepository.GetByUserIdAsync(userId);
    }

    public async Task<Income?> GetIncomeByIdAsync(
        string id,
        string userId)
    {
        return await _incomeRepository.GetByIdAndUserIdAsync(id, userId);
    }

    public async Task<bool> UpdateIncomeAsync(
        string id,
        string userId,
        UpdateIncomeRequest request)
    {
        var existingIncome =
            await _incomeRepository.GetByIdAndUserIdAsync(id, userId);

        if (existingIncome == null)
        {
            return false;
        }

        existingIncome.Amount = request.Amount;
        existingIncome.Source = request.Source;
        existingIncome.Description = request.Description;
        existingIncome.Date = request.Date;

        await _incomeRepository.UpdateAsync(id, userId, existingIncome);

        return true;
    }

    public async Task<bool> DeleteIncomeAsync(
        string id,
        string userId)
    {
        var existingIncome =
            await _incomeRepository.GetByIdAndUserIdAsync(id, userId);

        if (existingIncome == null)
        {
            return false;
        }

        await _incomeRepository.DeleteAsync(id, userId);

        return true;
    }
}