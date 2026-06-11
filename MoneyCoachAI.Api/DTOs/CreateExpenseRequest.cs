namespace MoneyCoachAI.Api.DTOs;

public class CreateExpenseRequest
{
    public decimal Amount { get; set; } 

    public string Category { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public DateTime Date { get; set; } 
}