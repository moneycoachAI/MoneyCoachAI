using MongoDB.Driver;
using MoneyCoachAI.Api.Models;
using MoneyCoachAI.Api.Services;

namespace MoneyCoachAI.Api.Repositories;

public class UserSettingsRepository
{
    private readonly IMongoCollection<UserSettings> _userSettings;

    public UserSettingsRepository(DatabaseService databaseService)
    {
        _userSettings = databaseService.UserSettingsCollection;
    }

    public async Task<UserSettings?> GetByUserIdAsync(string userId)
    {
        return await _userSettings
            .Find(settings => settings.UserId == userId)
            .FirstOrDefaultAsync();
    }

    public async Task CreateAsync(UserSettings settings)
    {
        await _userSettings.InsertOneAsync(settings);
    }

    public async Task UpdateAsync(UserSettings settings)
    {
        await _userSettings.ReplaceOneAsync(
            existing => existing.UserId == settings.UserId,
            settings
        );
    }
}