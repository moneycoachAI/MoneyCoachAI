using Microsoft.AspNetCore.Mvc;
using MoneyCoachAI.Api.DTOs;
using MoneyCoachAI.Api.Services;

namespace MoneyCoachAI.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;

    public AuthController(AuthService authService)
    {
        _authService = authService;
    }

    // =====================================================
    // REGISTER
    // =====================================================

    [HttpPost("register")]
    public async Task<IActionResult> Register(
        RegisterRequest request)
    {
        var result =
            await _authService.RegisterAsync(request);

        if (result == null)
        {
            return BadRequest("User already exists.");
        }

        return Ok(result);
    }

    // =====================================================
    // LOGIN
    // =====================================================

    [HttpPost("login")]
    public async Task<IActionResult> Login(
        LoginRequest request)
    {
        var result =
            await _authService.LoginAsync(request);

        if (result == null)
        {
            return Unauthorized(
                "Invalid email or password.");
        }

        return Ok(result);
    }

    // =====================================================
    // GOOGLE LOGIN
    // =====================================================

    [HttpPost("google")]
    public async Task<IActionResult> GoogleLogin(
        GoogleLoginRequest request)
    {
        var result =
            await _authService.GoogleLoginAsync(request);

        if (result == null)
        {
            return Unauthorized(
                "Google authentication failed.");
        }

        return Ok(result);
    }

    // =====================================================
    // REFRESH TOKEN
    // =====================================================

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh(
        RefreshTokenRequest request)
    {
        var result =
            await _authService.RefreshAsync(request);

        if (result == null)
        {
            return Unauthorized(
                "Refresh token is invalid or expired.");
        }

        return Ok(result);
    }

    // =====================================================
    // LOGOUT
    // =====================================================

    [HttpPost("logout")]
    public async Task<IActionResult> Logout(
        LogoutRequest request)
    {
        var success =
            await _authService.LogoutAsync(request);

        if (!success)
        {
            return BadRequest(
                "Logout failed.");
        }

        return Ok(
            new
            {
                message = "Logged out successfully."
            });
    }
}