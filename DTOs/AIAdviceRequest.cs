namespace MoneyCoachAI.Api.DTOs;

public class AIAdviceRequest
{
    public int Month { get; set; }

    public int Year { get; set; }

    public string Question { get; set; } = string.Empty;
}