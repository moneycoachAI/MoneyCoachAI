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

    private readonly MoneyDueRepository _moneyDueRepository;

    public MoneyDueService(MoneyDueRepository moneyDueRepository)
    {
        _moneyDueRepository = moneyDueRepository;
    }

    public async Task<List<MoneyDue>> GetByUserIdAsync(string userId)
    {
        var items = await _moneyDueRepository.GetByUserIdAsync(userId);

        foreach (var item in items)
        {
            RefreshStatus(item);
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

        RefreshStatus(item);

        return item;
    }

    public async Task<MoneyDue> CreateAsync(
        MoneyDue moneyDue,
        string userId)
    {
        Validate(moneyDue);

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
        existing.TotalAmount = updatedMoneyDue.TotalAmount;
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

        if (moneyDue.TotalAmount <= 0)
        {
            throw new ArgumentException(
                "Total amount must be greater than zero.");
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
    }
}