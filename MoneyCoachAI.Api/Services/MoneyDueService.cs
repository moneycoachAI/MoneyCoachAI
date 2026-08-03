using MoneyCoachAI.Api.Models;
using MoneyCoachAI.Api.Repositories;

namespace MoneyCoachAI.Api.Services;

public class MoneyDueService
{
    private static readonly string[] AllowedDueTypes =
    {
        "Receivable",
        "Payable"
    };

    private static readonly string[] AllowedStatuses =
    {
        "Pending",
        "PartiallyPaid",
        "Completed",
        "Cancelled"
    };

    private static readonly string[] AllowedInterestPeriods =
    {
        "Day",
        "Week",
        "Month"
    };

    private readonly MoneyDueRepository _moneyDueRepository;

    public MoneyDueService(MoneyDueRepository moneyDueRepository)
    {
        _moneyDueRepository = moneyDueRepository;
    }

    private static bool EnsureSettlementIds(
    MoneyDue moneyDue)
    {
        moneyDue.Settlements ??= [];

        var changed = false;

        foreach (var settlement in moneyDue.Settlements)
        {
            if (!string.IsNullOrWhiteSpace(settlement.Id))
            {
                continue;
            }

            settlement.Id =
                MongoDB.Bson.ObjectId
                    .GenerateNewId()
                    .ToString();

            changed = true;
        }

        return changed;
    }

    public async Task<List<MoneyDue>> GetByUserIdAsync(string userId)
    {
        var items = await _moneyDueRepository.GetByUserIdAsync(userId);

        foreach (var item in items)
        {
            var settlementIdsAdded =
                EnsureSettlementIds(item);

            RefreshStatus(item);

            if (settlementIdsAdded)
            {
                await _moneyDueRepository
                    .UpdateAsync(item);
            }
        }

        return items;
    }

    public async Task<MoneyDue?> GetByIdAsync(
        string id,
        string userId)
    {
        var item = await _moneyDueRepository.GetByIdAsync(id);

        if (item is null || item.UserId != userId)
        {
            return null;
        }

        var settlementIdsAdded =
            EnsureSettlementIds(item);

        RefreshStatus(item);

        if (settlementIdsAdded)
        {
            await _moneyDueRepository
                .UpdateAsync(item);
        }

        return item;
    }

    public async Task<MoneyDue> CreateAsync(
        MoneyDue moneyDue,
        string userId)
    {
        Validate(moneyDue);

        ApplyInterestCalculation(moneyDue);

        moneyDue.UserId = userId;
        moneyDue.Id = string.Empty;
        moneyDue.SettledAmount = 0;
        moneyDue.Status = "Pending";
        moneyDue.CreatedAt = DateTime.UtcNow;
        moneyDue.CompletedAt = null;

        await _moneyDueRepository.CreateAsync(moneyDue);

        return moneyDue;
    }

    public async Task<bool> UpdateAsync(
        string id,
        string userId,
        MoneyDue updatedMoneyDue)
    {
        var existing = await _moneyDueRepository.GetByIdAsync(id);

        if (existing is null || existing.UserId != userId)
        {
            return false;
        }

        Validate(updatedMoneyDue);

        existing.DueType = updatedMoneyDue.DueType;
        existing.Title = updatedMoneyDue.Title.Trim();
        existing.PartyName = updatedMoneyDue.PartyName.Trim();
        existing.Category = updatedMoneyDue.Category.Trim();
        existing.OtherDescription =
            updatedMoneyDue.Category == "Other"
                ? updatedMoneyDue.OtherDescription?.Trim()
                : null;

        existing.HasInterest =
            updatedMoneyDue.HasInterest;

        existing.PrincipalAmount =
            updatedMoneyDue.PrincipalAmount;

        existing.InterestRate =
            updatedMoneyDue.InterestRate;

        existing.InterestPeriod =
            updatedMoneyDue.InterestPeriod?.Trim();

        existing.InterestPeriods =
            updatedMoneyDue.InterestPeriods;

        existing.InterestMethod = "Simple";
        existing.TotalAmount = updatedMoneyDue.TotalAmount;
        ApplyInterestCalculation(existing);
        existing.DueDate = updatedMoneyDue.DueDate;
        existing.ReminderDaysBefore =
            updatedMoneyDue.ReminderDaysBefore;
        existing.Description =
            updatedMoneyDue.Description?.Trim();

        if (existing.SettledAmount > existing.TotalAmount)
        {
            existing.SettledAmount = existing.TotalAmount;
        }

        RefreshStatus(existing);

        await _moneyDueRepository.UpdateAsync(existing);

        return true;
    }

    public async Task<bool> RecordSettlementAsync(
    string id,
    string userId,
    decimal amount,
    DateTime settlementDate,
    string? description)
    {
        if (amount <= 0)
        {
            throw new ArgumentException(
                "Settlement amount must be greater than zero.");
        }

        if (settlementDate == default)
        {
            throw new ArgumentException(
                "Settlement date is required.");
        }

        var existing = await _moneyDueRepository.GetByIdAsync(id);

        if (existing is null || existing.UserId != userId)
        {
            return false;
        }

        if (
            existing.Status == "Completed" ||
            existing.Status == "Cancelled")
        {
            throw new InvalidOperationException(
                "Completed or cancelled records cannot be settled.");
        }

        var remainingAmount =
            existing.TotalAmount - existing.SettledAmount;

        if (amount > remainingAmount)
        {
            throw new ArgumentException(
                "Settlement amount cannot exceed the remaining amount.");
        }

        existing.Settlements ??= [];

        existing.Settlements.Add(
            new MoneyDueSettlement
            {
                 Id = MongoDB.Bson.ObjectId
                    .GenerateNewId()
                    .ToString(), 

                Amount = amount,
                SettlementDate = settlementDate,
                Description = description?.Trim(),
                CreatedAt = DateTime.UtcNow
            });

        existing.SettledAmount += amount;

        RefreshStatus(existing);

        await _moneyDueRepository.UpdateAsync(existing);

        return true;
    }

    public async Task<MoneyDue> UpdateSettlementAsync(
    string userId,
    string moneyDueId,
    string settlementId,
    decimal amount,
    DateTime settlementDate,
    string? description)
    {
        if (amount <= 0)
        {
            throw new ArgumentException(
                "Settlement amount must be greater than zero.");
        }

        if (settlementDate == default)
        {
            throw new ArgumentException(
                "Settlement date is required.");
        }

        var item =
            await _moneyDueRepository.GetByIdAsync(
                moneyDueId);

        if (item is null || item.UserId != userId)
        {
            throw new KeyNotFoundException(
                "Money Due record not found.");
        }

        EnsureSettlementIds(item);

        var settlement =
            item.Settlements.FirstOrDefault(
                x => x.Id == settlementId);

        if (settlement is null)
        {
            throw new KeyNotFoundException(
                "Settlement not found.");
        }

        var otherSettlementsTotal =
            item.Settlements
                .Where(x => x.Id != settlementId)
                .Sum(x => x.Amount);

        if (otherSettlementsTotal + amount > item.TotalAmount)
        {
            throw new ArgumentException(
                "Total settled amount cannot exceed the Money Due total amount.");
        }

        settlement.Amount = amount;
        settlement.SettlementDate = settlementDate;
        settlement.Description =
            description?.Trim();

        item.SettledAmount =
            item.Settlements.Sum(x => x.Amount);

        RefreshStatus(item);

        await _moneyDueRepository.UpdateAsync(item);

        return item;
    }

    public async Task DeleteSettlementAsync(
    string userId,
    string moneyDueId,
    string settlementId)
    {
        var item =
            await _moneyDueRepository.GetByIdAsync(
                moneyDueId);

        if (item is null || item.UserId != userId)
        {
            throw new KeyNotFoundException(
                "Money Due record not found.");
        }

        EnsureSettlementIds(item);

        var settlement =
            item.Settlements.FirstOrDefault(
                x => x.Id == settlementId);

        if (settlement is null)
        {
            throw new KeyNotFoundException(
                "Settlement not found.");
        }

        item.Settlements.Remove(settlement);

        item.SettledAmount =
            item.Settlements.Sum(x => x.Amount);

        RefreshStatus(item);

        await _moneyDueRepository.UpdateAsync(item);
    }

    public async Task<bool> CancelAsync(
        string id,
        string userId)
    {
        var existing = await _moneyDueRepository.GetByIdAsync(id);

        if (existing is null || existing.UserId != userId)
        {
            return false;
        }

        if (existing.Status == "Completed")
        {
            throw new InvalidOperationException(
                "A completed record cannot be cancelled.");
        }

        existing.Status = "Cancelled";
        existing.CompletedAt = null;

        await _moneyDueRepository.UpdateAsync(existing);

        return true;
    }

    public async Task<bool> DeleteAsync(
        string id,
        string userId)
    {
        var existing = await _moneyDueRepository.GetByIdAsync(id);

        if (existing is null || existing.UserId != userId)
        {
            return false;
        }

        await _moneyDueRepository.DeleteAsync(id);

        return true;
    }

    private static void RefreshStatus(MoneyDue moneyDue)
    {
        if (moneyDue.Status == "Cancelled")
        {
            return;
        }

        if (moneyDue.SettledAmount >= moneyDue.TotalAmount)
        {
            moneyDue.SettledAmount = moneyDue.TotalAmount;
            moneyDue.Status = "Completed";
            moneyDue.CompletedAt ??= DateTime.UtcNow;
            return;
        }

        moneyDue.CompletedAt = null;

        moneyDue.Status =
            moneyDue.SettledAmount > 0
                ? "PartiallyPaid"
                : "Pending";
    }

    private static void Validate(MoneyDue moneyDue)
    {
        if (
            !AllowedDueTypes.Contains(
                moneyDue.DueType,
                StringComparer.OrdinalIgnoreCase))
        {
            throw new ArgumentException(
                "Due type must be Receivable or Payable.");
        }

        if (string.IsNullOrWhiteSpace(moneyDue.Title))
        {
            throw new ArgumentException("Title is required.");
        }

        if (string.IsNullOrWhiteSpace(moneyDue.PartyName))
        {
            throw new ArgumentException(
                "Person or organization name is required.");
        }

        if (string.IsNullOrWhiteSpace(moneyDue.Category))
        {
            throw new ArgumentException("Category is required.");
        }

        if (
            moneyDue.Category == "Other" &&
            string.IsNullOrWhiteSpace(
                moneyDue.OtherDescription))
        {
            throw new ArgumentException(
                "Other category description is required.");
        }

        if (moneyDue.SettledAmount < 0)
        {
            throw new ArgumentException(
                "Settled amount cannot be negative.");
        }

        if (moneyDue.ReminderDaysBefore < 0)
        {
            throw new ArgumentException(
                "Reminder days cannot be negative.");
        }

        if (
            !string.IsNullOrWhiteSpace(moneyDue.Status) &&
            !AllowedStatuses.Contains(
                moneyDue.Status,
                StringComparer.OrdinalIgnoreCase))
        {
            throw new ArgumentException("Invalid status.");
        }

        if (moneyDue.HasInterest)
        {
            if (moneyDue.PrincipalAmount <= 0)
            {
                throw new ArgumentException(
                    "Principal amount must be greater than zero.");
            }

            if (
                moneyDue.InterestRate <= 0 ||
                moneyDue.InterestRate > 100)
            {
                throw new ArgumentException(
                    "Interest rate must be greater than zero and not exceed 100 percent.");
            }

            if (
                string.IsNullOrWhiteSpace(
                    moneyDue.InterestPeriod) ||
                !AllowedInterestPeriods.Contains(
                    moneyDue.InterestPeriod,
                    StringComparer.OrdinalIgnoreCase))
            {
                throw new ArgumentException(
                    "Interest period must be Day, Week, or Month.");
            }

            if (moneyDue.InterestPeriods <= 0)
            {
                throw new ArgumentException(
                    "Number of interest periods must be at least one.");
            }

            if (moneyDue.PrincipalAmount < moneyDue.SettledAmount)
            {
                throw new ArgumentException(
                    "Principal amount cannot be less than the amount already settled.");
            }
        }
        else
        {
            if (moneyDue.TotalAmount <= 0)
            {
                throw new ArgumentException(
                    "Total amount must be greater than zero.");
            }
        }
    }

    private static void ApplyInterestCalculation(
    MoneyDue moneyDue)
    {
        if (!moneyDue.HasInterest)
        {
            moneyDue.PrincipalAmount =
                moneyDue.TotalAmount;

            moneyDue.InterestRate = 0;
            moneyDue.InterestPeriod = null;
            moneyDue.InterestPeriods = 0;
            moneyDue.InterestMethod = "Simple";
            moneyDue.InterestAmount = 0;

            return;
        }

        moneyDue.InterestMethod = "Simple";

        moneyDue.InterestAmount =
            Math.Round(
                moneyDue.PrincipalAmount *
                (moneyDue.InterestRate / 100m) *
                moneyDue.InterestPeriods,
                2,
                MidpointRounding.AwayFromZero);

        moneyDue.TotalAmount =
            moneyDue.PrincipalAmount +
            moneyDue.InterestAmount;
    }
}