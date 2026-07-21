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

    // -----------------------------
    // Register
    // -----------------------------
    public async Task<AuthResponse?> RegisterAsync(RegisterRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        var existingUser = await _userRepository.GetByEmailAsync(email);

        if (existingUser != null)
            return null;

        var user = new User
        {
            FullName = request.FullName.Trim(),
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            AuthProvider = "Local",
            CreatedAt = DateTime.UtcNow
        };

        await _userRepository.CreateAsync(user);

        return CreateResponse(user);
    }

    // -----------------------------
    // Login
    // -----------------------------
    public async Task<AuthResponse?> LoginAsync(LoginRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        var user = await _userRepository.GetByEmailAsync(email);

        if (user == null)
            return null;

        if (string.IsNullOrWhiteSpace(user.PasswordHash))
            return null;

        var valid = BCrypt.Net.BCrypt.Verify(
            request.Password,
            user.PasswordHash);

        if (!valid)
            return null;

        return CreateResponse(user);
    }

    // -----------------------------
    // Google Login
    // -----------------------------
    public async Task<AuthResponse?> GoogleLoginAsync(
        GoogleLoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Credential))
            return null;

        GoogleJsonWebSignature.Payload payload;

        try
        {
            payload = await GoogleJsonWebSignature.ValidateAsync(
                request.Credential,
                new GoogleJsonWebSignature.ValidationSettings
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
            return null;

        var email = payload.Email.ToLowerInvariant();

        var user = await _userRepository.GetByEmailAsync(email);

        // --------------------------------
        // First Google Login
        // --------------------------------
        if (user == null)
        {
            user = new User
            {
                FullName = payload.Name,
                Email = email,
                PasswordHash = "",
                ProfileImageUrl = payload.Picture ?? "",
                GoogleSubject = payload.Subject,
                AuthProvider = "Google",
                CreatedAt = DateTime.UtcNow
            };

            await _userRepository.CreateAsync(user);
        }
        else
        {
            bool changed = false;

            if (string.IsNullOrWhiteSpace(user.GoogleSubject))
            {
                user.GoogleSubject = payload.Subject;
                changed = true;
            }

            if (string.IsNullOrWhiteSpace(user.ProfileImageUrl)
                && !string.IsNullOrWhiteSpace(payload.Picture))
            {
                user.ProfileImageUrl = payload.Picture;
                changed = true;
            }

            if (!user.AuthProvider.Contains("Google"))
            {
                user.AuthProvider += ",Google";
                changed = true;
            }

            if (changed)
            {
                await _userRepository.UpdateAsync(user);
            }
        }

        return CreateResponse(user);
    }

    // -----------------------------
    // Shared JWT Response
    // -----------------------------
    private AuthResponse CreateResponse(User user)
    {
        return new AuthResponse
        {
            Token = _jwtService.GenerateToken(user),
            UserId = user.Id!,
            Email = user.Email
        };
    }
}