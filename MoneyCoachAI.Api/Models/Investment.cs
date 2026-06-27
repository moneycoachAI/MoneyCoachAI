using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace MoneyCoachAI.Api.Models;

public class Investment
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    public string UserId { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string Type { get; set; } = string.Empty;
    // Stock, Mutual Fund, Gold, FD, Crypto, Other

    public decimal InvestedAmount { get; set; }

    public decimal CurrentValue { get; set; }

    public DateTime InvestmentDate { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}