using System.ComponentModel.DataAnnotations;

namespace MoneyCoachAI.Api.DTOs;

public class ValidateResetTokenRequest
{
    [Required]
    public string Token { get; set; } = string.Empty;
}