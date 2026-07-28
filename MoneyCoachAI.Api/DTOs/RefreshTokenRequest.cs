using System.ComponentModel.DataAnnotations;

namespace MoneyCoachAI.Api.DTOs;

public class RefreshTokenRequest
{
    [Required]
    public string RefreshToken { get; set; } = string.Empty;
}