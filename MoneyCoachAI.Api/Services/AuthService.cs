using MoneyCoachAI.Api.DTOs;
using MoneyCoachAI.Api.Models;
using MoneyCoachAI.Api.Repositories;

namespace MoneyCoachAI.Api.Services;

public class AuthService
{
    private readonly UserRepository _userRepository;
    private readonly JwtService _jwtService;

    public AuthService(UserRepository userRepository, JwtService jwtService)
    {
        _userRepository = userRepository;
        _jwtService = jwtService;
    }

    public async Task<AuthResponse?> RegisterAsync(RegisterRequest request)
    {
        var existingUser = await _userRepository.GetByEmailAsync(request.Email.ToLower());

        if (existingUser != null)
        {
            return null;
        }

        var user = new User
        {
            FullName = request.FullName,
            Email = request.Email.ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            CreatedAt = DateTime.UtcNow
        };

        await _userRepository.CreateAsync(user);

        var token = _jwtService.GenerateToken(user);

        return new AuthResponse
        {
            Token = token,
            UserId = user.Id!,
            Email = user.Email
        };
    }

    public async Task<AuthResponse?> LoginAsync(LoginRequest request)
    {
        var user = await _userRepository.GetByEmailAsync(request.Email.ToLower());

        if (user == null)
        {
            return null;
        }

        var isPasswordValid = BCrypt.Net.BCrypt.Verify(
            request.Password,
            user.PasswordHash);

        if (!isPasswordValid)
        {
            return null;
        }

        var token = _jwtService.GenerateToken(user);

        return new AuthResponse
        {
            Token = token,
            UserId = user.Id!,
            Email = user.Email
        };
    }
}