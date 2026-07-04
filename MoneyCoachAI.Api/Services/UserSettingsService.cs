using MoneyCoachAI.Api.DTOs;
using MoneyCoachAI.Api.Models;
using MoneyCoachAI.Api.Repositories;

namespace MoneyCoachAI.Api.Services;

public class UserSettingsService
{
    private readonly UserSettingsRepository _userSettingsRepository;

    public UserSettingsService(UserSettingsRepository userSettingsRepository)
    {
        _userSettingsRepository = userSettingsRepository;
    }

    public async Task<UserSettings> GetOrCreateSettingsAsync(string userId)
    {
        var settings = await _userSettingsRepository.GetByUserIdAsync(userId);

        if (settings is not null)
        {
            return settings;
        }

        var defaultSettings = new UserSettings
        {
            UserId = userId,
            Currency = "INR",
            DateFormat = "DD/MM/YYYY",
            BudgetWarningNotifications = true,
            BudgetExceededNotifications = true,
            GoalCompletedNotifications = true,
            AiInsightsEnabled = true,
            AiDashboardSuggestionsEnabled = true,
            UpdatedAt = DateTime.UtcNow
        };

        await _userSettingsRepository.CreateAsync(defaultSettings);

        return defaultSettings;
    }

    public async Task<UserSettings> UpdateSettingsAsync(
        string userId,
        UpdateUserSettingsDto dto)
    {
        var settings = await GetOrCreateSettingsAsync(userId);

        settings.Currency = dto.Currency;
        settings.DateFormat = dto.DateFormat;
        settings.BudgetWarningNotifications = dto.BudgetWarningNotifications;
        settings.BudgetExceededNotifications = dto.BudgetExceededNotifications;
        settings.GoalCompletedNotifications = dto.GoalCompletedNotifications;
        settings.AiInsightsEnabled = dto.AiInsightsEnabled;
        settings.AiDashboardSuggestionsEnabled = dto.AiDashboardSuggestionsEnabled;
        settings.UpdatedAt = DateTime.UtcNow;

        await _userSettingsRepository.UpdateAsync(settings);

        return settings;
    }
}