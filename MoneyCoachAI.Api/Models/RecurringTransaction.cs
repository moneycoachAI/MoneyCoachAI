using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace MoneyCoachAI.Api.Models;

public class RecurringTransaction
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    public string UserId { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public string Type { get; set; } = string.Empty;
    // Income or Expense

    public string Category { get; set; } = string.Empty;

    public string? OtherDescription { get; set; }

    public string? Description { get; set; }

    public string Frequency { get; set; } = "Monthly";
    // Daily / Weekly / Biweekly / Monthly /
    // Quarterly / HalfYearly / Yearly

    public DateTime StartDate { get; set; }

    public int ScheduleDay { get; set; }

    public DateTime NextOccurrenceDate { get; set; }

    public DateTime? EndDate { get; set; }

    public int ReminderDaysBefore { get; set; } = 2;

    public int ReminderHour { get; set; } = 11;

    public DateTime? LastCompletedOccurrenceDate { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}