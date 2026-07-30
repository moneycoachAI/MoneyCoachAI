using MoneyCoachAI.Api.Models;
using MoneyCoachAI.Api.Repositories;

namespace MoneyCoachAI.Api.Services;

public class RecurringNotificationService
{
    private readonly RecurringTransactionRepository
        _recurringTransactionRepository;

    private readonly RecurringReminderService
        _recurringReminderService;

    private readonly NotificationService
        _notificationService;

    public RecurringNotificationService(
        RecurringTransactionRepository recurringTransactionRepository,
        RecurringReminderService recurringReminderService,
        NotificationService notificationService)
    {
        _recurringTransactionRepository =
            recurringTransactionRepository;

        _recurringReminderService =
            recurringReminderService;

        _notificationService =
            notificationService;
    }

    public async Task<int> GenerateNotificationsAsync(
        DateTime currentDateTime)
    {
        var today = currentDateTime.Date;

        var activeTransactions =
            await _recurringTransactionRepository
                .GetActiveAsync();

        var createdCount = 0;

        foreach (var transaction in activeTransactions)
        {
            if (!ShouldProcessTransaction(
                    transaction,
                    today))
            {
                continue;
            }

            var nextOccurrenceDate =
                ResolveNextOccurrenceDate(
                    transaction);

            if (!_recurringReminderService
                    .ShouldSendReminder(
                        today,
                        nextOccurrenceDate,
                        occurrenceCompleted: false))
            {
                continue;
            }

            var daysUntilDue =
                _recurringReminderService
                    .GetDaysUntilDue(
                        today,
                        nextOccurrenceDate);

            var title =
                BuildNotificationTitle(
                    transaction,
                    daysUntilDue);

            var message =
                BuildNotificationMessage(
                    transaction,
                    daysUntilDue);

            var notificationType =
                BuildNotificationType(
                    transaction,
                    daysUntilDue);

            var referenceKey =
                BuildReferenceKey(
                    transaction,
                    nextOccurrenceDate,
                    today);

            var wasCreated =
                await _notificationService.CreateSystemNotificationAsync(
                    transaction.UserId,
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

    private static bool ShouldProcessTransaction(
        RecurringTransaction transaction,
        DateTime today)
    {
        if (!transaction.IsActive)
        {
            return false;
        }

        if (string.IsNullOrWhiteSpace(
                transaction.Id))
        {
            return false;
        }

        if (string.IsNullOrWhiteSpace(
                transaction.UserId))
        {
            return false;
        }

        if (today.Date <
            transaction.StartDate.Date)
        {
            return false;
        }

        if (
            transaction.EndDate.HasValue &&
            today.Date >
            transaction.EndDate.Value.Date
        )
        {
            return false;
        }

        return true;
    }

    private static DateTime ResolveNextOccurrenceDate(
        RecurringTransaction transaction)
    {
        if (
            transaction.NextOccurrenceDate >
            DateTime.MinValue.AddDays(10)
        )
        {
            return transaction
                .NextOccurrenceDate
                .Date;
        }

        return transaction
            .StartDate
            .Date;
    }

    private static string BuildNotificationTitle(
        RecurringTransaction transaction,
        int daysUntilDue)
    {
        var transactionType =
            IsIncome(transaction)
                ? "Income"
                : "Expense";

        var timingText =
            daysUntilDue switch
            {
                > 1 => "Upcoming",
                1 => "Due Tomorrow",
                0 => "Due Today",
                _ => "Overdue"
            };

        return $"{transactionType} Reminder - {timingText}";
    }

    private static string BuildNotificationMessage(
        RecurringTransaction transaction,
        int daysUntilDue)
    {
        var subject =
            BuildReminderSubject(transaction);

        var transactionLabel =
            IsIncome(transaction)
                ? "income"
                : "payment";

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

        return $"{subject} {transactionLabel} {timingText}.";
    }

    private static string BuildReminderSubject(
        RecurringTransaction transaction)
    {
        var isOtherCategory =
            string.Equals(
                transaction.Category?.Trim(),
                "Other",
                StringComparison.OrdinalIgnoreCase);

        if (
            isOtherCategory &&
            !string.IsNullOrWhiteSpace(
                transaction.OtherDescription)
        )
        {
            return transaction
                .OtherDescription
                .Trim();
        }

        var description =
            !string.IsNullOrWhiteSpace(
                transaction.Description)
                ? transaction.Description.Trim()
                : transaction.Title.Trim();

        var category =
            transaction.Category?.Trim();

        if (string.IsNullOrWhiteSpace(category))
        {
            return description;
        }

        return $"{description} " +
               $"{category.ToLowerInvariant()}";
    }

    private static string BuildNotificationType(
        RecurringTransaction transaction,
        int daysUntilDue)
    {
        var recurringType =
            IsIncome(transaction)
                ? "RecurringIncome"
                : "RecurringExpense";

        var urgency =
            daysUntilDue switch
            {
                > 0 => "Upcoming",
                0 => "DueToday",
                _ => "Overdue"
            };

        return $"{recurringType}:{urgency}";
    }

    private static string BuildReferenceKey(
        RecurringTransaction transaction,
        DateTime occurrenceDate,
        DateTime notificationDate)
    {
        return string.Join(
            ":",
            "recurring",
            transaction.Id,
            occurrenceDate.ToString("yyyy-MM-dd"),
            notificationDate.ToString("yyyy-MM-dd"));
    }

    private static bool IsIncome(
        RecurringTransaction transaction)
    {
        return string.Equals(
            transaction.Type?.Trim(),
            "Income",
            StringComparison.OrdinalIgnoreCase);
    }
}