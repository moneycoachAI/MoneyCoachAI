using System.ComponentModel.DataAnnotations;

namespace MoneyCoachAI.Api.DTOs;

public class LogoutRequest
{
    [Required]
    public string RefreshToken { get; set; } = string.Empty;
}