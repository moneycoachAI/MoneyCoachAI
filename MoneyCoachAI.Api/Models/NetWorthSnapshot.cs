using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace MoneyCoachAI.Api.Models;

public class NetWorthSnapshot
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    public string UserId { get; set; } = string.Empty;

    public decimal TotalAssets { get; set; }

    public decimal TotalLiabilities { get; set; }

    public decimal NetWorth { get; set; }

    public DateTime SnapshotDate { get; set; } =
        DateTime.UtcNow;
}