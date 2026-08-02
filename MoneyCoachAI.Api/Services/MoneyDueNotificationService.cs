using MoneyCoachAI.Api.Models;
using MoneyCoachAI.Api.Repositories;

namespace MoneyCoachAI.Api.Services;

public class MoneyDueNotificationService
{
    private readonly MoneyDueRepository _moneyDueRepository;
    private readonly NotificationService _notificationService;

    public MoneyDueNotificationService(
        MoneyDueRepository moneyDueRepository,
        NotificationService notificationService)
    {
        _moneyDueRepository = moneyDueRepository;
        _notificationService = notificationService;
    }

    public async Task<int> GenerateNotificationsAsync(
        DateTime currentDateTime)
    {
        var today = currentDateTime.Date;

        var pendingItems =
            await _moneyDueRepository.GetPendingAsync();

        var createdCount = 0;

        foreach (var item in pendingItems)
        {
            if (!ShouldProcess(item))
            {
                continue;
            }

            var daysUntilDue =
                (item.DueDate.Date - today).Days;

            if (!ShouldSendReminder(
                    item,
                    daysUntilDue))
            {
                continue;
            }

            var remainingAmount =
                Math.Max(
                    0,
                    item.TotalAmount -
                    item.SettledAmount);

            if (remainingAmount <= 0)
            {
                continue;
            }

            var title =
                BuildNotificationTitle(
                    item,
                    daysUntilDue);

            var message =
                BuildNotificationMessage(
                    item,
                    remainingAmount,
                    daysUntilDue);

            var notificationType =
                BuildNotificationType(
                    item,
                    daysUntilDue);

            var referenceKey =
                BuildReferenceKey(
                    item,
                    today);

            var wasCreated =
                await _notificationService
                    .CreateSystemNotificationAsync(
                        item.UserId,
                        title,
                        message,
                        notificationType,
                        referenceKey
                    );

            if (wasCreated)
            {
                createdCount++;
            }
        }

        return createdCount;
    }

    private static bool ShouldProcess(
        MoneyDue item)
    {
        if (string.IsNullOrWhiteSpace(item.Id))
        {
            return false;
        }

        if (string.IsNullOrWhiteSpace(item.UserId))
        {
            return false;
        }

        if (
            item.Status == "Completed" ||
            item.Status == "Cancelled")
        {
            return false;
        }

        if (
            !string.Equals(
                item.DueType,
                "Receivable",
                StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(
                item.DueType,
                "Payable",
                StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        return true;
    }

    private static bool ShouldSendReminder(
        MoneyDue item,
        int daysUntilDue)
    {
        if (daysUntilDue < 0)
        {
            return true;
        }

        if (daysUntilDue == 0)
        {
            return true;
        }

        return daysUntilDue <=
               item.ReminderDaysBefore;
    }

    private static string BuildNotificationTitle(
        MoneyDue item,
        int daysUntilDue)
    {
        var dueType =
            IsReceivable(item)
                ? "Receivable"
                : "Payable";

        var timingText =
            daysUntilDue switch
            {
                > 1 => "Upcoming",
                1 => "Due Tomorrow",
                0 => "Due Today",
                _ => "Overdue"
            };

        return $"{dueType} Reminder - {timingText}";
    }

    private static string BuildNotificationMessage(
        MoneyDue item,
        decimal remainingAmount,
        int daysUntilDue)
    {
        var amount =
            $"₹{remainingAmount:N0}";

        var partyName =
            string.IsNullOrWhiteSpace(item.PartyName)
                ? "the listed party"
                : item.PartyName.Trim();

        var timingText =
            daysUntilDue switch
            {
                > 1 =>
                    $"is due in {daysUntilDue} days",

                1 =>
                    "is due tomorrow",

                0 =>
                    "is due today",

                -1 =>
                    "is overdue by 1 day",

                _ =>
                    $"is overdue by " +
                    $"{Math.Abs(daysUntilDue)} days"
            };

        if (IsReceivable(item))
        {
            return $"{amount} from {partyName} {timingText}.";
        }

        return $"Your {amount} payment to " +
               $"{partyName} {timingText}.";
    }

    private static string BuildNotificationType(
        MoneyDue item,
        int daysUntilDue)
    {
        var dueType =
            IsReceivable(item)
                ? "MoneyDueReceivable"
                : "MoneyDuePayable";

        var urgency =
            daysUntilDue switch
            {
                > 0 => "Upcoming",
                0 => "DueToday",
                _ => "Overdue"
            };

        return $"{dueType}:{urgency}";
    }

    private static string BuildReferenceKey(
        MoneyDue item,
        DateTime notificationDate)
    {
        return string.Join(
            ":",
            "money-due",
            item.Id,
            item.DueDate.ToString("yyyy-MM-dd"),
            notificationDate.ToString("yyyy-MM-dd"));
    }

    private static bool IsReceivable(
        MoneyDue item)
    {
        return string.Equals(
            item.DueType?.Trim(),
            "Receivable",
            StringComparison.OrdinalIgnoreCase);
    }
}