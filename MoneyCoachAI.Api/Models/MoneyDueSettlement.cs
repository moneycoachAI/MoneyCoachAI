using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace MoneyCoachAI.Api.Models;

public class MoneyDueSettlement
{
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public DateTime SettlementDate { get; set; }

    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; } =
        DateTime.UtcNow;
}