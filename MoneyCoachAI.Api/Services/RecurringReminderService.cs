namespace MoneyCoachAI.Api.Services;

public class RecurringReminderService
{
    private const int DefaultReminderDaysBefore = 2;
    private const int DefaultReminderHour = 11;

    public int ReminderDaysBefore => DefaultReminderDaysBefore;

    public int ReminderHour => DefaultReminderHour;

    public DateTime CalculateNextOccurrence(
        DateTime currentOccurrence,
        string frequency,
        int scheduleDay)
    {
        var occurrence = currentOccurrence.Date;

        return NormalizeFrequency(frequency) switch
        {
            "daily" => occurrence.AddDays(1),

            "weekly" => occurrence.AddDays(7),

            "biweekly" => occurrence.AddDays(14),

            "monthly" => AddMonthsUsingScheduleDay(
                occurrence,
                1,
                scheduleDay),

            "quarterly" => AddMonthsUsingScheduleDay(
                occurrence,
                3,
                scheduleDay),

            "halfyearly" => AddMonthsUsingScheduleDay(
                occurrence,
                6,
                scheduleDay),

            "yearly" => AddYearsUsingScheduleDay(
                occurrence,
                1,
                scheduleDay),

            _ => AddMonthsUsingScheduleDay(
                occurrence,
                1,
                scheduleDay)
        };
    }

    public DateTime CalculateReminderStartDate(
        DateTime occurrenceDate)
    {
        var safeOccurrenceDate = occurrenceDate.Date;

        // Protect older MongoDB records where the newly added
        // NextOccurrenceDate field has DateTime.MinValue.
        if (safeOccurrenceDate <=
            DateTime.MinValue.AddDays(ReminderDaysBefore))
        {
            return DateTime.MinValue;
        }

        return safeOccurrenceDate.AddDays(
            -ReminderDaysBefore);
    }

    public bool ShouldSendReminder(
        DateTime today,
        DateTime occurrenceDate,
        bool occurrenceCompleted)
    {
        if (occurrenceCompleted)
        {
            return false;
        }

        var reminderStartDate =
            CalculateReminderStartDate(occurrenceDate);

        return today.Date >= reminderStartDate;
    }

    public string GetReminderStatus(
        DateTime today,
        DateTime occurrenceDate,
        bool occurrenceCompleted)
    {
        if (occurrenceCompleted)
        {
            return "Completed";
        }

        var currentDate = today.Date;
        var dueDate = occurrenceDate.Date;
        var reminderStartDate =
            CalculateReminderStartDate(dueDate);

        if (currentDate < reminderStartDate)
        {
            return "Scheduled";
        }

        if (currentDate < dueDate)
        {
            return "Upcoming";
        }

        if (currentDate == dueDate)
        {
            return "Due Today";
        }

        return "Overdue";
    }

    public int GetDaysUntilDue(
        DateTime today,
        DateTime occurrenceDate)
    {
        return (
            occurrenceDate.Date -
            today.Date
        ).Days;
    }

    public string GetDisplayCategory(
        string category,
        string? otherDescription)
    {
        var isOther =
            string.Equals(
                category?.Trim(),
                "Other",
                StringComparison.OrdinalIgnoreCase);

        if (
            isOther &&
            !string.IsNullOrWhiteSpace(otherDescription)
        )
        {
            return otherDescription.Trim();
        }

        return category?.Trim() ?? string.Empty;
    }

    private static DateTime AddMonthsUsingScheduleDay(
        DateTime currentOccurrence,
        int months,
        int scheduleDay)
    {
        var targetMonth =
            currentOccurrence.AddMonths(months);

        var safeScheduleDay =
            Math.Clamp(scheduleDay, 1, 31);

        var lastDayOfTargetMonth =
            DateTime.DaysInMonth(
                targetMonth.Year,
                targetMonth.Month);

        var targetDay =
            Math.Min(
                safeScheduleDay,
                lastDayOfTargetMonth);

        return new DateTime(
            targetMonth.Year,
            targetMonth.Month,
            targetDay);
    }

    private static DateTime AddYearsUsingScheduleDay(
        DateTime currentOccurrence,
        int years,
        int scheduleDay)
    {
        var targetYear =
            currentOccurrence.Year + years;

        var safeScheduleDay =
            Math.Clamp(scheduleDay, 1, 31);

        var lastDayOfTargetMonth =
            DateTime.DaysInMonth(
                targetYear,
                currentOccurrence.Month);

        var targetDay =
            Math.Min(
                safeScheduleDay,
                lastDayOfTargetMonth);

        return new DateTime(
            targetYear,
            currentOccurrence.Month,
            targetDay);
    }

    private static string NormalizeFrequency(
        string frequency)
    {
        return (
            frequency ?? string.Empty
        )
        .Trim()
        .Replace(" ", string.Empty)
        .Replace("-", string.Empty)
        .ToLowerInvariant();
    }
}