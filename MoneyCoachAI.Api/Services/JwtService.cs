using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using MoneyCoachAI.Api.Models;
using MoneyCoachAI.Api.Settings;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace MoneyCoachAI.Api.Services;

public class JwtService
{
    private readonly JwtSettings _jwtSettings;

    public JwtService(IOptions<JwtSettings> jwtSettings)
    {
        _jwtSettings = jwtSettings.Value;
    }

    // =====================================================
    // ACCESS TOKEN
    // =====================================================

    public string GenerateToken(User user)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id!),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.FullName)
        };

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_jwtSettings.SecretKey));

        var credentials = new SigningCredentials(
            key,
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_jwtSettings.ExpiryMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    // =====================================================
    // ACCESS TOKEN EXPIRY
    // =====================================================

    public DateTime GetAccessTokenExpiry()
    {
        return DateTime.UtcNow.AddMinutes(
            _jwtSettings.ExpiryMinutes);
    }

    // =====================================================
    // REFRESH TOKEN
    // =====================================================

    public string GenerateRefreshToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(64);

        return Convert.ToBase64String(bytes);
    }

    // =====================================================
    // REFRESH TOKEN HASH
    // =====================================================

    public string HashRefreshToken(string refreshToken)
    {
        using var sha = SHA256.Create();

        var hash = sha.ComputeHash(
            Encoding.UTF8.GetBytes(refreshToken));

        return Convert.ToBase64String(hash);
    }

    // =====================================================
    // VERIFY HASH
    // =====================================================

    public bool VerifyRefreshToken(
        string refreshToken,
        string storedHash)
    {
        var hash = HashRefreshToken(refreshToken);

        return hash == storedHash;
    }

    // =====================================================
    // REFRESH TOKEN EXPIRY
    // =====================================================

    public DateTime GetRefreshTokenExpiry()
    {
        return DateTime.UtcNow.AddDays(
            _jwtSettings.RefreshTokenExpiryDays);
    }
}