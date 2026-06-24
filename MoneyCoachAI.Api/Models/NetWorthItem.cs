using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace MoneyCoachAI.Api.Models;

public class NetWorthItem
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    public string UserId { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public string Type { get; set; } = string.Empty;
    // Asset or Liability

    public DateTime CreatedAt { get; set; } =
        DateTime.UtcNow;
}