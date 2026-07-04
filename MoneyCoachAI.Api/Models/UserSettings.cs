using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace MoneyCoachAI.Api.Models;

public class UserSettings
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public string UserId { get; set; } = string.Empty;

    public string Currency { get; set; } = "INR";

    public string DateFormat { get; set; } = "DD/MM/YYYY";

    public bool BudgetWarningNotifications { get; set; } = true;

    public bool BudgetExceededNotifications { get; set; } = true;

    public bool GoalCompletedNotifications { get; set; } = true;

    public bool AiInsightsEnabled { get; set; } = true;

    public bool AiDashboardSuggestionsEnabled { get; set; } = true;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}