using MoneyCoachAI.Api.Models;
using MoneyCoachAI.Api.Services;
using MongoDB.Driver;

namespace MoneyCoachAI.Api.Repositories;

public class PasswordResetTokenRepository
{
    private readonly IMongoCollection<PasswordResetToken>
        _tokens;

    public PasswordResetTokenRepository(
        DatabaseService databaseService
    )
    {
        _tokens = databaseService.PasswordResetTokens;
    }

    public async Task CreateAsync(
        PasswordResetToken resetToken
    )
    {
        await _tokens.InsertOneAsync(resetToken);
    }

    public async Task<PasswordResetToken?>
        GetActiveByHashAsync(
            string tokenHash
        )
    {
        var now = DateTime.UtcNow;

        return await _tokens
            .Find(token =>
                token.TokenHash == tokenHash &&
                !token.IsUsed &&
                token.ExpiresAt > now
            )
            .FirstOrDefaultAsync();
    }

    public async Task MarkAsUsedAsync(
        string id
    )
    {
        var update = Builders<PasswordResetToken>
            .Update
            .Set(token => token.IsUsed, true)
            .Set(
                token => token.UsedAt,
                DateTime.UtcNow
            );

        await _tokens.UpdateOneAsync(
            token => token.Id == id,
            update
        );
    }

    public async Task InvalidateUserTokensAsync(
        string userId
    )
    {
        var update = Builders<PasswordResetToken>
            .Update
            .Set(token => token.IsUsed, true)
            .Set(
                token => token.UsedAt,
                DateTime.UtcNow
            );

        await _tokens.UpdateManyAsync(
            token =>
                token.UserId == userId &&
                !token.IsUsed,
            update
        );
    }
}