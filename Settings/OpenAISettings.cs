namespace MoneyCoachAI.Api.Settings;

public class OpenAISettings
{
    public string ApiKey { get; set; } = string.Empty; //OpenAI secret key
    public string Model { get; set; } = string.Empty; // AI model name
}