using MongoDB.Driver;
using MoneyCoachAI.Api.Models;
using MoneyCoachAI.Api.Services;

namespace MoneyCoachAI.Api.Repositories;

public class UserRepository
{
    private readonly IMongoCollection<User> _users;

    public UserRepository(DatabaseService databaseService)
    {
        _users = databaseService.UsersCollection;
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        return await _users
            .Find(user => user.Email == email)
            .FirstOrDefaultAsync();
    }

    public async Task<User?> GetByIdAsync(string id)
    {
        return await _users
            .Find(user => user.Id == id)
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
            user
        );
    }

    public async Task<bool> EmailExistsAsync(string email)
    {
        return await _users
            .Find(user => user.Email == email)
            .AnyAsync();
    }

    public async Task UpdatePasswordAsync(
    string userId,
    string passwordHash
    )
    {
        var update = Builders<User>
            .Update
            .Set(
                user => user.PasswordHash,
                passwordHash
            );

        await _users.UpdateOneAsync(
            user => user.Id == userId,
            update
        );
    }
}