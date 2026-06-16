namespace MoneyCoachAI.Api.DTOs;

public class SuggestionResponse
{
    public string Type { get; set; } = string.Empty;

    public string Category { get; set; } = string.Empty;

    public string Severity { get; set; } = string.Empty;

    public string Message { get; set; } = string.Empty;
}