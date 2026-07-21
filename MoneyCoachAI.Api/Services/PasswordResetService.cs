using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using MoneyCoachAI.Api.Repositories;
using MoneyCoachAI.Api.Settings;

namespace MoneyCoachAI.Api.Services;

public class PasswordResetService
{
    private readonly UserRepository _userRepository;

    private readonly PasswordResetTokenRepository
        _tokenRepository;

    private readonly EmailService _emailService;

    private readonly EmailSettings _emailSettings;

    public PasswordResetService(
        UserRepository userRepository,
        PasswordResetTokenRepository
            tokenRepository,
        EmailService emailService,
        IOptions<EmailSettings> emailOptions
    )
    {
        _userRepository = userRepository;
        _tokenRepository = tokenRepository;
        _emailService = emailService;
        _emailSettings = emailOptions.Value;
    }

    public async Task RequestPasswordResetAsync(
        string email
    )
    {
        var normalizedEmail = email
            .Trim()
            .ToLowerInvariant();

        var user =
            await _userRepository.GetByEmailAsync(
                normalizedEmail
            );

        // Always return normally so attackers cannot
        // determine whether an account exists.
        if (user is null)
        {
            return;
        }

        await _tokenRepository.InvalidateUserTokensAsync(user.Id!);

        var rawToken = GenerateSecureToken();
        var tokenHash = HashToken(rawToken);

        var resetToken =
            new Models.PasswordResetToken
            {
                UserId = user.Id!,
                TokenHash = tokenHash,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt =
                    DateTime.UtcNow.AddMinutes(30),
                IsUsed = false
            };

        await _tokenRepository.CreateAsync(
            resetToken
        );

        var encodedToken =
            Uri.EscapeDataString(rawToken);

        var frontendUrl =
            _emailSettings.FrontendBaseUrl
                .TrimEnd('/');

        var resetLink =
            $"{frontendUrl}/reset-password?token={encodedToken}";

        await _emailService
            .SendPasswordResetEmailAsync(
                user.Email,
                user.FullName,
                resetLink
            );
    }

    public async Task<bool> ValidateTokenAsync(
        string rawToken
    )
    {
        if (string.IsNullOrWhiteSpace(rawToken))
        {
            return false;
        }

        var tokenHash = HashToken(rawToken);

        var token =
            await _tokenRepository
                .GetActiveByHashAsync(tokenHash);

        return token is not null;
    }

    public async Task ResetPasswordAsync(
        string rawToken,
        string newPassword,
        string confirmPassword
    )
    {
        if (newPassword != confirmPassword)
        {
            throw new ArgumentException(
                "Passwords do not match."
            );
        }

        ValidatePassword(newPassword);

        var tokenHash = HashToken(rawToken);

        var resetToken =
            await _tokenRepository
                .GetActiveByHashAsync(tokenHash);

        if (resetToken is null)
        {
            throw new InvalidOperationException(
                "The password reset link is invalid or has expired."
            );
        }

        var passwordHash =
            BCrypt.Net.BCrypt.HashPassword(
                newPassword
            );

        await _userRepository.UpdatePasswordAsync(
            resetToken.UserId,
            passwordHash
        );

        await _tokenRepository.MarkAsUsedAsync(
            resetToken.Id
        );

        await _tokenRepository
            .InvalidateUserTokensAsync(
                resetToken.UserId
            );
    }

    private static string GenerateSecureToken()
    {
        var bytes =
            RandomNumberGenerator.GetBytes(48);

        return Convert.ToBase64String(bytes)
            .Replace("+", "-")
            .Replace("/", "_")
            .TrimEnd('=');
    }

    private static string HashToken(
        string rawToken
    )
    {
        var bytes = Encoding.UTF8.GetBytes(
            rawToken
        );

        var hash = SHA256.HashData(bytes);

        return Convert.ToHexString(hash);
    }

    private static void ValidatePassword(
        string password
    )
    {
        if (password.Length < 8)
        {
            throw new ArgumentException(
                "Password must contain at least 8 characters."
            );
        }

        if (!password.Any(char.IsUpper))
        {
            throw new ArgumentException(
                "Password must contain an uppercase letter."
            );
        }

        if (!password.Any(char.IsLower))
        {
            throw new ArgumentException(
                "Password must contain a lowercase letter."
            );
        }

        if (!password.Any(char.IsDigit))
        {
            throw new ArgumentException(
                "Password must contain a number."
            );
        }
    }
}