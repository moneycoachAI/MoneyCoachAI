using MoneyCoachAI.Api.DTOs.RecurringTransactions;
using MoneyCoachAI.Api.Models;
using MoneyCoachAI.Api.Repositories;

namespace MoneyCoachAI.Api.Services;

public class RecurringTransactionService
{
    private readonly RecurringTransactionRepository _repository;
    private readonly RecurringReminderService _reminderService;

    public RecurringTransactionService(
        RecurringTransactionRepository repository,
        RecurringReminderService reminderService)
    {
        _repository = repository;
        _reminderService = reminderService;
    }

    public async Task<List<RecurringTransactionResponse>>
        GetRecurringTransactionsAsync(string userId)
    {
        var transactions =
            await _repository.GetByUserAsync(userId);

        var today = DateTime.UtcNow.Date;

        return transactions
            .Select(transaction =>
                MapToResponse(transaction, today))
            .ToList();
    }

    public async Task<List<RecurringTransactionResponse>>
        GetDashboardRemindersAsync(string userId)
    {
        var transactions =
            await _repository.GetActiveByUserAsync(userId);

        var today = DateTime.UtcNow.Date;

        return transactions
            .Where(transaction =>
            {
                var nextOccurrence =
                    ResolveNextOccurrenceDate(
                        transaction,
                        today);

                return transaction.IsActive &&
                    IsInsideActiveDateRange(transaction, today) &&
                    _reminderService.ShouldSendReminder(
                        today,
                        nextOccurrence,
                        occurrenceCompleted: false);
            })
            .OrderBy(transaction =>
                transaction.NextOccurrenceDate)
            .Select(transaction =>
                MapToResponse(transaction, today))
            .ToList();
    }

    public async Task<RecurringTransactionResponse>
        CreateRecurringTransactionAsync(
            string userId,
            CreateRecurringTransactionRequest request)
    {
        var now = DateTime.UtcNow;
        var today = DateTime.UtcNow.Date;

        var startDate = DateTime.SpecifyKind(
            request.StartDate.Date,
            DateTimeKind.Utc);

        var normalizedFrequency =
            NormalizeFrequency(request.Frequency);

        var firstOccurrence =
            CalculateFirstOccurrence(
                startDate,
                today,
                normalizedFrequency,
                startDate.Day);

        DateTime? endDate =
            request.EndDate.HasValue
                ? DateTime.SpecifyKind(
                    request.EndDate.Value.Date,
                    DateTimeKind.Utc)
                : null;

        var transaction = new RecurringTransaction
        {
            UserId = userId,

            Title = request.Title.Trim(),

            Amount = request.Amount,

            Type = NormalizeType(request.Type),

            Category = request.Category.Trim(),

            OtherDescription =
                NormalizeOptionalText(
                    request.OtherDescription),

            Description =
                NormalizeOptionalText(
                    request.Description),

            Frequency =
                normalizedFrequency,

            StartDate =
                startDate,

            ScheduleDay =
                startDate.Day,

            NextOccurrenceDate =
                firstOccurrence,

            EndDate =
                endDate,

            ReminderDaysBefore =
                _reminderService.ReminderDaysBefore,

            ReminderHour =
                _reminderService.ReminderHour,

            LastCompletedOccurrenceDate =
                null,

            IsActive =
                true,

            CreatedAt =
                now,

            UpdatedAt =
                now
        };

        await _repository.CreateAsync(transaction);

        return MapToResponse(
            transaction,
            today);
    }

    public async Task<bool>
        UpdateRecurringTransactionAsync(
            string id,
            string userId,
            CreateRecurringTransactionRequest request)
    {
        var transaction =
            await _repository.GetByIdAsync(id, userId);

        if (transaction == null)
        {
            return false;
        }

        var today = DateTime.UtcNow.Date;

        var newStartDate = DateTime.SpecifyKind(
            request.StartDate.Date,
            DateTimeKind.Utc);

        var normalizedFrequency =
            NormalizeFrequency(request.Frequency);

        var scheduleChanged =
            transaction.StartDate.Date != newStartDate ||
            !string.Equals(
            transaction.Frequency,
            normalizedFrequency,
            StringComparison.OrdinalIgnoreCase);

        transaction.Title =
            request.Title.Trim();

        transaction.Amount =
            request.Amount;

        transaction.Type =
            NormalizeType(request.Type);

        transaction.Category =
            request.Category.Trim();

        transaction.OtherDescription =
            NormalizeOptionalText(
                request.OtherDescription);

        transaction.Description =
            NormalizeOptionalText(
                request.Description);

        transaction.Frequency =
            normalizedFrequency;

        transaction.StartDate =
            newStartDate;

        transaction.EndDate =
            request.EndDate.HasValue
                ? DateTime.SpecifyKind(
                    request.EndDate.Value.Date,
                    DateTimeKind.Utc)
                : null;

        if (scheduleChanged)
        {
            transaction.ScheduleDay =
                newStartDate.Day;

            transaction.NextOccurrenceDate =
                CalculateFirstOccurrence(
                    newStartDate,
                    today,
                    normalizedFrequency,
                    newStartDate.Day);

            transaction.LastCompletedOccurrenceDate =
                null;
        }

        // The reminder was edited, so require the user to review
        // and record the edited income or expense occurrence again.
        transaction.LastCompletedOccurrenceDate =
            null;

        transaction.UpdatedAt =
            DateTime.UtcNow;

        return await _repository.UpdateAsync(
            transaction);
    }

    public async Task<RecurringTransactionResponse?>
        CompleteOccurrenceAsync(
            string id,
            string userId)
    {
        var transaction =
            await _repository.GetByIdAsync(id, userId);

        if (transaction == null ||
            !transaction.IsActive)
        {
            return null;
        }

        var today = DateTime.UtcNow.Date;

        var nextOccurrence =
            ResolveNextOccurrenceDate(
                transaction,
                today);

        var isInitialTransaction =
            !transaction.LastCompletedOccurrenceDate.HasValue &&
            today < nextOccurrence.Date;

        if (isInitialTransaction)
        {
            // The first income/expense is being recorded now.
            // Keep the already-calculated next recurring due date unchanged.
            transaction.LastCompletedOccurrenceDate =
                today;

            transaction.UpdatedAt =
                DateTime.UtcNow;

            var initialRecordUpdated =
                await _repository.UpdateAsync(transaction);

            if (!initialRecordUpdated)
            {
                return null;
            }

            return MapToResponse(
                transaction,
                today);
        }

        var completedOccurrence =
            ResolveNextOccurrenceDate(
                transaction,
                DateTime.UtcNow.Date);

        var scheduleDay =
            transaction.ScheduleDay > 0
                ? transaction.ScheduleDay
                : completedOccurrence.Day;

        transaction.ScheduleDay =
            scheduleDay;

        transaction.LastCompletedOccurrenceDate =
            completedOccurrence;

        transaction.NextOccurrenceDate =
            _reminderService.CalculateNextOccurrence(
                completedOccurrence,
                transaction.Frequency,
                scheduleDay);

        if (
            transaction.EndDate.HasValue &&
            transaction.NextOccurrenceDate.Date >
            transaction.EndDate.Value.Date
        )
        {
            transaction.IsActive = false;
        }

        transaction.UpdatedAt =
            DateTime.UtcNow;

        var updated =
            await _repository.UpdateAsync(transaction);

        if (!updated)
        {
            return null;
        }

        return MapToResponse(
            transaction,
            DateTime.UtcNow.Date);
    }

    public async Task<bool>
        SetActiveStatusAsync(
            string id,
            string userId,
            bool isActive)
    {
        var transaction =
            await _repository.GetByIdAsync(id, userId);

        if (transaction == null)
        {
            return false;
        }

        transaction.IsActive = isActive;
        transaction.UpdatedAt = DateTime.UtcNow;

        return await _repository.UpdateAsync(
            transaction);
    }

    public async Task<bool>
        DeleteRecurringTransactionAsync(
            string id,
            string userId)
    {
        return await _repository.DeleteAsync(
            id,
            userId);
    }

    private RecurringTransactionResponse MapToResponse(
        RecurringTransaction transaction,
        DateTime today)
    {
        var nextOccurrenceDate =
            ResolveNextOccurrenceDate(
                transaction,
                today);

        var status =
            transaction.IsActive
                ? _reminderService.GetReminderStatus(
                    today,
                    nextOccurrenceDate,
                    occurrenceCompleted: false)
                : "Inactive";

        var daysUntilDue =
            _reminderService.GetDaysUntilDue(
                today,
                nextOccurrenceDate);

        return new RecurringTransactionResponse
        {
            Id = transaction.Id,

            Title = transaction.Title,

            Amount = transaction.Amount,

            Type = transaction.Type,

            Category = transaction.Category,

            OtherDescription =
                transaction.OtherDescription,

            Description =
                transaction.Description,

            Frequency =
                transaction.Frequency,

            StartDate =
                transaction.StartDate,

            ScheduleDay =
                transaction.ScheduleDay > 0
                    ? transaction.ScheduleDay
                    : nextOccurrenceDate.Day,

            NextOccurrenceDate =
                nextOccurrenceDate,

            EndDate =
                transaction.EndDate,

            ReminderDaysBefore =
                transaction.ReminderDaysBefore > 0
                    ? transaction.ReminderDaysBefore
                    : _reminderService.ReminderDaysBefore,

            ReminderHour =
                transaction.ReminderHour > 0
                    ? transaction.ReminderHour
                    : _reminderService.ReminderHour,

            LastCompletedOccurrenceDate =
                transaction.LastCompletedOccurrenceDate,

            ReminderStatus =
                status,

            ReminderMessage =
                BuildReminderMessage(
                    transaction,
                    daysUntilDue),

            DaysUntilDue =
                daysUntilDue,

            IsActive =
                transaction.IsActive,

            CreatedAt =
                transaction.CreatedAt,

            UpdatedAt =
                transaction.UpdatedAt
        };
    }

    private static DateTime ResolveNextOccurrenceDate(
        RecurringTransaction transaction,
        DateTime today)
    {
        if (transaction.NextOccurrenceDate >
            DateTime.MinValue.AddDays(10))
        {
            return transaction.NextOccurrenceDate.Date;
        }

        if (transaction.StartDate >
            DateTime.MinValue.AddDays(10))
        {
            return transaction.StartDate.Date;
        }

        return today.Date;
    }

    private static string BuildReminderMessage(
        RecurringTransaction transaction,
        int daysUntilDue)
    {
        var subject =
            GetReminderSubject(transaction);

        var paymentType =
            string.Equals(
                transaction.Type,
                "Income",
                StringComparison.OrdinalIgnoreCase)
                ? "income"
                : "payment";

        var timingText =
            GetTimingText(daysUntilDue);

        return $"{subject} {paymentType} {timingText}";
    }

    private static string GetReminderSubject(
        RecurringTransaction transaction)
    {
        var isOtherCategory =
            string.Equals(
                transaction.Category,
                "Other",
                StringComparison.OrdinalIgnoreCase);

        if (isOtherCategory)
        {
            if (!string.IsNullOrWhiteSpace(
                    transaction.OtherDescription))
            {
                return transaction
                    .OtherDescription
                    .Trim();
            }

            return transaction.Title.Trim();
        }

        var description =
            !string.IsNullOrWhiteSpace(
                transaction.Description)
                ? transaction.Description.Trim()
                : transaction.Title.Trim();

        var category =
            transaction.Category
                .Trim()
                .ToLowerInvariant();

        return $"{description} {category}";
    }

    private static string GetTimingText(
        int daysUntilDue)
    {
        return daysUntilDue switch
        {
            > 1 =>
                $"due in {daysUntilDue} days",

            1 =>
                "due tomorrow",

            0 =>
                "due today",

            -1 =>
                "overdue by 1 day",

            < -1 =>
                $"overdue by {Math.Abs(daysUntilDue)} days"
        };
    }

    private static bool IsInsideActiveDateRange(
        RecurringTransaction transaction,
        DateTime today)
    {
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

    private static string NormalizeType(
        string type)
    {
        return string.Equals(
            type?.Trim(),
            "Expense",
            StringComparison.OrdinalIgnoreCase)
                ? "Expense"
                : "Income";
    }

    private static string NormalizeFrequency(
        string frequency)
    {
        var normalized =
            (frequency ?? string.Empty)
            .Trim()
            .Replace(" ", string.Empty)
            .Replace("-", string.Empty)
            .ToLowerInvariant();

        return normalized switch
        {
            "daily" => "Daily",
            "weekly" => "Weekly",
            "biweekly" => "Biweekly",
            "monthly" => "Monthly",
            "quarterly" => "Quarterly",
            "halfyearly" => "HalfYearly",
            "yearly" => "Yearly",
            _ => "Monthly"
        };
    }

    private static string? NormalizeOptionalText(
        string? value)
    {
        return string.IsNullOrWhiteSpace(value)
            ? null
            : value.Trim();
    }

    private DateTime CalculateFirstOccurrence(
        DateTime startDate,
        DateTime today,
        string frequency,
        int scheduleDay)
    {
        var occurrence = startDate.Date;

        // A future start date is the first occurrence.
        if (occurrence > today.Date)
        {
            return occurrence;
        }

        // When creating a schedule today or using an older start date,
        // find the next future calendar occurrence.
        while (occurrence <= today.Date)
        {
            occurrence =
                _reminderService.CalculateNextOccurrence(
                    occurrence,
                    frequency,
                    scheduleDay);
        }

        return occurrence;
    }
}