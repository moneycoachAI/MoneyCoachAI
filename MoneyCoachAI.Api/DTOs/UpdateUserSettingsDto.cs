namespace MoneyCoachAI.Api.DTOs;

public class UpdateUserSettingsDto
{
    public string Currency { get; set; } = "INR";

    public string DateFormat { get; set; } = "DD/MM/YYYY";

    public bool BudgetWarningNotifications { get; set; } = true;

    public bool BudgetExceededNotifications { get; set; } = true;

    public bool GoalCompletedNotifications { get; set; } = true;

    public bool AiInsightsEnabled { get; set; } = true;

    public bool AiDashboardSuggestionsEnabled { get; set; } = true;
}