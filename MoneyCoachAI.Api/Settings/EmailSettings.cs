namespace MoneyCoachAI.Api.Settings;

public class EmailSettings
{
    public string SmtpServer { get; set; } = "smtp.gmail.com";

    public int SmtpPort { get; set; } = 587;

    public string SenderName { get; set; } = "MoneyCoachAI";

    public string SenderEmail { get; set; } = string.Empty;

    public string Username { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    public string FrontendBaseUrl { get; set; } =
        "http://localhost:5173";
}