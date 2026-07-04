namespace MoneyCoachAI.Api.DTOs;

public class CreateNotificationDto
{
    public string Title { get; set; } = string.Empty;

    public string Message { get; set; } = string.Empty;

    public string Type { get; set; } = "Info";
}