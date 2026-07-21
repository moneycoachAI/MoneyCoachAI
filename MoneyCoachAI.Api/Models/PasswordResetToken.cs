using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace MoneyCoachAI.Api.Models;

public class PasswordResetToken
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonRepresentation(BsonType.ObjectId)]
    public string UserId { get; set; } = string.Empty;

    public string TokenHash { get; set; } = string.Empty;

    public DateTime ExpiresAt { get; set; }

    public DateTime CreatedAt { get; set; } =
        DateTime.UtcNow;

    public DateTime? UsedAt { get; set; }

    public bool IsUsed { get; set; }
}