using MongoDB.Driver;
using MoneyCoachAI.Api.Models;
using MoneyCoachAI.Api.Services;

namespace MoneyCoachAI.Api.Repositories;

public class UserRepository
{
    private readonly IMongoCollection<User> _users;

    public UserRepository(
        DatabaseService databaseService)
    {
        _users =
            databaseService.UsersCollection;
    }

    public async Task<User?> GetByEmailAsync(
        string email)
    {
        return await _users
            .Find(user => user.Email == email)
            .FirstOrDefaultAsync();
    }

    public async Task<User?> GetByIdAsync(
        string id)
    {
        return await _users
            .Find(user => user.Id == id)
            .FirstOrDefaultAsync();
    }

    public async Task<User?>
        GetByRefreshTokenHashAsync(
            string refreshTokenHash)
    {
        if (string.IsNullOrWhiteSpace(
                refreshTokenHash))
        {
            return null;
        }

        return await _users
            .Find(
                user =>
                    user.RefreshTokenHash ==
                    refreshTokenHash)
            .FirstOrDefaultAsync();
    }

    public async Task CreateAsync(User user)
    {
        await _users.InsertOneAsync(user);
    }

    public async Task UpdateAsync(User user)
    {
        await _users.ReplaceOneAsync(
            existing => existing.Id == user.Id,
            user);
    }

    public async Task<bool> EmailExistsAsync(
        string email)
    {
        return await _users
            .Find(user => user.Email == email)
            .AnyAsync();
    }

    public async Task UpdatePasswordAsync(
        string userId,
        string passwordHash)
    {
        var update = Builders<User>
            .Update
            .Set(
                user => user.PasswordHash,
                passwordHash);

        await _users.UpdateOneAsync(
            user => user.Id == userId,
            update);
    }

    // =====================================================
    // SAVE OR ROTATE REFRESH TOKEN
    // =====================================================

    public async Task SaveRefreshTokenAsync(
        string userId,
        string refreshTokenHash,
        DateTime createdAt,
        DateTime expiresAt)
    {
        var update = Builders<User>
            .Update
            .Set(
                user => user.RefreshTokenHash,
                refreshTokenHash)
            .Set(
                user => user.RefreshTokenCreatedAt,
                createdAt)
            .Set(
                user => user.RefreshTokenExpiresAt,
                expiresAt)
            .Set(
                user => user.RefreshTokenRevokedAt,
                null);

        await _users.UpdateOneAsync(
            user => user.Id == userId,
            update);
    }

    // =====================================================
    // REVOKE REFRESH TOKEN
    // =====================================================

    public async Task RevokeRefreshTokenAsync(
        string userId,
        DateTime revokedAt)
    {
        var update = Builders<User>
            .Update
            .Set(
                user => user.RefreshTokenRevokedAt,
                revokedAt);

        await _users.UpdateOneAsync(
            user => user.Id == userId,
            update);
    }
}