using Google.Apis.Auth;
using Microsoft.Extensions.Options;
using MoneyCoachAI.Api.DTOs;
using MoneyCoachAI.Api.Models;
using MoneyCoachAI.Api.Repositories;
using MoneyCoachAI.Api.Settings;

namespace MoneyCoachAI.Api.Services;

public class AuthService
{
    private readonly UserRepository _userRepository;
    private readonly JwtService _jwtService;
    private readonly GoogleAuthSettings _googleSettings;

    public AuthService(
        UserRepository userRepository,
        JwtService jwtService,
        IOptions<GoogleAuthSettings> googleOptions)
    {
        _userRepository = userRepository;
        _jwtService = jwtService;
        _googleSettings = googleOptions.Value;
    }

    // =====================================================
    // REGISTER
    // =====================================================

    public async Task<AuthResponse?> RegisterAsync(
        RegisterRequest request)
    {
        var email = request.Email
            .Trim()
            .ToLowerInvariant();

        var existingUser =
            await _userRepository.GetByEmailAsync(email);

        if (existingUser != null)
        {
            return null;
        }

        var user = new User
        {
            FullName = request.FullName.Trim(),
            Email = email,
            PasswordHash =
                BCrypt.Net.BCrypt.HashPassword(
                    request.Password),
            AuthProvider = "Local",
            CreatedAt = DateTime.UtcNow
        };

        await _userRepository.CreateAsync(user);

        return await CreateAuthResponseAsync(user);
    }

    // =====================================================
    // EMAIL AND PASSWORD LOGIN
    // =====================================================

    public async Task<AuthResponse?> LoginAsync(
        LoginRequest request)
    {
        var email = request.Email
            .Trim()
            .ToLowerInvariant();

        var user =
            await _userRepository.GetByEmailAsync(email);

        if (user == null)
        {
            return null;
        }

        if (string.IsNullOrWhiteSpace(
                user.PasswordHash))
        {
            return null;
        }

        var isPasswordValid =
            BCrypt.Net.BCrypt.Verify(
                request.Password,
                user.PasswordHash);

        if (!isPasswordValid)
        {
            return null;
        }

        return await CreateAuthResponseAsync(user);
    }

    // =====================================================
    // GOOGLE LOGIN
    // =====================================================

    public async Task<AuthResponse?> GoogleLoginAsync(
        GoogleLoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(
                request.Credential))
        {
            return null;
        }

        GoogleJsonWebSignature.Payload payload;

        try
        {
            payload =
                await GoogleJsonWebSignature
                    .ValidateAsync(
                        request.Credential,
                        new GoogleJsonWebSignature
                            .ValidationSettings
                        {
                            Audience = new[]
                            {
                                _googleSettings.ClientId
                            }
                        });
        }
        catch
        {
            return null;
        }

        if (payload.EmailVerified != true)
        {
            return null;
        }

        var email = payload.Email
            .Trim()
            .ToLowerInvariant();

        var user =
            await _userRepository.GetByEmailAsync(email);

        // First Google login
        if (user == null)
        {
            user = new User
            {
                FullName =
                    payload.Name ?? string.Empty,

                Email = email,

                PasswordHash = string.Empty,

                ProfileImageUrl =
                    payload.Picture ?? string.Empty,

                GoogleSubject =
                    payload.Subject ?? string.Empty,

                AuthProvider = "Google",

                CreatedAt = DateTime.UtcNow
            };

            await _userRepository.CreateAsync(user);
        }
        else
        {
            var changed = false;

            if (string.IsNullOrWhiteSpace(
                    user.GoogleSubject))
            {
                user.GoogleSubject =
                    payload.Subject ?? string.Empty;

                changed = true;
            }

            if (
                string.IsNullOrWhiteSpace(
                    user.ProfileImageUrl) &&
                !string.IsNullOrWhiteSpace(
                    payload.Picture))
            {
                user.ProfileImageUrl =
                    payload.Picture;

                changed = true;
            }

            if (
                string.IsNullOrWhiteSpace(
                    user.AuthProvider))
            {
                user.AuthProvider = "Google";

                changed = true;
            }
            else if (
                !user.AuthProvider.Contains(
                    "Google",
                    StringComparison.OrdinalIgnoreCase))
            {
                user.AuthProvider =
                    $"{user.AuthProvider},Google";

                changed = true;
            }

            if (changed)
            {
                await _userRepository.UpdateAsync(user);
            }
        }

        return await CreateAuthResponseAsync(user);
    }

    // =====================================================
    // REFRESH ACCESS TOKEN
    // =====================================================

    public async Task<AuthResponse?> RefreshAsync(
        RefreshTokenRequest request)
    {
        if (string.IsNullOrWhiteSpace(
                request.RefreshToken))
        {
            return null;
        }

        var refreshTokenHash =
            _jwtService.HashRefreshToken(
                request.RefreshToken);

        var user =
            await _userRepository
                .GetByRefreshTokenHashAsync(
                    refreshTokenHash);

        if (user == null)
        {
            return null;
        }

        if (
            string.IsNullOrWhiteSpace(
                user.RefreshTokenHash) ||
            user.RefreshTokenExpiresAt == null)
        {
            return null;
        }

        if (user.RefreshTokenRevokedAt != null)
        {
            return null;
        }

        if (
            user.RefreshTokenExpiresAt.Value
                <= DateTime.UtcNow)
        {
            return null;
        }

        var isValid =
            _jwtService.VerifyRefreshToken(
                request.RefreshToken,
                user.RefreshTokenHash);

        if (!isValid)
        {
            return null;
        }

        // CreateAuthResponseAsync generates a new refresh
        // token, so the old refresh token becomes invalid.
        return await CreateAuthResponseAsync(user);
    }

    // =====================================================
    // LOGOUT
    // =====================================================

    public async Task<bool> LogoutAsync(
        LogoutRequest request)
    {
        if (string.IsNullOrWhiteSpace(
                request.RefreshToken))
        {
            return false;
        }

        var refreshTokenHash =
            _jwtService.HashRefreshToken(
                request.RefreshToken);

        var user =
            await _userRepository
                .GetByRefreshTokenHashAsync(
                    refreshTokenHash);

        if (user == null ||
            string.IsNullOrWhiteSpace(user.Id))
        {
            return false;
        }

        var isValid =
            _jwtService.VerifyRefreshToken(
                request.RefreshToken,
                user.RefreshTokenHash);

        if (!isValid)
        {
            return false;
        }

        await _userRepository
            .RevokeRefreshTokenAsync(
                user.Id,
                DateTime.UtcNow);

        return true;
    }

    // =====================================================
    // CREATE ACCESS AND REFRESH TOKENS
    // =====================================================

    private async Task<AuthResponse>
        CreateAuthResponseAsync(User user)
    {
        if (string.IsNullOrWhiteSpace(user.Id))
        {
            throw new InvalidOperationException(
                "Cannot create authentication tokens " +
                "for a user without an ID.");
        }

        var accessToken =
            _jwtService.GenerateToken(user);

        var accessTokenExpiresAt =
            _jwtService.GetAccessTokenExpiry();

        var refreshToken =
            _jwtService.GenerateRefreshToken();

        var refreshTokenHash =
            _jwtService.HashRefreshToken(
                refreshToken);

        var refreshTokenCreatedAt =
            DateTime.UtcNow;

        var refreshTokenExpiresAt =
            _jwtService.GetRefreshTokenExpiry();

        await _userRepository
            .SaveRefreshTokenAsync(
                user.Id,
                refreshTokenHash,
                refreshTokenCreatedAt,
                refreshTokenExpiresAt);

        return new AuthResponse
        {
            Token = accessToken,

            RefreshToken = refreshToken,

            AccessTokenExpiresAt =
                accessTokenExpiresAt,

            RefreshTokenExpiresAt =
                refreshTokenExpiresAt,

            UserId = user.Id,

            Email = user.Email
        };
    }
}