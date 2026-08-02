using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace MoneyCoachAI.Api.Models;

public class MoneyDue
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonRepresentation(BsonType.ObjectId)]
    public string UserId { get; set; } = string.Empty;

    public string DueType { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string PartyName { get; set; } = string.Empty;

    public string Category { get; set; } = string.Empty;

    public string? OtherDescription { get; set; }

    public decimal TotalAmount { get; set; }

    public decimal SettledAmount { get; set; }

    public List<MoneyDueSettlement> Settlements { get; set; } = [];

    public DateTime DueDate { get; set; }

    public int ReminderDaysBefore { get; set; } = 1;

    public string? Description { get; set; }

    public string Status { get; set; } = "Pending";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? CompletedAt { get; set; }

    [BsonIgnore]
    public decimal RemainingAmount =>
        Math.Max(0, TotalAmount - SettledAmount);

    [BsonIgnore]
    public bool IsOverdue =>
        Status != "Completed" &&
        Status != "Cancelled" &&
        DueDate.Date < DateTime.UtcNow.Date;
}